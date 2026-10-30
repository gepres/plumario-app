import { Image, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BirdFigure, type BirdArt } from '../components/bird-figure';
import { HOLOGRAPHIC } from '../components/sticker-finishes';
import type { FigureName } from '../figures/figure-svgs';
import { textStyles } from '../theme/fonts';
import { POSTER_HEIGHT, POSTER_WIDTH } from './poster-frame';
import { POSTER_LAYOUT, POSTER_PALETTES, POSTER_SCENES, type PosterHabitat } from './poster-scenes';

// El póster de un hábitat (design/project/PosterHabitat.dc.html): su paisaje y todas sus especies,
// las que faltan en sombra. Se ve siempre; se descarga al completar el hábitat.

export type HabitatPosterCell = {
  figure: FigureName;
  number: string;
  name: string;
  done: boolean;
  tint: string;
  /** El aro de los que salieron en cromo: holográfico o plata (las demás categorías, holográfico). */
  ring: 'holo' | 'silver' | null;
  /** «Usar mis fotos»: la foto propia en lugar de la figura. */
  photoUri?: string | null;
  /** El dibujo propio de la especie; sin él, la figura de su grupo. */
  art?: BirdArt;
};

type Props = {
  habitat: PosterHabitat;
  theme: 'light' | 'dark';
  name: string;
  collector: string;
  cells: readonly HabitatPosterCell[];
  usePhotos?: boolean;
  /** Miniatura de las listas: el paisaje y el encabezado, sin las celdas (que ahí no se distinguen). */
  thumbnail?: boolean;
};

const GRID_WIDTH = 979;
const GRID_HEIGHT = 1150;
const GAP = 10;

/**
 * Columnas y tamaño de figura para que todas las especies entren en la hoja: se parte de las
 * columnas del diseño y se agregan hasta que alcanza; si ni así caben los nombres, van sin nombre.
 */
function gridFor(count: number, preferredColumns: number, names: boolean): { columns: number; figure: number; names: boolean } {
  for (const withNames of names ? [true, false] : [false]) {
    for (let columns = preferredColumns; columns <= 16; columns++) {
      const cellWidth = (GRID_WIDTH - (columns - 1) * GAP) / columns;
      const rows = Math.ceil(count / columns);
      const extra = withNames ? 74 : 38;
      const figure = Math.floor(Math.min(withNames ? 100 : cellWidth - 18, cellWidth - 18, (GRID_HEIGHT - (rows - 1) * GAP) / rows - extra));
      if (figure >= (withNames ? 64 : 40)) return { columns, figure, names: withNames };
    }
  }
  return { columns: 16, figure: 40, names: false };
}

function sceneXml(habitat: PosterHabitat, theme: 'light' | 'dark') {
  const palette = POSTER_PALETTES[habitat][theme] as Record<string, string>;
  return POSTER_SCENES[habitat].replace(/\{\{p\.(\w+)\}\}/g, (_, key: string) => palette[key] ?? 'transparent');
}

export function HabitatPoster({ habitat, theme, name, collector, cells, usePhotos = false, thumbnail = false }: Props) {
  const dark = theme === 'dark';
  const layout = POSTER_LAYOUT[habitat];
  const accent = layout.accent[theme];
  const ink = dark ? '#F3EDE2' : '#14302F';
  const sub = dark ? '#C9D8D4' : '#3F504E';
  const cardBg = dark ? 'rgba(10,24,28,0.8)' : 'rgba(251,248,242,0.9)';
  const done = cells.filter((c) => c.done).length;
  const grid = gridFor(cells.length, layout.columns, layout.names);
  const cellWidth = (GRID_WIDTH - (grid.columns - 1) * GAP) / grid.columns;
  const inner = Math.round(grid.figure * 0.86);

  return (
    <View style={styles.paper}>
      <SvgXml xml={sceneXml(habitat, theme)} width={POSTER_WIDTH} height={POSTER_HEIGHT} style={styles.fill} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text style={[styles.eyebrow, { color: accent }]}>ÁLBUM AVES DE ICA · PÓSTER DE HÁBITAT</Text>
            <Text style={[styles.title, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit>{name}</Text>
            <Text style={[styles.subtitle, { color: sub }]}>{done} de {cells.length} especies · {collector}</Text>
          </View>
          <View style={[styles.seal, { backgroundColor: cardBg, borderColor: accent }]}>
            <Text style={[styles.sealCount, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>{done}/{cells.length}</Text>
            <Text style={[styles.sealLabel, { color: ink }]}>ESPECIES</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {!thumbnail && cells.map((cell) => {
            const photo = usePhotos && cell.done && cell.photoUri;
            return (
              <View key={cell.number} style={[styles.cell, { width: cellWidth, backgroundColor: cardBg }]}>
                <View
                  style={{
                    width: grid.figure,
                    height: grid.figure,
                    borderRadius: photo ? 14 : grid.figure / 2,
                    padding: 3,
                    backgroundColor: cell.ring === 'silver' ? '#B9C2C9' : cell.ring === 'holo' ? HOLOGRAPHIC.colors[1] : 'transparent',
                  }}>
                  {cell.done ? (
                    photo ? (
                      <Image source={{ uri: photo }} style={styles.photo} />
                    ) : (
                      <View style={[styles.round, { backgroundColor: cell.tint }]}>
                        <BirdFigure figure={cell.figure} art={cell.art} size={inner} />
                      </View>
                    )
                  ) : (
                    <View style={[styles.round, styles.shadow, { backgroundColor: dark ? 'rgba(243,237,226,0.06)' : '#ECE6DA', borderColor: dark ? 'rgba(243,237,226,0.35)' : '#B9AE99' }]}>
                      <BirdFigure figure={cell.figure} size={inner} silhouette={dark ? { color: '#FFFFFF', opacity: 0.3 } : { color: '#000000', opacity: 0.2 }} />
                    </View>
                  )}
                </View>
                <Text style={[styles.number, { color: cell.done ? accent : dark ? '#8E9C99' : '#6F695F' }]}>{cell.number}</Text>
                {grid.names && (
                  <Text style={[styles.name, { color: cell.done ? ink : dark ? '#AEB9B6' : '#5F5B54' }]} numberOfLines={2}>
                    {cell.name}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.footer, { backgroundColor: cardBg }]}>
          <Text style={[styles.footerText, { color: sub }]}>
            {usePhotos ? 'Con tus fotos · las figuras en sombra aún no están en tu álbum' : 'Las figuras en sombra aún no están en tu álbum'}
          </Text>
          <Text style={[styles.footerText, styles.footerBrand, { color: ink }]}>Álbum Aves de Ica · Edición inicial</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  paper: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    padding: 72,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 32,
  },
  titles: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  eyebrow: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 16,
    letterSpacing: 2.2,
  },
  title: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 88,
    lineHeight: 92,
    letterSpacing: -2.2,
  },
  subtitle: {
    fontFamily: textStyles.scientific.fontFamily,
    fontSize: 30,
    lineHeight: 36,
  },
  seal: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sealCount: {
    fontFamily: textStyles.title.fontFamily,
    fontSize: 44,
    lineHeight: 48,
  },
  sealLabel: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 13,
    letterSpacing: 1.8,
  },
  grid: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    gap: GAP,
  },
  cell: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  round: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shadow: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photo: {
    flex: 1,
    borderRadius: 11,
  },
  number: {
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 13,
  },
  name: {
    width: '100%',
    fontFamily: textStyles.bodyStrong.fontFamily,
    fontSize: 14,
    lineHeight: 17,
    height: 34,
    textAlign: 'center',
  },
  footer: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  footerText: {
    fontFamily: textStyles.body.fontFamily,
    fontSize: 16,
    flexShrink: 1,
  },
  footerBrand: {
    fontFamily: textStyles.bodyStrong.fontFamily,
  },
});
