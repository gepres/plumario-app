import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FINISH_PRICES, formatAlbumNumber, nextFinish, ownedFinishes, type AlbumEntry } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, FeatherCoin, FilterChips, FinishSwatch, FlipCard, Icon, ListRow, StatusBarScrim, ThemedText, useTheme, type StickerFinish } from '@plumario/ui';

import { SpeciesSkeleton } from '@/components/screen-skeletons';
import { SpeciesCard, SpeciesCardBack, entryFinish } from '@/components/species-card';
import { CATEGORY_LABELS, FINISH_SOURCE_LABELS, finishTitle, formatLongDate } from '@/constants/cards';
import { feathersLabel } from '@/constants/economy';
import { ALBUM_HABITAT_LABELS } from '@/constants/habitats';
import { useAlbum } from '@/hooks/use-album';

type Props = {
  speciesId: string;
  onBack: () => void;
  onOpenGallery: (speciesId: string) => void;
  /** CompraAcabado. */
  onBuy: (speciesId: string) => void;
  /** CompartirTarjeta, con el acabado que se está viendo; con la foto propia puesta si se pide. */
  onShare: (speciesId: string, withPhoto: boolean, finish: StickerFinish) => void;
};

/** StickerDetalle: la carta de la especie, con su reverso, sus acabados, y cómo y cuándo se obtuvo cada uno. */
export function StickerDetail({ speciesId, onBack, onOpenGallery, onBuy, onShare }: Props) {
  const state = useAlbum();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const entry = state.status === 'ready' ? state.album.entries.find((e) => e.species.id === speciesId) : undefined;
  // Sin elegir, se ve el más alto: el que está en el álbum.
  const [chosen, setChosen] = useState<StickerFinish | null>(null);
  const shown = chosen ?? (entry ? entryFinish(entry) : 'normal');

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing[6] }}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
            <Icon name="back" color={colors.text} size={22} strokeWidth={2} />
          </Pressable>
          <ThemedText variant="bodyStrong" accessibilityRole="header">{shown === 'normal' ? 'Carta' : 'Carta cromada'}</ThemedText>
          {entry?.sticker ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Compartir tarjeta" onPress={() => onShare(speciesId, false, shown)} style={styles.back}>
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
          <DetailContent entry={entry} total={state.album.total} shown={shown} onChoose={setChosen} onOpenGallery={onOpenGallery} onBuy={onBuy} onShare={onShare} />
        )}
      </ScrollView>
      <StatusBarScrim />
    </>
  );
}

type ContentProps = Pick<Props, 'onOpenGallery' | 'onBuy' | 'onShare'> & {
  entry: AlbumEntry;
  total: number;
  shown: StickerFinish;
  onChoose: (finish: StickerFinish) => void;
};

function DetailContent({ entry, total, shown, onChoose, onOpenGallery, onBuy, onShare }: ContentProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [flipped, setFlipped] = useState(false);
  const { species, finish } = entry;
  const sticker = entry.sticker!;
  const owned = ownedFinishes(sticker);
  const unlocked = owned.find((u) => u.finish === shown);
  const number = formatAlbumNumber(species.albumNumber);
  const upgrade = nextFinish(finish);
  const cardSize = Math.min(width - layout.cardMargin * 2, CARD_MAX_WIDTH);

  const flip = () => {
    void Haptics.selectionAsync();
    setFlipped((side) => !side);
  };

  const choose = (next: StickerFinish) => {
    if (next === shown) return;
    void Haptics.selectionAsync();
    onChoose(next);
  };

  return (
    <>
      <View style={styles.hero}>
        <FlipCard
          size={cardSize}
          flipped={flipped}
          front={<SpeciesCard entry={entry} total={total} size={cardSize} finish={shown} />}
          back={<SpeciesCardBack entry={entry} size={cardSize} finish={shown} />}
        />
        <Pressable accessibilityRole="button" onPress={flip} style={styles.flip}>
          <Icon name="swap" color={colors.text} size={18} strokeWidth={2} />
          <ThemedText variant="label">{flipped ? 'Ver el anverso' : 'Dar vuelta'}</ThemedText>
        </Pressable>
      </View>

      {owned.length > 0 && (
        <View style={styles.finishes}>
          <FilterChips
            label="Acabados de esta carta"
            options={[{ key: 'normal', label: 'Normal' }, ...owned.map((u) => ({ key: u.finish, label: finishTitle(u.finish) }))]}
            value={shown}
            onChange={choose}
          />
        </View>
      )}

      <View style={styles.titles}>
        <ThemedText variant="title">{species.commonName}</ThemedText>
        <ThemedText variant="scientific" color="textSecondary">{species.scientificName}</ThemedText>
        <View style={styles.chips}>
          {shown !== 'normal' && (
            <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <FinishSwatch finish={shown} />
              <ThemedText variant="captionStrong">Cromo {CATEGORY_LABELS[shown]}</ThemedText>
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
        <Fact term="Cómo se obtuvo" value={unlocked ? FINISH_SOURCE_LABELS[unlocked.source] : 'Al completar el sticker con tu primera foto.'} />
        <Fact term="Fecha de obtención" value={formatLongDate(unlocked?.at ?? sticker.completedAt)} />
        <Fact term="En tu álbum" value={albumFact(number, finish, shown)} last />
      </View>

      <View style={styles.galleryLink}>
        <ListRow title={`Tu galería · ${sticker.validPhotos} ${sticker.validPhotos === 1 ? 'foto' : 'fotos'}`} onPress={() => onOpenGallery(species.id)} />
      </View>

      {upgrade && (
        <Pressable accessibilityRole="button" onPress={() => onBuy(species.id)} style={[styles.buy, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <FeatherCoin size={20} />
          <ThemedText variant="bodyStrong" style={styles.flex}>Subir a {CATEGORY_LABELS[upgrade]} · {feathersLabel(FINISH_PRICES[upgrade])}</ThemedText>
          <Icon name="chevronRight" color={colors.textSecondary} size={18} strokeWidth={2} />
        </Pressable>
      )}

      <View style={styles.actions}>
        <Button label={shown === 'normal' ? 'Compartir' : 'Compartir con mi foto'} icon="share" onPress={() => onShare(species.id, shown !== 'normal', shown)} />
      </View>
    </>
  );
}

/** La casilla siempre muestra el acabado más alto, sea cual sea el que se está viendo. */
function albumFact(number: string, best: AlbumEntry['finish'], shown: StickerFinish) {
  if (!best) return `Ocupa la casilla N.º ${number}.`;
  if (shown === best) return `Ocupa la casilla N.º ${number} en lugar del sticker normal.`;
  return `La casilla N.º ${number} muestra tu mejor acabado: ${CATEGORY_LABELS[best]}.`;
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
  flex: {
    flex: 1,
  },
  buy: {
    minHeight: 52,
    marginHorizontal: layout.cardMargin,
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  finishes: {
    marginHorizontal: layout.cardMargin,
    paddingBottom: spacing[1],
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
