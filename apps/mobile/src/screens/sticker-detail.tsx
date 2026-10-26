import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { formatAlbumNumber, sealsOf, type AlbumEntry } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, FinishSwatch, Icon, ListRow, StatusBarScrim, ThemedText, useTheme } from '@plumario/ui';

import { SpeciesSkeleton } from '@/components/screen-skeletons';
import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS, CHROME_SOURCE_LABELS, SEAL_LABELS, formatLongDate } from '@/constants/cards';
import { ALBUM_HABITAT_LABELS, stickerTint } from '@/constants/habitats';
import { useAlbum } from '@/hooks/use-album';

type Props = {
  speciesId: string;
  onBack: () => void;
  onOpenGallery: (speciesId: string) => void;
  /** CompartirTarjeta; con la foto propia puesta si se pide. */
  onShare: (speciesId: string, withPhoto: boolean) => void;
  /** IntercambioProponer: ofrecer el cromo propio o pedir el de la especie. */
  onTrade: (mode: 'offer' | 'request', speciesId: string) => void;
};

/** StickerDetalle: el sticker grande, su categoría y sellos, y cómo y cuándo se obtuvo. */
export function StickerDetail({ speciesId, onBack, onOpenGallery, onShare, onTrade }: Props) {
  const state = useAlbum();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const entry = state.status === 'ready' ? state.album.entries.find((e) => e.species.id === speciesId) : undefined;
  const chromed = !!entry?.sticker?.chrome;

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
            <Icon name="back" color={colors.text} size={22} strokeWidth={2} />
          </Pressable>
          <ThemedText variant="bodyStrong" accessibilityRole="header">{chromed ? 'Sticker cromado' : 'Sticker'}</ThemedText>
          {entry?.sticker ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Compartir tarjeta" onPress={() => onShare(speciesId, false)} style={styles.back}>
              <Icon name="share" color={colors.text} size={20} strokeWidth={1.8} />
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
        </View>
        {state.status === 'loading' && <SpeciesSkeleton inset />}
        {state.status === 'error' && <ThemedText color="error" style={styles.message}>No se pudo cargar el álbum. Revisa tu conexión.</ThemedText>}
        {state.status === 'ready' && !entry?.sticker && <ThemedText color="textSecondary" style={styles.message}>Todavía no tienes este sticker.</ThemedText>}
        {entry?.sticker && <DetailContent entry={entry} onOpenGallery={onOpenGallery} onShare={onShare} onTrade={onTrade} />}
      </ScrollView>
      <StatusBarScrim />
    </>
  );
}

function DetailContent({ entry, onOpenGallery, onShare, onTrade }: { entry: AlbumEntry } & Pick<Props, 'onOpenGallery' | 'onShare' | 'onTrade'>) {
  const { mode, colors } = useTheme();
  const { species, category } = entry;
  const sticker = entry.sticker!;
  const number = formatAlbumNumber(species.albumNumber);
  const tint = mode === 'dark' ? colors.surfaceAlt : stickerTint(species.habitat);
  const decoration = mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(20,48,47,0.14)';

  return (
    <>
      <View style={[styles.hero, { backgroundColor: tint }]}>
        {/* Círculo punteado y olas, como en el diseño. */}
        <Svg width="100%" height="100%" viewBox="0 0 358 262" preserveAspectRatio="xMidYMid slice" style={styles.decoration}>
          <Circle cx={179} cy={131} r={118} fill="none" stroke={decoration} strokeWidth={1.5} strokeDasharray="3 6" />
          <Path d="M-10 226 q22 -12 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0" fill="none" stroke={decoration} strokeWidth={2} strokeLinecap="round" />
          <Path d="M-32 244 q22 -12 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0" fill="none" stroke={decoration} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <View style={styles.tilt}>
          <SpeciesSticker entry={entry} size={172} />
        </View>
      </View>

      <View style={styles.titles}>
        <ThemedText variant="title">{species.commonName}</ThemedText>
        <ThemedText variant="scientific" color="textSecondary">{species.scientificName}</ThemedText>
        <View style={styles.chips}>
          {sticker.chrome && (
            <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <FinishSwatch finish={category} />
              <ThemedText variant="captionStrong">Cromo {CATEGORY_LABELS[category]}</ThemedText>
            </View>
          )}
          {sealsOf(species).map((seal) => (
            <View key={seal} style={[styles.chip, styles.seal, { borderColor: colors.border }]}>
              <ThemedText variant="caption" color="textSecondary">Sello: {SEAL_LABELS[seal]}</ThemedText>
            </View>
          ))}
          <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <ThemedText variant="caption" color="textSecondary">
              N.º {number}{species.habitat ? ` · ${ALBUM_HABITAT_LABELS[species.habitat]}` : ''}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.facts}>
        <Fact term="Cómo se obtuvo" value={sticker.chrome ? CHROME_SOURCE_LABELS[sticker.chrome.source] : 'Al completar el sticker con tu primera foto.'} />
        <Fact term="Fecha de obtención" value={formatLongDate(sticker.chrome?.at ?? sticker.completedAt)} />
        <Fact term="En tu álbum" value={sticker.chrome ? `Ocupa la casilla N.º ${number} en lugar del sticker normal.` : `Ocupa la casilla N.º ${number}.`} last />
      </View>

      <View style={styles.galleryLink}>
        <ListRow title={`Tu galería · ${sticker.validPhotos} ${sticker.validPhotos === 1 ? 'foto' : 'fotos'}`} onPress={() => onOpenGallery(species.id)} />
      </View>

      <View style={styles.actions}>
        <Button label={sticker.chrome ? 'Compartir con mi foto' : 'Compartir'} icon="share" onPress={() => onShare(species.id, !!sticker.chrome)} />
        <Button
          label={sticker.chrome ? 'Ofrecer en intercambio' : 'Pedir su cromo en intercambio'}
          icon="swap"
          variant="secondary"
          onPress={() => onTrade(sticker.chrome ? 'offer' : 'request', species.id)}
        />
      </View>
    </>
  );
}

function Fact({ term, value, last = false }: { term: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fact, { borderTopColor: colors.line }, last && { borderBottomColor: colors.line, borderBottomWidth: 1 }]}>
      <ThemedText variant="eyebrow" color="textSecondary">{term}</ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: layout.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginHorizontal: layout.cardMargin,
  },
  hero: {
    marginHorizontal: layout.cardMargin,
    height: 262,
    borderRadius: radius.sheet,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decoration: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tilt: {
    transform: [{ rotate: '-4deg' }],
  },
  titles: {
    paddingHorizontal: layout.textMargin,
    paddingTop: 14,
    gap: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seal: {
    borderStyle: 'dashed',
  },
  facts: {
    marginTop: 10,
    marginHorizontal: layout.textMargin,
  },
  fact: {
    borderTopWidth: 1,
    paddingVertical: spacing[2],
    gap: 2,
  },
  galleryLink: {
    marginTop: 10,
    marginHorizontal: layout.textMargin,
  },
  actions: {
    marginTop: spacing[4],
    marginHorizontal: layout.cardMargin,
    gap: 10,
  },
});
