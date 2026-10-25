import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_REGION_ID, PLACE_NAME_MAX, type AlbumEntry } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText, TopBar, textStyles, useTheme } from '@plumario/ui';

import { SpeciesSticker } from '@/components/species-sticker';
import { formatShortDate } from '@/constants/cards';
import { useAlbum } from '@/hooks/use-album';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  photoUri: string;
  takenAt: Date;
  speciesId: string;
  onBack: () => void;
  onChangePhoto: () => void;
  onSaved: (sightingId: string) => void;
};

type Check = { status: 'checking' } | { status: 'ok' } | { status: 'mismatch'; reason: string };

/** RegistrarColocar: la foto sobre el sticker elegido, la confirmación de la IA y guardar. */
export function Place({ photoUri, takenAt, speciesId, onBack, onChangePhoto, onSaved }: Props) {
  const state = useAlbum();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const entry = state.status === 'ready' ? state.album.entries.find((e) => e.species.id === speciesId) : undefined;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Colocar foto" onBack={onBack} />
      {state.status === 'loading' && <ActivityIndicator style={styles.loading} />}
      {state.status === 'error' && <ThemedText color="error" style={styles.message}>No se pudo cargar el álbum. Revisa tu conexión.</ThemedText>}
      {state.status === 'ready' && !entry && <ThemedText color="textSecondary" style={styles.message}>Esta especie no está en el álbum.</ThemedText>}
      {entry && <PlaceContent entry={entry} photoUri={photoUri} takenAt={takenAt} onChangePhoto={onChangePhoto} onSaved={onSaved} />}
    </KeyboardAvoidingView>
  );
}

function PlaceContent({ entry, photoUri, takenAt, onChangePhoto, onSaved }: { entry: AlbumEntry } & Pick<Props, 'photoUri' | 'takenAt' | 'onChangePhoto' | 'onSaved'>) {
  const { useCases } = useDependencies();
  const { mode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSession()?.uid;
  const { species, sticker } = entry;
  const [check, setCheck] = useState<Check>({ status: 'checking' });
  const [place, setPlace] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    useCases
      .checkPhoto(photoUri, species)
      .then((verdict) => current && setCheck(verdict.valid ? { status: 'ok' } : { status: 'mismatch', reason: verdict.reason ?? `La foto no parece de ${species.commonName}.` }))
      // Sin la IA (sin señal), se deja guardar: el servidor la valida igual antes de otorgar nada.
      .catch(() => current && setCheck({ status: 'ok' }));
    return () => {
      current = false;
    };
  }, [useCases, photoUri, species]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const sightingId = await useCases.registerSighting({ userId, regionId: DEFAULT_REGION_ID, species, photoUri, takenAt, placeName: place });
      onSaved(sightingId);
    } catch {
      setError('No se pudo guardar la foto. Revisa tu conexión y vuelve a intentar.');
      setSaving(false);
    }
  }

  return (
    <>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={[styles.stage, { backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.stageSticker}>
            <SpeciesSticker entry={entry} size={176} />
          </View>
          <View style={styles.polaroid} accessible accessibilityRole="image" accessibilityLabel="Tu foto">
            <Image source={{ uri: photoUri }} style={styles.polaroidPhoto} contentFit="cover" />
          </View>
          <View style={[styles.photoChip, { backgroundColor: colors.surface }]}>
            <ThemedText variant="captionStrong">Tu foto, completa</ThemedText>
          </View>
        </View>

        {check.status === 'checking' && (
          <View style={[styles.banner, { backgroundColor: colors.surface }]}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText variant="bodyStrong">La IA revisa tu foto…</ThemedText>
          </View>
        )}
        {check.status === 'ok' && (
          <View style={[styles.banner, { backgroundColor: mode === 'dark' ? colors.surfaceAlt : '#E3EEE6' }]} accessibilityLiveRegion="polite">
            <View style={[styles.bannerMark, { backgroundColor: colors.success }]}>
              <Icon name="check" color={mode === 'dark' ? colors.background : '#FFFFFF'} size={15} strokeWidth={2.8} />
            </View>
            <View style={styles.bannerText}>
              <ThemedText variant="bodyStrong" color="success">La IA confirma: {species.commonName}</ThemedText>
              <ThemedText variant="caption" color="success">{species.scientificName} · coincidencia alta</ThemedText>
            </View>
          </View>
        )}
        {check.status === 'mismatch' && (
          <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.error, borderWidth: 1.5 }]} accessibilityLiveRegion="polite">
            <Icon name="alert" color={colors.error} size={24} />
            <View style={styles.bannerText}>
              <ThemedText variant="bodyStrong" color="error">{check.reason}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">Prueba con otra foto en la que se vea bien el ave.</ThemedText>
            </View>
          </View>
        )}

        <View style={styles.fields}>
          <View style={styles.field}>
            <ThemedText variant="captionStrong" color="textSecondary">Fecha</ThemedText>
            <View style={[styles.input, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <ThemedText>{formatShortDate(takenAt)}</ThemedText>
            </View>
          </View>
          {!species.threatened && (
            <View style={styles.field}>
              <ThemedText variant="captionStrong" color="textSecondary">Lugar</ThemedText>
              <TextInput
                value={place}
                onChangeText={setPlace}
                maxLength={PLACE_NAME_MAX}
                placeholder="Ej.: Paracas"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Lugar"
                selectionColor={colors.primary}
                style={[styles.input, styles.inputText, { borderColor: colors.border, backgroundColor: colors.field, color: colors.text }]}
              />
            </View>
          )}
        </View>
        <ThemedText variant="small" color="textSecondary" style={styles.note}>
          {species.threatened
            ? 'Es una especie amenazada: no guardamos dónde la viste, para protegerla.'
            : 'Tu foto se guarda en la galería del ave. En el álbum se verá su figura, igual para todos.'}
        </ThemedText>
        {error && <ThemedText variant="small" color="error" style={styles.note}>{error}</ThemedText>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Button
          label={sticker ? `Agregar a la galería de ${species.commonName}` : 'Guardar y completar sticker'}
          onPress={() => void save()}
          disabled={check.status !== 'ok'}
          busy={saving}
        />
        <Button label="Cambiar foto" variant="tertiary" onPress={onChangePhoto} disabled={saving} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    marginTop: spacing[6],
  },
  message: {
    marginHorizontal: layout.cardMargin,
  },
  content: {
    gap: 14,
    paddingBottom: spacing[4],
  },
  stage: {
    marginHorizontal: layout.cardMargin,
    height: 300,
    borderRadius: 22,
    overflow: 'hidden',
  },
  stageSticker: {
    position: 'absolute',
    left: 34,
    top: 34,
  },
  polaroid: {
    position: 'absolute',
    right: 24,
    top: 92,
    width: 164,
    height: 124,
    padding: 6,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '6deg' }],
    boxShadow: '0 2px 4px rgba(20,48,47,0.22), 0 14px 28px rgba(20,48,47,0.22)',
  },
  polaroidPhoto: {
    flex: 1,
    backgroundColor: '#93B1BA',
  },
  photoChip: {
    position: 'absolute',
    right: 30,
    top: 236,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  banner: {
    marginHorizontal: layout.cardMargin,
    padding: spacing[3],
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    gap: 1,
  },
  fields: {
    marginHorizontal: layout.cardMargin,
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
    gap: spacing[1],
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    justifyContent: 'center',
  },
  inputText: {
    ...textStyles.body,
    paddingVertical: 0,
  },
  note: {
    marginHorizontal: layout.textMargin,
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
    gap: 10,
  },
});
