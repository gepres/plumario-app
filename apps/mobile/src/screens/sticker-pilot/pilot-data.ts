// GENERADO por tools/stickers/pilot/build-pilot-data.mjs — no editar a mano.
import type { ImageSourcePropType } from 'react-native';

export const ILLUSTRATION_MODELS = ["Gemini (Antigravity)"] as const;

export const PILOT_SPECIES: {
  id: string;
  commonName: string;
  scientificName: string;
  albumNumber: number;
  habitat: 'coast' | 'wetlands' | 'desert' | 'highlands' | 'openSea';
  family: string;
  genus: string;
  iucn: string | null;
  endemic: boolean;
  emblematic: boolean;
  /** Vía A: el dibujo vectorial. */
  vector: string;
  /** Vía B: la ilustración de cada modelo, o null si aún no se generó. */
  illustrations: (ImageSourcePropType | null)[];
}[] = [
  {
    id: 'pyrocephalus-rubinus',
    commonName: "Mosquero Bermellón",
    scientificName: "Pyrocephalus rubinus",
    albumNumber: 215,
    habitat: 'desert',
    family: 'Tyrannidae',
    genus: 'Pyrocephalus',
    iucn: "LC",
    endemic: false,
    emblematic: false,
    vector: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\"><path d=\"M112 160 L108 192 M128 160 L130 192\" fill=\"none\" stroke=\"#231D1B\" stroke-width=\"5\" stroke-linecap=\"round\"></path><path d=\"M98 194 H116 M122 194 H140\" fill=\"none\" stroke=\"#231D1B\" stroke-width=\"4\" stroke-linecap=\"round\"></path><path d=\"M146 138 L214 164 L206 178 L142 158 Z\" fill=\"#3B302C\"></path><path d=\"M74 112 C76 94 98 88 118 96 C142 106 162 124 170 142 C160 160 132 168 108 162 C86 156 72 136 74 112 Z\" fill=\"#E2452C\"></path><path d=\"M120 150 C132 156 148 156 160 150\" fill=\"none\" stroke=\"#F06A4C\" stroke-width=\"3\" stroke-linecap=\"round\"></path><path d=\"M98 98 C122 92 152 108 172 136 C178 146 176 154 168 156 C146 150 122 140 106 126 C98 118 94 108 98 100 Z\" fill=\"#45372F\"></path><path d=\"M118 118 L162 142 M114 128 L154 150\" fill=\"none\" stroke=\"#6E5D52\" stroke-width=\"3\" stroke-linecap=\"round\"></path><circle cx=\"86\" cy=\"92\" r=\"20\" fill=\"#E2452C\"></circle><path d=\"M70 82 C72 66 92 60 104 70 L102 80 C94 76 82 76 70 82 Z\" fill=\"#E2452C\"></path><path d=\"M66 89 C78 84 98 85 110 94 L108 104 C96 98 80 97 66 96 Z\" fill=\"#45372F\"></path><path d=\"M68 89 L48 94 L68 99 Z\" fill=\"#1E1A1A\"></path><circle cx=\"83\" cy=\"92\" r=\"3.6\" fill=\"#120F0F\"></circle><circle cx=\"84\" cy=\"91\" r=\"1.2\" fill=\"#FFFFFF\"></circle></svg>",
    illustrations: [require('../../../assets/sticker-pilot/antigravity/pyrocephalus-rubinus.png')],
  },
  {
    id: 'phoenicopterus-chilensis',
    commonName: "Flamenco Chileno",
    scientificName: "Phoenicopterus chilensis",
    albumNumber: 237,
    habitat: 'wetlands',
    family: 'Phoenicopteridae',
    genus: 'Phoenicopterus',
    iucn: "NT",
    endemic: false,
    emblematic: true,
    vector: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\"><path d=\"M150 128 L150 226\" fill=\"none\" stroke=\"#9AA2A7\" stroke-width=\"5\" stroke-linecap=\"round\"></path><path d=\"M140 228 H162\" fill=\"none\" stroke=\"#9AA2A7\" stroke-width=\"5\" stroke-linecap=\"round\"></path><circle cx=\"150\" cy=\"180\" r=\"5\" fill=\"#D9687E\"></circle><path d=\"M156 132 L172 160 L156 172\" fill=\"none\" stroke=\"#9AA2A7\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path><circle cx=\"172\" cy=\"160\" r=\"4\" fill=\"#D9687E\"></circle><path d=\"M112 100 C122 80 172 76 198 94 C212 104 210 120 192 128 C168 138 132 134 118 120 C110 112 108 106 112 100 Z\" fill=\"#F2A9B6\"></path><path d=\"M142 92 C172 86 198 96 208 110 C190 116 162 120 142 114 Z\" fill=\"#E4768C\"></path><path d=\"M196 114 L222 122 L200 126 Z\" fill=\"#2A2526\"></path><path d=\"M120 106 C94 100 86 78 98 62 C108 48 106 34 90 32\" fill=\"none\" stroke=\"#F2A9B6\" stroke-width=\"12\" stroke-linecap=\"round\"></path><circle cx=\"88\" cy=\"32\" r=\"11\" fill=\"#F2A9B6\"></circle><path d=\"M80 28 C66 30 61 40 65 52 C69 48 72 42 82 37 Z\" fill=\"#F4EFE6\"></path><path d=\"M63 40 C62 46 63 50 65 52 C68 48 71 43 75 39.5 C71 38.5 66 38.8 63 40 Z\" fill=\"#1E1C1D\"></path><circle cx=\"90\" cy=\"29\" r=\"2.2\" fill=\"#1E1C1D\"></circle></svg>",
    illustrations: [require('../../../assets/sticker-pilot/antigravity/phoenicopterus-chilensis.png')],
  },
  {
    id: 'pelecanus-thagus',
    commonName: "Pelícano Peruano",
    scientificName: "Pelecanus thagus",
    albumNumber: 230,
    habitat: 'coast',
    family: 'Pelecanidae',
    genus: 'Pelecanus',
    iucn: "NT",
    endemic: false,
    emblematic: true,
    vector: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\"><path d=\"M140 178 L136 208 M162 178 L164 208\" fill=\"none\" stroke=\"#3B3A40\" stroke-width=\"7\" stroke-linecap=\"round\"></path><path d=\"M124 210 H146 M154 210 H176\" fill=\"none\" stroke=\"#3B3A40\" stroke-width=\"6\" stroke-linecap=\"round\"></path><path d=\"M198 150 L230 166 L200 172 Z\" fill=\"#34333A\"></path><path d=\"M96 144 C102 114 150 106 190 122 C214 132 216 162 198 174 C172 192 120 190 102 170 C94 162 93 152 96 144 Z\" fill=\"#504F57\"></path><path d=\"M122 132 C152 118 192 124 214 152 C192 154 162 164 132 164 C120 158 116 142 122 132 Z\" fill=\"#77757E\"></path><path d=\"M142 142 L192 150 M138 152 L186 160\" fill=\"none\" stroke=\"#9D9BA4\" stroke-width=\"3\" stroke-linecap=\"round\"></path><path d=\"M100 70 C96 92 100 112 120 134 L100 146 C80 124 76 98 84 74 Z\" fill=\"#6B4636\"></path><path d=\"M84 74 C76 98 80 124 100 146 L94 150 C72 126 68 98 78 76 Z\" fill=\"#F3EFE7\"></path><circle cx=\"92\" cy=\"62\" r=\"17\" fill=\"#F3EFE7\"></circle><path d=\"M76 58 C78 44 104 40 109 58 C100 51 86 51 76 58 Z\" fill=\"#E4C766\"></path><path d=\"M82 70 C66 82 44 102 28 118 C48 120 72 104 90 80 Z\" fill=\"#4A3E48\"></path><path d=\"M80 58 C60 68 38 90 20 116 C22 120 27 120 29 116 C46 94 66 78 86 70 Z\" fill=\"#D39A5F\"></path><path d=\"M20 116 C17 121 20 126 25 124 L29 116 Z\" fill=\"#B8523B\"></path><circle cx=\"90\" cy=\"61\" r=\"3.4\" fill=\"#1C1B1F\"></circle><circle cx=\"91\" cy=\"60\" r=\"1.1\" fill=\"#FFFFFF\"></circle></svg>",
    illustrations: [require('../../../assets/sticker-pilot/antigravity/pelecanus-thagus.png')],
  },
  {
    id: 'rhodopis-vesper',
    commonName: "Colibrí de Oasis",
    scientificName: "Rhodopis vesper",
    albumNumber: 26,
    habitat: 'desert',
    family: 'Trochilidae',
    genus: 'Rhodopis',
    iucn: "LC",
    endemic: false,
    emblematic: false,
    vector: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\"><path d=\"M118 112 C120 80 142 54 176 40 C166 72 150 98 128 118 Z\" fill=\"#5C5850\"></path><path d=\"M158 150 L210 200 L200 202 L152 158 Z\" fill=\"#3F3A35\"></path><path d=\"M162 146 L226 178 L222 188 L158 156 Z\" fill=\"#3F3A35\"></path><path d=\"M154 146 L176 160 L170 168 L150 154 Z\" fill=\"#C47A44\"></path><path d=\"M100 122 C104 108 120 104 134 112 C148 122 164 140 178 162 C160 160 144 152 132 144 C116 142 104 134 100 122 Z\" fill=\"#EEEAE0\"></path><path d=\"M106 112 C118 104 136 108 150 122 C162 134 172 148 178 162 C162 150 146 140 128 132 C116 126 108 120 106 112 Z\" fill=\"#7F8A4F\"></path><path d=\"M146 136 C158 144 168 152 176 160 C164 156 154 150 144 142 Z\" fill=\"#C47A44\"></path><path d=\"M112 140 C122 146 136 148 146 146\" fill=\"none\" stroke=\"#C9C3B6\" stroke-width=\"3\" stroke-linecap=\"round\"></path><circle cx=\"104\" cy=\"114\" r=\"13\" fill=\"#7F8A4F\"></circle><path d=\"M93 118 C97 128 108 133 119 129 C114 124 106 120 99 115 Z\" fill=\"#A53D90\"></path><path d=\"M93 112 C76 111 58 115 40 125\" fill=\"none\" stroke=\"#1E1C1C\" stroke-width=\"4\" stroke-linecap=\"round\"></path><path d=\"M128 120 C150 104 176 94 206 94 C186 112 162 126 136 132 Z\" fill=\"#6A665D\"></path><path d=\"M146 116 L190 102 M150 124 L184 114\" fill=\"none\" stroke=\"#8A867C\" stroke-width=\"2.5\" stroke-linecap=\"round\"></path><circle cx=\"111\" cy=\"112\" r=\"2.6\" fill=\"#F5F2EA\"></circle><circle cx=\"101\" cy=\"111\" r=\"2.8\" fill=\"#120F0F\"></circle><circle cx=\"102\" cy=\"110\" r=\"0.9\" fill=\"#FFFFFF\"></circle></svg>",
    illustrations: [require('../../../assets/sticker-pilot/antigravity/rhodopis-vesper.png')],
  },
  {
    id: 'quechuavis-decussata',
    commonName: "Chotacabras de Tschudi",
    scientificName: "Quechuavis decussata",
    albumNumber: 29,
    habitat: 'desert',
    family: 'Caprimulgidae',
    genus: 'Quechuavis',
    iucn: "LC",
    endemic: false,
    emblematic: false,
    vector: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\"><path d=\"M112 172 L110 182 M126 172 L127 182\" fill=\"none\" stroke=\"#5A4C40\" stroke-width=\"3.5\" stroke-linecap=\"round\"></path><path d=\"M104 184 H114 M122 184 H132\" fill=\"none\" stroke=\"#5A4C40\" stroke-width=\"3\" stroke-linecap=\"round\"></path><path d=\"M194 146 L234 156 L232 166 L194 162 Z\" fill=\"#7B6B58\"></path><path d=\"M225 158 L234 156 L232 166 L224 165 Z\" fill=\"#F2EEE6\"></path><path d=\"M60 150 C64 126 92 116 124 120 C160 124 196 138 220 152 C196 164 156 174 120 172 C90 170 62 166 60 150 Z\" fill=\"#8E7C67\"></path><path d=\"M42 146 C42 128 60 118 80 121 C96 124 104 138 100 150 C88 160 56 162 42 146 Z\" fill=\"#8E7C67\"></path><path d=\"M48 152 C58 159 74 160 86 155 C76 151 60 150 48 152 Z\" fill=\"#F0E9DA\"></path><path d=\"M92 128 C130 122 174 134 216 150 C178 152 136 152 104 148 C94 144 88 136 92 128 Z\" fill=\"#6E5F4E\"></path><path d=\"M150 140 L162 142 L158 150 L146 148 Z\" fill=\"#F2EEE6\"></path><path d=\"M100 136 q8 3 16 0 M122 140 q8 3 16 0 M174 144 q8 3 16 0 M70 160 q8 3 16 0 M110 160 q8 3 16 0 M150 162 q8 3 16 0\" fill=\"none\" stroke=\"#B5A48A\" stroke-width=\"2.5\" stroke-linecap=\"round\"></path><circle cx=\"58\" cy=\"128\" r=\"2.2\" fill=\"#55493D\"></circle><circle cx=\"80\" cy=\"126\" r=\"2.2\" fill=\"#55493D\"></circle><circle cx=\"90\" cy=\"136\" r=\"2\" fill=\"#55493D\"></circle><path d=\"M43 142 L34 146 L43 149 Z\" fill=\"#2A2420\"></path><circle cx=\"64\" cy=\"136\" r=\"5.4\" fill=\"#16110E\"></circle><circle cx=\"66\" cy=\"134\" r=\"1.7\" fill=\"#FFFFFF\"></circle></svg>",
    illustrations: [require('../../../assets/sticker-pilot/antigravity/quechuavis-decussata.png')],
  },
  {
    id: 'geositta-peruviana',
    commonName: "Minero Peruano",
    scientificName: "Geositta peruviana",
    albumNumber: 143,
    habitat: 'desert',
    family: 'Furnariidae',
    genus: 'Geositta',
    iucn: "LC",
    endemic: true,
    emblematic: false,
    vector: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 240 240\"><path d=\"M112 164 L109 196 M127 164 L129 196\" fill=\"none\" stroke=\"#4A4038\" stroke-width=\"4\" stroke-linecap=\"round\"></path><path d=\"M98 198 H116 M121 198 H139\" fill=\"none\" stroke=\"#4A4038\" stroke-width=\"3.5\" stroke-linecap=\"round\"></path><path d=\"M150 144 L196 158 L192 172 L146 162 Z\" fill=\"#4E4238\"></path><path d=\"M152 158 L192 170\" fill=\"none\" stroke=\"#CDB894\" stroke-width=\"3\" stroke-linecap=\"round\"></path><path d=\"M74 122 C76 102 100 94 124 100 C148 106 166 124 172 144 C160 164 132 170 108 166 C86 160 72 144 74 122 Z\" fill=\"#F2ECDF\"></path><path d=\"M90 106 C114 96 148 108 170 136 C172 146 166 154 158 154 C136 148 112 138 98 126 C90 120 86 112 90 106 Z\" fill=\"#BCA887\"></path><path d=\"M116 120 q10 4 20 0 M126 132 q10 4 20 0\" fill=\"none\" stroke=\"#D8CAAB\" stroke-width=\"2.5\" stroke-linecap=\"round\"></path><path d=\"M128 142 C140 148 152 152 162 152\" fill=\"none\" stroke=\"#C68B52\" stroke-width=\"4\" stroke-linecap=\"round\"></path><circle cx=\"88\" cy=\"100\" r=\"19\" fill=\"#BCA887\"></circle><path d=\"M70 105 C74 116 86 122 101 120 C92 114 80 110 70 105 Z\" fill=\"#F2ECDF\"></path><path d=\"M74 93 C82 87 96 87 106 94\" fill=\"none\" stroke=\"#F4EFE3\" stroke-width=\"3.5\" stroke-linecap=\"round\"></path><path d=\"M71 99 C64 100 57 103 52 108 C59 107 65 106 71 104 Z\" fill=\"#3C3430\"></path><circle cx=\"82\" cy=\"99\" r=\"3.2\" fill=\"#120F0F\"></circle><circle cx=\"83\" cy=\"98\" r=\"1.1\" fill=\"#FFFFFF\"></circle></svg>",
    illustrations: [require('../../../assets/sticker-pilot/antigravity/geositta-peruviana.png')],
  },
];
