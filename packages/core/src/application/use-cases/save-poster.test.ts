import { describe, expect, it } from 'vitest';

import type { SavedPoster } from '../../domain/posters';
import type { PosterRepository } from '../ports/poster-repository';
import { PosterTitleError, makeSavePoster } from './save-poster';

describe('guardar un póster', () => {
  const saved: Omit<SavedPoster, 'id'>[] = [];
  const posters: PosterRepository = { listByUser: async () => [], save: async (_u, p) => (saved.push(p), 'p1') };
  const save = makeSavePoster({ posters, now: () => new Date(2026, 9, 25) });
  const poster = { kind: 'species', number: 1, habitat: null, speciesIds: ['a'], seed: 7, theme: 'light', title: '  Mis aves de Ica  ' } as const;

  it('guarda con el título recortado y la fecha', async () => {
    await expect(save('u1', poster)).resolves.toBe('p1');
    expect(saved[0]).toMatchObject({ title: 'Mis aves de Ica', savedAt: new Date(2026, 9, 25) });
  });

  it('el título va de 1 a 22 caracteres', async () => {
    await expect(save('u1', { ...poster, title: '   ' })).rejects.toBeInstanceOf(PosterTitleError);
    await expect(save('u1', { ...poster, title: 'x'.repeat(23) })).rejects.toBeInstanceOf(PosterTitleError);
  });
});
