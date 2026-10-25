import { POSTER_TITLE_MAX, type SavedPoster } from '../../domain/posters';
import type { UserId } from '../../domain/sighting';
import type { PosterRepository } from '../ports/poster-repository';

export class PosterTitleError extends Error {
  constructor() {
    super(`El título va de 1 a ${POSTER_TITLE_MAX} caracteres`);
    this.name = 'PosterTitleError';
  }
}

/** Caso de uso: guardar un póster con su título («Guardar póster»); después queda fijo. */
export function makeSavePoster(deps: { posters: PosterRepository; now: () => Date }) {
  return async (userId: UserId, poster: Omit<SavedPoster, 'id' | 'savedAt'>): Promise<string> => {
    const title = poster.title.trim();
    if (!title || title.length > POSTER_TITLE_MAX) throw new PosterTitleError();
    return deps.posters.save(userId, { ...poster, title, savedAt: deps.now() });
  };
}
