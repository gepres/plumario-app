import type { RegionId, SpeciesId } from './species';

export type UserId = string;

/** Un registro: la foto de un ave que el usuario identificó y pegó en su álbum. */
export type Sighting = {
  id: string;
  userId: UserId;
  speciesId: SpeciesId;
  regionId: RegionId;
  takenAt: Date;
};
