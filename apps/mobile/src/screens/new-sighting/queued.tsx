import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText, useTheme } from '@plumario/ui';

import { SpeciesSticker } from '@/components/species-sticker';
import { useAlbum } from '@/hooks/use-album';

type Props = {
  speciesId: string;
  onClose: () => void;
  onRegisterAnother: () => void;
};

/**
 * Sin señal: la foto quedó guardada en el teléfono y se sube sola al volver la conexión. El servidor
 * la valida entonces y, si corresponde, llega la celebración.
 */
export function SightingQueued({ speciesId, onClose, onRegisterAnother }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useAlbum();
  const entry = state.status === 'ready' ? state.album.entries.find((e) => e.species.id === speciesId) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[4] }]}>
      <View style={styles.body} accessibilityRole="summary" accessibilityLiveRegion="polite">
        {entry && (
          <View style={styles.sticker}>
            <SpeciesSticker entry={entry} size={150} />
            <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Icon name="download" color={colors.text} size={18} strokeWidth={2} />
            </View>
          </View>
        )}
        <ThemedText variant="eyebrow" color="warning" style={styles.center}>Sin señal</ThemedText>
        <ThemedText variant="title" style={styles.center}>Guardada en tu teléfono</ThemedText>
        <ThemedText color="textSecondary" style={styles.center}>
          {entry ? `Tu foto de ${entry.species.commonName} se subirá sola` : 'Tu foto se subirá sola'} cuando vuelvas a tener señal. Ahí la validamos y, si es nueva, se suma a tu álbum.
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={styles.center}>
          Mientras, la ves en la galería de la especie como «En espera». No cierres sesión hasta que se suba.
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Button label="Registrar otra" onPress={onRegisterAnother} />
        <Button label="Cerrar" variant="tertiary" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  sticker: {
    marginBottom: spacing[4],
    transform: [{ rotate: '-4deg' }],
  },
  badge: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: '100%',
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: layout.cardMargin,
    gap: 10,
  },
});
