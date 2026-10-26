import { logger } from 'firebase-functions/v2';

// Cliente mínimo de la API de Gemini (generateContent por REST, sin SDK): una foto y un texto, y la
// respuesta en JSON con el esquema que se pide. La clave es un secreto de Functions (GEMINI_API_KEY)
// y nunca viaja a la app.
//
// Modelos: gemini-3.6-flash acierta y responde en unos 3 s. Si está saturado (503, o no responde en
// 15 s) o pide esperar (429), se pasa enseguida a gemini-3.5-flash-lite, más barato y de otra cola, y
// al final se vuelve a probar el principal: quien registra está mirando la pantalla. gemini-3.8-flash
// también acierta, pero el 25 oct 2026 tardaba hasta 100 s por la demanda.

export const PRIMARY_MODEL = 'gemini-3.6-flash';
export const FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 1_000;
// Se reintentan los errores pasajeros; uno de formato (400) o de clave (403) no se arregla insistiendo.
const TRANSIENT = new Set([429, 500, 502, 503, 504]);

export type GeminiImage = { mimeType: string; data: string };

export type GeminiRequest = {
  system: string;
  image: GeminiImage;
  prompt: string;
  /** JSON Schema de la respuesta. */
  schema: Record<string, unknown>;
};

/** Pide una respuesta JSON a Gemini sobre una foto. */
export type AskGemini = <T>(request: GeminiRequest) => Promise<T>;

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate<T>(apiKey: string, model: string, { system, image, prompt, schema }: GeminiRequest): Promise<T> {
  const response = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ inlineData: image }, { text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, thinkingConfig: { thinkingLevel: 'low' } },
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    usageMetadata?: { totalTokenCount?: number };
  } | null;
  if (!response.ok) throw new GeminiError(body?.error?.message ?? `HTTP ${response.status}`, response.status);
  const text = body?.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  if (!text) throw new GeminiError('Gemini respondió sin texto', 502);
  logger.debug('Gemini', { model, tokens: body?.usageMetadata?.totalTokenCount });
  return JSON.parse(text) as T;
}

/** El cliente con modelo de reserva y un último reintento. */
export function createGemini(apiKey: string): AskGemini {
  return async <T>(request: GeminiRequest): Promise<T> => {
    const attempts = [PRIMARY_MODEL, FALLBACK_MODEL, PRIMARY_MODEL];
    let lastError: unknown;
    for (const [i, model] of attempts.entries()) {
      if (i > 0) await sleep(RETRY_DELAY_MS);
      try {
        return await generate<T>(apiKey, model, request);
      } catch (error) {
        lastError = error;
        // Se agotó el tiempo: es la demanda del modelo, como un 503.
        const transient = error instanceof GeminiError ? TRANSIENT.has(error.status) : error instanceof Error && error.name === 'TimeoutError';
        if (!transient) throw error;
        logger.warn('Gemini no respondió, se reintenta', { model, error: String(error) });
      }
    }
    throw lastError;
  };
}
