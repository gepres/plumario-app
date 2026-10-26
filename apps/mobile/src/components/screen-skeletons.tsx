import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '@plumario/tokens';
import { Skeleton, SkeletonBlock, SkeletonStickers, useTheme } from '@plumario/ui';

// Los esqueletos de carga de cada pantalla, con su forma: mientras llegan los datos se ve dónde va
// a quedar cada cosa y nada salta al aparecer. Las piezas están en @plumario/ui. Con `inset`, el
// esqueleto pone su margen: para las pantallas que no lo tienen fuera del contenido.

type Props = { inset?: boolean };

/** Un título de sección. */
const Title = ({ width = 150 }: { width?: number }) => <SkeletonBlock width={width} height={18} radius={6} style={styles.title} />;

/** Una tarjeta con una figura a la izquierda y dos líneas de texto. */
function RowCard({ height = 72 }: { height?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rowCard, { height, backgroundColor: colors.surface, borderColor: colors.line }]}>
      <SkeletonBlock width={height - 26} height={height - 26} radius={10} />
      <View style={styles.lines}>
        <SkeletonBlock width="60%" height={14} radius={5} />
        <SkeletonBlock width="85%" height={10} radius={5} />
      </View>
    </View>
  );
}

/** Inicio: el avance, el póster que viene y dos filas de stickers. */
export function HomeSkeleton({ inset }: Props) {
  return (
    <Skeleton label="Cargando tu álbum…" style={inset && styles.inset}>
      <SkeletonBlock height={136} radius={20} />
      <RowCard height={88} />
      <Title />
      <SkeletonStickers />
      <Title width={190} />
      <SkeletonStickers />
    </Skeleton>
  );
}

/** Álbum: el avance, el buscador y una tarjeta por hábitat. */
export function AlbumSkeleton({ inset }: Props) {
  return (
    <Skeleton label="Cargando tu álbum…" style={inset && styles.inset}>
      <SkeletonBlock width={180} height={28} radius={8} />
      <SkeletonBlock height={12} radius={6} />
      <SkeletonBlock height={48} radius={14} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.section}>
          <Title width={140} />
          <SkeletonStickers />
        </View>
      ))}
    </Skeleton>
  );
}

/** Una cuadrícula de stickers (un hábitat, los pósteres por armar). */
export function StickerGridSkeleton({ count = 9, inset }: Props & { count?: number }) {
  return (
    <Skeleton style={inset && styles.inset}>
      <SkeletonStickers count={count} />
    </Skeleton>
  );
}

/** Recompensas: medallas en cuadrícula. */
export function MedalsSkeleton({ inset }: Props) {
  return (
    <Skeleton label="Cargando tus recompensas…" style={inset && styles.inset}>
      <Title />
      <View style={styles.medals}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={styles.medal}>
            <SkeletonBlock width={72} height={72} radius={36} />
            <SkeletonBlock width={64} height={10} radius={5} />
          </View>
        ))}
      </View>
    </Skeleton>
  );
}

/** Una lista de tarjetas: propuestas de intercambio, categorías, pósteres guardados. */
export function ListSkeleton({ rows = 4, label, inset }: Props & { rows?: number; label?: string }) {
  return (
    <Skeleton label={label} style={inset && styles.inset}>
      {Array.from({ length: rows }, (_, i) => (
        <RowCard key={i} />
      ))}
    </Skeleton>
  );
}

/** Un formulario de ajustes: tarjetas con filas (Editar perfil, Privacidad, Notificaciones). */
export function SettingsSkeleton({ inset }: Props) {
  const { colors } = useTheme();
  return (
    <Skeleton style={inset && styles.inset}>
      <SkeletonBlock width="80%" height={14} radius={5} />
      {[3, 2].map((rows, i) => (
        <View key={i} style={styles.section}>
          <Title width={120} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {Array.from({ length: rows }, (_, j) => (
              <View key={j} style={styles.setting}>
                <View style={styles.lines}>
                  <SkeletonBlock width="50%" height={14} radius={5} />
                  <SkeletonBlock width="80%" height={10} radius={5} />
                </View>
                <SkeletonBlock width={44} height={26} radius={13} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Skeleton>
  );
}

/** Una especie: la foto o el sticker grande, el nombre y su galería. */
export function SpeciesSkeleton({ inset }: Props) {
  return (
    <Skeleton label="Cargando la especie…" style={inset && styles.inset}>
      <SkeletonBlock height={260} radius={20} />
      <SkeletonBlock width="60%" height={24} radius={8} />
      <SkeletonBlock width="40%" height={14} radius={5} />
      <View style={styles.photos}>
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonBlock key={i} width="31.5%" radius={10} style={styles.photo} />
        ))}
      </View>
    </Skeleton>
  );
}

/** Un póster (vista previa vertical) con sus opciones debajo. */
export function PosterSkeleton({ inset }: Props) {
  return (
    <Skeleton label="Preparando el póster…" style={inset && styles.inset}>
      <SkeletonBlock width="78%" radius={4} style={styles.poster} />
      <SkeletonBlock height={44} radius={12} />
      <SkeletonBlock height={52} radius={14} />
    </Skeleton>
  );
}

/** RegistrarIdentificar: la IA mira la foto; las tres opciones de sticker que va a sugerir. */
export function SuggestionsSkeleton({ inset }: Props) {
  return (
    <Skeleton label="La IA está mirando tu foto" style={inset && styles.inset}>
      {[0, 1, 2].map((i) => (
        <RowCard key={i} height={84} />
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  inset: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[4],
  },
  title: {
    marginTop: spacing[1],
    marginHorizontal: 4,
  },
  section: {
    gap: spacing[2],
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  medals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing[4],
  },
  medal: {
    width: '33.3%',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: spacing[3],
    gap: spacing[4],
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: '2.75%',
    rowGap: 8,
  },
  photo: {
    aspectRatio: 1,
  },
  poster: {
    alignSelf: 'center',
    aspectRatio: 297 / 420,
  },
});
