import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AlbumVisibility, Privacy, UserProfile } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, SettingsList, Sheet, Switch, TextField, ThemedText, ToggleGroup, TopBar, useTheme } from '@plumario/ui';

import { AUTH_ERROR_MESSAGES, authErrorCode } from '@/constants/account-messages';
import { invalidateProfile } from '@/hooks/profile-version';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';
import { shareFile } from '@/utils/export-image';

type Props = {
  onBack: () => void;
  onOpenPolicy: () => void;
};

const VISIBILITY_NOTES: Record<AlbumVisibility, string> = {
  private: 'Nadie más ve tu álbum. Los intercambios siguen funcionando por enlace o QR.',
  link: 'Lo ve quien reciba tu enlace. No aparece en búsquedas.',
  public: 'Cualquier persona puede ver tus stickers y medallas. Nunca tus fotos ni su ubicación.',
};

/** PerfilPrivacidad: la ubicación de las fotos, quién ve el álbum y los datos propios. */
export function ProfilePrivacy({ onBack, onOpenPolicy }: Props) {
  const profile = useProfile();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Privacidad" onBack={onBack} />
      {profile ? <PrivacyContent profile={profile} onOpenPolicy={onOpenPolicy} /> : <ActivityIndicator style={styles.loading} />}
    </View>
  );
}

function PrivacyContent({ profile, onOpenPolicy }: { profile: UserProfile; onOpenPolicy: () => void }) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSession()?.uid;
  // Cada cambio se guarda al toque; si falla, vuelve a como estaba.
  const [privacy, setPrivacy] = useState<Privacy>(profile.privacy);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function change(next: Partial<Privacy>) {
    if (!userId) return;
    const before = privacy;
    const updated = { ...privacy, ...next };
    setPrivacy(updated);
    setError(null);
    try {
      await useCases.updateProfile(userId, { privacy: updated });
      invalidateProfile();
    } catch {
      setPrivacy(before);
      setError('No se pudo guardar el cambio. Revisa tu conexión.');
    }
  }

  async function exportData() {
    if (!userId) return;
    setExporting(true);
    setError(null);
    try {
      const data = await useCases.exportUserData(userId);
      const file = new File(Paths.cache, 'plumario-mis-datos.json');
      if (file.exists) file.delete();
      await file.write(JSON.stringify(data, null, 2));
      await shareFile(file.uri, 'application/json', 'Mis datos de Plumario');
    } catch {
      setError('No se pudieron preparar tus datos. Vuelve a intentar.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
      <ThemedText color="textSecondary" style={styles.intro}>Tú decides qué se ve de tu álbum. Tus fotos y su ubicación son tuyas.</ThemedText>

      <View style={styles.section}>
        <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Ubicación de tus fotos</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Switch
            label="Guardar la ubicación"
            description="Solo sirve para asignar la foto a su región. Nadie más la ve."
            value={privacy.saveLocation}
            onChange={(saveLocation) => void change({ saveLocation })}
          />
          <View style={[styles.always, { borderTopColor: colors.line }]} accessible>
            <Icon name="shield" color={colors.text} size={18} strokeWidth={1.9} />
            <View style={styles.flex}>
              <ThemedText variant="bodyStrong">Especies amenazadas</ThemedText>
              <ThemedText variant="caption" color="textSecondary">Su ubicación se oculta siempre, también al compartir.</ThemedText>
            </View>
            <ThemedText variant="captionStrong" color="success">Siempre</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Tu álbum</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <ThemedText variant="bodyStrong">Quién puede ver tu álbum</ThemedText>
          <ToggleGroup
            label="Quién puede ver tu álbum"
            value={privacy.albumVisibility}
            onChange={(albumVisibility) => void change({ albumVisibility })}
            options={[
              { key: 'private', label: 'Solo yo' },
              { key: 'link', label: 'Con enlace' },
              { key: 'public', label: 'Todos' },
            ]}
          />
          <ThemedText variant="caption" color="textSecondary">{VISIBILITY_NOTES[privacy.albumVisibility]}</ThemedText>
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <Switch
            label="Tu nombre en lo que compartes"
            description="En pósteres y tarjetas. Apagado, sale tu usuario."
            value={privacy.showName}
            onChange={(showName) => void change({ showName })}
          />
          <Switch
            label="Usar tus fotos para mejorar la IA"
            description="Ayuda a reconocer mejor las aves. Puedes apagarlo cuando quieras."
            value={privacy.improveAi}
            onChange={(improveAi) => void change({ improveAi })}
          />
        </View>
      </View>
      {error && <ThemedText variant="small" color="error" style={styles.intro} accessibilityLiveRegion="polite">{error}</ThemedText>}

      <View style={styles.section}>
        <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Tus datos</ThemedText>
        <SettingsList
          label="Tus datos"
          items={[
            {
              key: 'export',
              icon: 'download',
              title: exporting ? 'Preparando tus datos…' : 'Descargar tus datos',
              detail: 'Registros, stickers y recompensas en un archivo, con enlaces a tus fotos',
              onPress: exporting ? undefined : () => void exportData(),
            },
            { key: 'delete', icon: 'trash', title: 'Eliminar tu cuenta', detail: 'Borra tu álbum y tus fotos. No se puede deshacer.', danger: true, onPress: () => setDeleting(true) },
          ]}
        />
      </View>
      <Button label="Política de privacidad" variant="tertiary" onPress={onOpenPolicy} />

      <DeleteAccountSheet visible={deleting} onClose={() => setDeleting(false)} />
    </ScrollView>
  );
}

/** Confirmación de «Eliminar tu cuenta»: con la contraseña, porque no se deshace. */
function DeleteAccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { useCases } = useDependencies();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function confirm() {
    setBusy(true);
    setError(undefined);
    try {
      // Al borrarse la cuenta se cierra la sesión y la app vuelve sola a Login.
      await useCases.deleteAccount(password);
    } catch (e) {
      setError(AUTH_ERROR_MESSAGES[authErrorCode(e)]);
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={busy ? () => undefined : onClose} label="Eliminar tu cuenta">
      <View style={styles.sheet}>
        <ThemedText variant="heading">Eliminar tu cuenta</ThemedText>
        <ThemedText color="textSecondary">
          Se borran tu álbum, tus fotos, tus recompensas y tu @usuario, que queda libre. Tus propuestas de intercambio abiertas se cancelan. No se puede deshacer.
        </ThemedText>
        <TextField label="Tu contraseña" kind="password" value={password} onChangeText={setPassword} error={error} />
        <Button label="Eliminar mi cuenta" variant="danger" onPress={() => void confirm()} busy={busy} disabled={!password} />
        <Button label="Cancelar" variant="tertiary" onPress={onClose} disabled={busy} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    marginTop: spacing[6],
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[4],
  },
  intro: {
    marginHorizontal: 4,
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    marginHorizontal: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  always: {
    borderTopWidth: 1,
    paddingTop: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  flex: {
    flex: 1,
    gap: 1,
  },
  divider: {
    height: 1,
  },
  sheet: {
    paddingHorizontal: spacing[5],
    gap: spacing[3],
  },
});
