import { describe, expect, it } from 'vitest';

import { achievementsNotice, regionOpenedNotice, tradeAcceptedNotice } from '../src/notices.js';

describe('avisos push', () => {
  it('una medalla, varias o ninguna', () => {
    expect(achievementsNotice([])).toBeNull();
    expect(achievementsNotice([{ kind: 'milestone', species: 20 }])).toEqual({
      topic: 'achievements',
      title: '¡Medalla nueva!',
      body: 'Ganaste la Medalla de 20 especies.',
      path: '/rewards',
    });
    expect(achievementsNotice([{ kind: 'habitatComplete', habitat: 'wetlands' }, { kind: 'explorer' }])).toMatchObject({
      title: '¡2 medallas nuevas!',
      body: 'Ganaste la Medalla de los humedales y 1 más.',
    });
  });

  it('intercambio aceptado, con o sin el nombre de la especie', () => {
    expect(tradeAcceptedNotice({ handle: 'beto.ica', speciesName: 'Pelícano Peruano' })).toMatchObject({
      topic: 'trades',
      body: '@beto.ica aceptó: ya tienes su cromo de Pelícano Peruano.',
      path: '/profile/trades',
    });
    expect(tradeAcceptedNotice({ handle: 'beto.ica', speciesName: null }).body).toBe('@beto.ica aceptó: ya tienes su cromo en tu álbum.');
  });

  it('región abierta', () => {
    expect(regionOpenedNotice('Arequipa')).toMatchObject({ topic: 'regions', title: '¡Arequipa ya está en Plumario!', path: '/regions' });
  });
});
