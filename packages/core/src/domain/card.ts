// Los acabados de una carta (docs/card-progression.md). Se ganan por especie: que un ave sea amenazada,
// endémica o emblemática es un sello y nunca decide el acabado.

export type CardCategory = 'holographic' | 'silver' | 'gold' | 'ruby' | 'diamond';

/** De menor a mayor. */
export const CATEGORY_RANK: Record<CardCategory, number> = { holographic: 0, silver: 1, gold: 2, ruby: 3, diamond: 4 };

/** Probabilidad de holográfico en la primera observación de una especie. */
export const CHROME_CHANCE = 1 / 8;

export type Milestone = { observations: number; finish: CardCategory };

/** Los hitos son seguros: llegar a esas observaciones da el acabado sin depender de la suerte. */
export const MILESTONES: readonly Milestone[] = [
  { observations: 3, finish: 'holographic' },
  { observations: 5, finish: 'silver' },
  { observations: 10, finish: 'gold' },
  { observations: 20, finish: 'ruby' },
  { observations: 35, finish: 'diamond' },
];

/** El mejor de dos acabados; null es la carta normal, sin acabado. */
export function betterFinish(a: CardCategory | null, b: CardCategory | null): CardCategory | null {
  if (!a) return b;
  if (!b) return a;
  return CATEGORY_RANK[a] >= CATEGORY_RANK[b] ? a : b;
}

/** El hito que sigue a estas observaciones; null si ya los alcanzó todos. */
export const nextFinishMilestone = (observations: number): Milestone | null => MILESTONES.find((m) => m.observations > observations) ?? null;

/** «Uno por uno, y cada parte entrega el mismo acabado» se decide en la fase 2B; hoy el intercambio está en pausa. */
export function isFairTrade(offered: CardCategory, requested: CardCategory): boolean {
  return CATEGORY_RANK[offered] >= CATEGORY_RANK[requested];
}
