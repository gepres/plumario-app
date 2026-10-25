import type { Achievement } from '@plumario/core';
import type { MedalKind } from '@plumario/ui';

import { ALBUM_HABITAT_LABELS, HABITAT_MEDALS } from './habitats';

// Textos de las medallas (CatalogoLogros, Main, Celebracion).

/** La medalla que se dibuja para cada logro. */
export function medalKind(achievement: Achievement): MedalKind {
  return achievement.kind === 'habitatComplete' ? achievement.habitat : achievement.kind;
}

/** El nombre corto de la medalla («Mi primera ave», «10 especies», «Litoral y mar»). */
export function achievementLabel(achievement: Achievement): string {
  switch (achievement.kind) {
    case 'firstBird': return 'Mi primera ave';
    case 'explorer': return 'Explorador de Ica';
    case 'milestone': return `${achievement.species} especies`;
    case 'habitatComplete': return ALBUM_HABITAT_LABELS[achievement.habitat];
    case 'albumComplete': return 'Bronce · álbum';
  }
}

/** El nombre completo («Medalla de 20 especies», «Medalla del litoral»). */
export function achievementTitle(achievement: Achievement): string {
  switch (achievement.kind) {
    case 'firstBird': return 'Medalla Mi primera ave';
    case 'explorer': return 'Medalla Explorador de Ica';
    case 'milestone': return `Medalla de ${achievement.species} especies`;
    case 'habitatComplete': return HABITAT_MEDALS[achievement.habitat].title;
    case 'albumComplete': return 'Medalla de bronce del álbum';
  }
}

/** Lo que dice la celebración al ganarla. */
export function achievementCelebration(achievement: Achievement): { title: string; text: string } {
  switch (achievement.kind) {
    case 'firstBird':
      return { title: '¡Tu primera ave!', text: 'Completaste tu primer sticker con una foto tuya. Así empieza tu álbum.' };
    case 'explorer':
      return { title: '¡Explorador de Ica!', text: 'Ya tienes 5 especies distintas. Sigue buscando en otros hábitats.' };
    case 'milestone':
      return {
        title: `¡${achievement.species} especies!`,
        text:
          achievement.species === 10
            ? 'Completaste tus primeros 10 stickers. Con ellos se arma tu primer póster.'
            : `Llegaste a ${achievement.species} especies. Con 10 de tus stickers se arma un póster nuevo.`,
      };
    case 'habitatComplete':
      return { title: `¡${ALBUM_HABITAT_LABELS[achievement.habitat]} completo!`, text: `Tienes todas las aves de ${HABITAT_MEDALS[achievement.habitat].places}. Ya puedes descargar su póster.` };
    case 'albumComplete':
      return { title: '¡Álbum completo!', text: 'Registraste todas las especies de la edición inicial. Te ganaste la medalla de bronce.' };
  }
}
