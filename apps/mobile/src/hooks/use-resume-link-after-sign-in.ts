import { useLinkingURL, parse } from 'expo-linking';
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

/** Los enlaces que se comparten fuera de la app y hay que abrir aunque llegue sin sesión. */
const RESUMABLE = /^trade\/[A-Za-z0-9_-]+$/;

/**
 * Si se abre un enlace de propuesta sin sesión, Stack.Protected manda a Login y el destino se
 * pierde: se guarda acá y, apenas se entra, se abre la propuesta.
 */
export function useResumeLinkAfterSignIn(signedIn: boolean) {
  const url = useLinkingURL();
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (signedIn || !url) return;
    // En plumario://trade/abc, «trade» llega como hostname y «abc» como path.
    const { hostname, path } = parse(url);
    const route = [hostname, path].filter(Boolean).join('/').replace(/^\/+/, '');
    if (RESUMABLE.test(route)) pending.current = `/${route}`;
  }, [url, signedIn]);

  useEffect(() => {
    if (!signedIn || !pending.current) return;
    const target = pending.current as Href;
    pending.current = null;
    // Después de que Stack.Protected lleve a Inicio; si no, esa redirección taparía la propuesta.
    const timer = setTimeout(() => router.push(target), 300);
    return () => clearTimeout(timer);
  }, [signedIn]);
}
