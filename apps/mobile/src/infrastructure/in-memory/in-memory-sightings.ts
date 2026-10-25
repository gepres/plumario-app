import {
  evaluateValidatedPhoto,
  sightingResultOf,
  type PhotoStorage,
  type Sighting,
  type SightingRepository,
  type SpeciesCatalog,
  type SpeciesIdentifier,
} from '@plumario/core';

import type { InMemoryAchievementRepository } from './in-memory-achievement-repository';
import type { InMemoryStickerRepository } from './in-memory-sticker-repository';

/** Adaptador en memoria del puerto PhotoStorage: la foto queda donde está y la ruta es su URI. */
export const inMemoryPhotoStorage: PhotoStorage = {
  upload: async (_userId, localUri) => localUri,
  urlFor: async (path) => path,
};

/** Tiempo que simula la validación del servidor, para ver la espera como en la app real. */
const VALIDATION_DELAY = 900;

/**
 * Adaptador en memoria del puerto SightingRepository, para la vista web. Hace también lo que en
 * Firebase hace la Cloud Function onSightingCreated: valida la foto y otorga sticker y cromo con
 * evaluateValidatedPhoto, la misma regla del núcleo.
 */
export class InMemorySightingRepository implements SightingRepository {
  private readonly sightings = new Map<string, Sighting>();
  private readonly listeners = new Map<string, Set<(sighting: Sighting | null) => void>>();
  private nextId = 1;

  constructor(
    private readonly deps: { catalog: SpeciesCatalog; stickers: InMemoryStickerRepository; achievements: InMemoryAchievementRepository; identifier: SpeciesIdentifier },
  ) {}

  newId = () => `sighting-${this.nextId++}`;

  async add(sighting: Sighting): Promise<void> {
    this.sightings.set(sighting.id, sighting);
    setTimeout(() => void this.validate(sighting), VALIDATION_DELAY);
  }

  watch(_userId: string, sightingId: string, listener: (sighting: Sighting | null) => void) {
    const set = this.listeners.get(sightingId) ?? new Set();
    set.add(listener);
    this.listeners.set(sightingId, set);
    listener(this.sightings.get(sightingId) ?? null);
    return () => {
      set.delete(listener);
    };
  }

  async listBySpecies(userId: string, speciesId: string): Promise<readonly Sighting[]> {
    return [...this.sightings.values()]
      .filter((s) => s.userId === userId && s.speciesId === speciesId)
      .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());
  }

  private async validate(sighting: Sighting) {
    const catalog = await this.deps.catalog.listByRegion(sighting.regionId);
    const species = catalog.find((s) => s.id === sighting.speciesId);
    const verdict = species ? await this.deps.identifier.validate(sighting.photoPath ?? '', species) : { valid: false, reason: 'Especie desconocida.' };
    let updated: Sighting;
    if (!species || !verdict.valid) {
      updated = { ...sighting, status: 'rejected', result: { outcome: 'rejected', reason: verdict.reason ?? 'No se reconoce la especie.' } };
    } else {
      const stickers = await this.deps.stickers.listByUser(sighting.userId);
      const now = new Date();
      const result = evaluateValidatedPhoto({ species, catalog, stickers, at: now, roll: Math.random() });
      this.deps.stickers.save(sighting.userId, result.sticker);
      this.deps.achievements.grant(sighting.userId, result.achievements, now);
      updated = { ...sighting, status: 'validated', result: sightingResultOf(result) };
    }
    this.sightings.set(sighting.id, updated);
    for (const listener of this.listeners.get(sighting.id) ?? []) listener(updated);
  }
}
