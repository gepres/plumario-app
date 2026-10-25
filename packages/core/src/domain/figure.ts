// Figuras de las aves (design/project/SistemaSiluetas.dc.html): 24 grupos cubren todas las especies.
// Cada especie usa la figura de su grupo: en color en el sticker normal y en negro, tenue, cuando
// está en sombra. Se elige por familia; en Laridae, el género separa gaviotas de gaviotines.

export const FIGURES = [
  'songbird', // Pájaro
  'shorebird', // Playero
  'seabird', // Ave marina
  'gull', // Gaviota
  'swallow', // Golondrina
  'tern', // Gaviotín
  'duck', // Pato
  'heron', // Garza
  'raptor', // Rapaz
  'dove', // Paloma
  'hummingbird', // Colibrí
  'owl', // Lechuza
  'coot', // Gallareta
  'booby', // Piquero
  'grebe', // Zambullidor
  'cormorant', // Cormorán
  'flamingo', // Flamenco
  'vulture', // Gallinazo
  'parrot', // Loro
  'tinamou', // Perdiz
  'oystercatcher', // Ostrero
  'stilt', // Cigüeñuela
  'penguin', // Pingüino
  'pelican', // Pelícano
] as const;

export type Figure = (typeof FIGURES)[number];

const BY_FAMILY: Record<string, Figure> = {
  Scolopacidae: 'shorebird',
  Charadriidae: 'shorebird',
  Burhinidae: 'shorebird',
  Thinocoridae: 'shorebird',
  Procellariidae: 'seabird',
  Diomedeidae: 'seabird',
  Hydrobatidae: 'seabird',
  Oceanitidae: 'seabird',
  Phaethontidae: 'seabird',
  Fregatidae: 'seabird',
  Stercorariidae: 'gull',
  Hirundinidae: 'swallow',
  Apodidae: 'swallow',
  Anatidae: 'duck',
  Ardeidae: 'heron',
  Ciconiidae: 'heron',
  Threskiornithidae: 'heron',
  Accipitridae: 'raptor',
  Pandionidae: 'raptor',
  Falconidae: 'raptor',
  Columbidae: 'dove',
  Trochilidae: 'hummingbird',
  Strigidae: 'owl',
  Tytonidae: 'owl',
  Rallidae: 'coot',
  Sulidae: 'booby',
  Podicipedidae: 'grebe',
  Phalacrocoracidae: 'cormorant',
  Phoenicopteridae: 'flamingo',
  Cathartidae: 'vulture',
  Psittacidae: 'parrot',
  Tinamidae: 'tinamou',
  Haematopodidae: 'oystercatcher',
  Recurvirostridae: 'stilt',
  Spheniscidae: 'penguin',
  Pelecanidae: 'pelican',
};

/** Gaviotines y el rayador (Rynchops), que en el diseño usa la figura del gaviotín. */
const TERN_GENERA = new Set(['Sterna', 'Sternula', 'Thalasseus', 'Larosterna', 'Gelochelidon', 'Chlidonias', 'Phaetusa', 'Hydroprogne', 'Onychoprion', 'Anous', 'Rynchops']);

/** La figura de una especie; los paseriformes y cualquier familia sin grupo propio usan «Pájaro». */
export function figureOf({ family, genus }: { family?: string | null; genus?: string | null }): Figure {
  if (family === 'Laridae') return genus && TERN_GENERA.has(genus) ? 'tern' : 'gull';
  return (family && BY_FAMILY[family]) || 'songbird';
}
