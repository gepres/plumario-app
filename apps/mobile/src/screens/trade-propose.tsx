import { useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { offerOptions, requestOptions, TradeProposalError, type AlbumEntry } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Icon, Sheet, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { ListSkeleton } from '@/components/screen-skeletons';
import { SpeciesSticker } from '@/components/species-sticker';
import { CATEGORY_LABELS } from '@/constants/cards';
import { CHROME_SOURCE_SHORT, tradeLink } from '@/constants/trades';
import { useAlbum } from '@/hooks/use-album';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  /** «Pedir un cromo» (de una especie que ya registraste) u «Ofrecer» uno de tus cromos. */
  mode: 'request' | 'offer';
  speciesId: string;
  onBack: () => void;
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * IntercambioProponer: se elige qué se da (o qué se pide) y la propuesta se manda por enlace o se
 * muestra en un QR. La acepta quien la abra y cumpla las reglas; el servidor hace el intercambio.
 */
export function TradePropose({ mode, speciesId, onBack }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSession()?.uid;
  const state = useAlbum();
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState<'link' | 'qr' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null);
  // Una propuesta por par de cromos: si se vuelve a mandar la misma, se reusa el enlace.
  const created = useRef(new Map<string, string>());

  const album = state.status === 'ready' ? state.album : null;
  const target = album?.entries.find((e) => e.species.id === speciesId);
  const valid = !!target?.sticker && (mode === 'request' ? !target.sticker.chrome : !!target.sticker.chrome);
  const options = album && target && valid ? (mode === 'request' ? offerOptions(album, target) : requestOptions(album, target)) : [];
  const selected = options.find((o) => o.species.id === choice) ?? options[0];
  const offered = mode === 'request' ? selected : target;
  const requested = mode === 'request' ? target : selected;

  async function send(kind: 'link' | 'qr') {
    if (!album || !userId || !offered || !requested) return;
    setBusy(kind);
    setError(null);
    try {
      const key = `${offered.species.id}|${requested.species.id}`;
      let id = created.current.get(key);
      if (!id) {
        id = await useCases.proposeTrade(userId, album, offered.species.id, requested.species.id);
        created.current.set(key, id);
      }
      const link = tradeLink(id);
      if (kind === 'qr') setQrLink(link);
      else {
        await Share.share({
          message: `Te propongo un intercambio en Plumario: mi cromo de ${offered.species.commonName} por tu cromo de ${requested.species.commonName}. Ábrelo acá: ${link}`,
        });
      }
    } catch (e) {
      setError(
        e instanceof TradeProposalError && e.problem === 'no-profile'
          ? 'Completa tu perfil para proponer intercambios.'
          : 'No se pudo crear la propuesta. Revisa tu conexión y vuelve a intentar.',
      );
    } finally {
      setBusy(null);
    }
  }

  const title = mode === 'request' ? 'Pedir un cromo' : 'Ofrecer un cromo';
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title={title} onBack={onBack} />
      {!album && <ListSkeleton rows={4} inset />}
      {album && (!target || !valid) && (
        <ThemedText color="textSecondary" style={styles.message}>
          {mode === 'request' ? 'Solo se pide el cromo de una especie que ya registraste y que aún no tienes cromada.' : 'Solo se ofrece un cromo que tengas.'}
        </ThemedText>
      )}
      {album && target && valid && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.target, { backgroundColor: colors.surface, borderColor: colors.line }]} accessible>
              <SpeciesSticker entry={target} size={96} chromed />
              <View style={styles.flex}>
                <ThemedText variant="eyebrow" color="primary">{mode === 'request' ? 'Quieres' : 'Ofreces'}</ThemedText>
                <ThemedText variant="heading">{target.species.commonName}</ThemedText>
                <ThemedText variant="small" color="textSecondary">Cromo {CATEGORY_LABELS[target.category]}</ThemedText>
                <View style={styles.row}>
                  <Icon name="check" color={colors.success} size={14} strokeWidth={2.6} />
                  <ThemedText variant="captionStrong" color="success">
                    {mode === 'request' ? 'Ya tienes su sticker normal' : `Lo obtuviste ${CHROME_SOURCE_SHORT[target.sticker!.chrome!.source]}`}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.arrows} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Icon name="swap" color={colors.textSecondary} size={26} strokeWidth={2} />
            </View>

            <ThemedText variant="eyebrow" style={{ color: colors.warning }} accessibilityRole="header">
              {mode === 'request' ? 'Ofreces a cambio' : 'Pides a cambio'}
            </ThemedText>
            {options.length === 0 ? (
              <ThemedText variant="small" color="textSecondary">
                {mode === 'request'
                  ? `Para pedirlo necesitas un cromo ${CATEGORY_LABELS[target.category]} o de una categoría mayor.`
                  : `No tienes especies registradas sin cromo de categoría ${CATEGORY_LABELS[target.category]} o menor.`}
              </ThemedText>
            ) : (
              <View accessibilityRole="radiogroup" accessibilityLabel={mode === 'request' ? 'Ofreces a cambio' : 'Pides a cambio'} style={styles.options}>
                {options.map((entry) => (
                  <Option key={entry.species.id} entry={entry} mode={mode} selected={entry.species.id === selected?.species.id} onPress={() => setChoice(entry.species.id)} />
                ))}
              </View>
            )}
            <ThemedText variant="caption" color="textSecondary" style={styles.note}>
              Ofrece un cromo de la misma categoría o superior a la que pides. Si la otra persona acepta, cada uno recibe el cromo del otro y el suyo vuelve a la versión normal. Solo se puede recibir el cromo de una especie que ya registraste.
            </ThemedText>
            {error && <ThemedText variant="small" color="error" style={styles.note}>{error}</ThemedText>}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
            <Button label="Enviar propuesta por enlace" icon="share" onPress={() => void send('link')} busy={busy === 'link'} disabled={!selected || !!busy} />
            <Button label="Mostrar código QR" icon="qr" variant="secondary" onPress={() => void send('qr')} busy={busy === 'qr'} disabled={!selected || !!busy} />
          </View>
        </>
      )}

      <Sheet visible={!!qrLink} onClose={() => setQrLink(null)} label="Código QR del intercambio">
        <View style={styles.qr}>
          <ThemedText variant="heading" style={styles.center}>Código del intercambio</ThemedText>
          <ThemedText variant="small" color="textSecondary" style={styles.center}>
            Que la otra persona lo escanee con la cámara de su teléfono para abrir la propuesta.
          </ThemedText>
          <View style={styles.qrCode} accessible accessibilityRole="image" accessibilityLabel="Código QR de la propuesta">
            {qrLink && <QRCode value={qrLink} size={220} color="#14302F" backgroundColor="#FFFFFF" />}
          </View>
          <Button label="Listo" variant="secondary" onPress={() => setQrLink(null)} />
        </View>
      </Sheet>
    </View>
  );
}

function Option({ entry, mode, selected, onPress }: { entry: AlbumEntry; mode: Props['mode']; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const how = mode === 'request' ? CHROME_SOURCE_SHORT[entry.sticker!.chrome!.source] : 'tienes el sticker normal';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${entry.species.commonName}, cromo ${CATEGORY_LABELS[entry.category]}`}
      onPress={onPress}
      style={[styles.option, selected ? { borderWidth: 1.5, borderColor: colors.text, backgroundColor: colors.surface } : { borderWidth: 1, borderColor: colors.line }]}>
      <View style={[styles.radio, { borderColor: selected ? colors.text : colors.border }]}>{selected && <View style={[styles.radioDot, { backgroundColor: colors.text }]} />}</View>
      <SpeciesSticker entry={entry} size={52} chromed={mode === 'offer' ? true : undefined} />
      <View style={styles.flex}>
        <ThemedText variant="bodyStrong">{entry.species.commonName}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{capitalize(CATEGORY_LABELS[entry.category])} · {how}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  message: {
    marginHorizontal: layout.textMargin,
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  target: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  arrows: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '90deg' }],
  },
  options: {
    gap: spacing[2],
  },
  option: {
    minHeight: 84,
    borderRadius: 16,
    paddingVertical: spacing[2],
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  note: {
    marginTop: spacing[2],
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
    gap: 10,
  },
  qr: {
    paddingHorizontal: spacing[5],
    gap: spacing[3],
  },
  center: {
    textAlign: 'center',
  },
  qrCode: {
    alignSelf: 'center',
    padding: spacing[3],
    borderRadius: radius.control,
    backgroundColor: '#FFFFFF',
  },
});
