import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatAlbumNumber, type AlbumEntry } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, FinishSwatch, FlipCard, Icon, ListRow, StatusBarScrim, ThemedText, useTheme } from '@plumario/ui';

import { SpeciesSkeleton } from '@/components/screen-skeletons';
import { SpeciesCard, SpeciesCardBack } from '@/components/species-card';
import { CATEGORY_LABELS, CHROME_SOURCE_LABELS, formatLongDate } from '@/constants/cards';
import { ALBUM_HABITAT_LABELS } from '@/constants/habitats';
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

/** StickerDetalle: la carta de la especie, con su reverso, y cómo y cuándo se obtuvo. */
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
          <ThemedText variant="bodyStrong" accessibilityRole="header">{chromed ? 'Carta cromada' : 'Carta'}</ThemedText>
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
        {state.status === 'ready' && entry?.sticker && (
          <DetailContent entry={entry} total={state.album.total} onOpenGallery={onOpenGallery} onShare={onShare} onTrade={onTrade} />
        )}
      </ScrollView>
      <StatusBarScrim />
    </>
  );
}

function DetailContent({ entry, total, onOpenGallery, onShare, onTrade }: { entry: AlbumEntry; total: number } & Pick<Props, 'onOpenGallery' | 'onShare' | 'onTrade'>) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [flipped, setFlipped] = useState(false);
  const { species, category } = entry;
  const sticker = entry.sticker!;
  const number = formatAlbumNumber(species.albumNumber);
  const cardSize = Math.min(width - layout.cardMargin * 2, CARD_MAX_WIDTH);

  const flip = () => {
    void Haptics.selectionAsync();
    setFlipped((side) => !side);
  };

  return (
    <>
      <View style={styles.hero}>
        <FlipCard
          size={cardSize}
          flipped={flipped}
          front={<SpeciesCard entry={entry} total={total} size={cardSize} />}
          back={<SpeciesCardBack entry={entry} size={cardSize} />}
        />
        <Pressable accessibilityRole="button" onPress={flip} style={styles.flip}>
          <Icon name="swap" color={colors.text} size={18} strokeWidth={2} />
          <ThemedText variant="label">{flipped ? 'Ver el anverso' : 'Dar vuelta'}</ThemedText>
        </Pressable>
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

const CARD_MAX_WIDTH = 340;

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
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[1],
  },
  flip: {
    minHeight: 44,
    paddingHorizontal: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
