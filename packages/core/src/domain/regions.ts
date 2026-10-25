import type { RegionId, SpeciesId } from './species';

// Regiones-álbum (design/project/SistemaRegiones.dc.html): cada región del Perú es un álbum con sus
// propias aves, medallas y pósteres. Hoy solo Ica está disponible; el resto, «Próximamente».

export type Region = {
  id: RegionId;
  /** El id del mapa (design/project/RegionMapa.dc.html): ICA, ARE… */
  mapId: string;
  name: string;
  available: boolean;
  /** InicioVacio, «Fáciles de ver en la ciudad»: las primeras que conviene buscar. */
  easySpecies: readonly SpeciesId[];
};

const soon = (mapId: string, name: string): Region => ({ id: mapId.toLowerCase(), mapId, name, available: false, easySpecies: [] });

/** Las 24 regiones, en orden alfabético. */
export const REGIONS: readonly Region[] = [
  soon('AMA', 'Amazonas'),
  soon('ANC', 'Áncash'),
  soon('APU', 'Apurímac'),
  soon('ARE', 'Arequipa'),
  soon('AYA', 'Ayacucho'),
  soon('CAJ', 'Cajamarca'),
  soon('CUS', 'Cusco'),
  soon('HUV', 'Huancavelica'),
  soon('HUC', 'Huánuco'),
  {
    id: 'ica',
    mapId: 'ICA',
    name: 'Ica',
    available: true,
    // Comunes en la ciudad y los valles: gorrión, tórtola, gallinazo y paloma.
    easySpecies: ['zonotrichia-capensis', 'zenaida-meloda', 'coragyps-atratus', 'columba-livia'],
  },
  soon('JUN', 'Junín'),
  soon('LAL', 'La Libertad'),
  soon('LAM', 'Lambayeque'),
  soon('LIM', 'Lima y Callao'),
  soon('LOR', 'Loreto'),
  soon('MDD', 'Madre de Dios'),
  soon('MOQ', 'Moquegua'),
  soon('PAS', 'Pasco'),
  soon('PIU', 'Piura'),
  soon('PUN', 'Puno'),
  soon('SAM', 'San Martín'),
  soon('TAC', 'Tacna'),
  soon('TUM', 'Tumbes'),
  soon('UCA', 'Ucayali'),
];

export const regionById = (id: RegionId) => REGIONS.find((r) => r.id === id);
export const regionByMapId = (mapId: string) => REGIONS.find((r) => r.mapId === mapId);

/** RegionLista, «Buscar región»: sin importar tildes ni mayúsculas. */
export function searchRegions(query: string): Region[] {
  const plain = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const q = plain(query.trim());
  return REGIONS.filter((r) => !q || plain(r.name).includes(q));
}
