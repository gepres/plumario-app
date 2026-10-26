import type { Achievement, Habitat, NotificationTopic } from '@plumario/core';

// Lo que dice cada aviso push. Los nombres de las medallas son los de la app
// (apps/mobile/src/constants/achievements.ts): si cambian allá, cambian acá.

export type Notice = {
  topic: NotificationTopic;
  title: string;
  body: string;
  /** La pantalla que abre al tocarlo (una ruta de la app). */
  path: string;
};

const HABITAT_MEDALS: Record<Habitat, string> = {
  coast: 'Medalla del litoral',
  wetlands: 'Medalla de los humedales',
  desert: 'Medalla del desierto',
  highlands: 'Medalla de la sierra',
  openSea: 'Medalla del mar abierto',
};

function medalName(achievement: Achievement): string {
  switch (achievement.kind) {
    case 'firstBird': return 'Medalla Mi primera ave';
    case 'explorer': return 'Medalla Explorador de Ica';
    case 'milestone': return `Medalla de ${achievement.species} especies`;
    case 'habitatComplete': return HABITAT_MEDALS[achievement.habitat];
    case 'albumComplete': return 'Medalla de bronce del álbum';
  }
}

/** Una o más medallas nuevas, en un solo aviso. */
export function achievementsNotice(achievements: readonly Achievement[]): Notice | null {
  const [first] = achievements;
  if (!first) return null;
  return {
    topic: 'achievements',
    title: achievements.length === 1 ? '¡Medalla nueva!' : `¡${achievements.length} medallas nuevas!`,
    body: achievements.length === 1 ? `Ganaste la ${medalName(first)}.` : `Ganaste la ${medalName(first)} y ${achievements.length - 1} más.`,
    path: '/rewards',
  };
}

/** A quien propuso: alguien aceptó y ya tiene el cromo que pidió. */
export function tradeAcceptedNotice({ handle, speciesName }: { handle: string; speciesName: string | null }): Notice {
  return {
    topic: 'trades',
    title: 'Aceptaron tu intercambio',
    body: speciesName ? `@${handle} aceptó: ya tienes su cromo de ${speciesName}.` : `@${handle} aceptó: ya tienes su cromo en tu álbum.`,
    path: '/profile/trades',
  };
}

/** A quien la pidió con «Avísame cuando esté». */
export function regionOpenedNotice(regionName: string): Notice {
  return {
    topic: 'regions',
    title: `¡${regionName} ya está en Plumario!`,
    body: 'La región que esperabas abrió su álbum. Ya puedes coleccionar sus aves.',
    path: '/regions',
  };
}
