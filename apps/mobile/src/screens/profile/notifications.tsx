import { useEffect, useState } from 'react';
import { AppState, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NotificationSettings, PushPermission, UserProfile } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { Button, Icon, Switch, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { SettingsSkeleton } from '@/components/screen-skeletons';
import { invalidateProfile } from '@/hooks/profile-version';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

const TOPICS: readonly { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: 'achievements', label: 'Logros', description: 'Cuando ganas una medalla y no tienes la app abierta.' },
  { key: 'trades', label: 'Intercambios', description: 'Cuando alguien acepta una propuesta tuya.' },
  { key: 'regions', label: 'Nuevas regiones', description: 'Cuando abre una región que pediste con «Avísame cuando esté».' },
];

/** Perfil › Notificaciones (la fila de Perfil.dc.html): el permiso del teléfono y qué avisos quiere. */
export function ProfileNotifications({ onBack }: { onBack: () => void }) {
  const profile = useProfile();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Notificaciones" onBack={onBack} />
      {profile ? <NotificationsContent profile={profile} /> : <SettingsSkeleton inset />}
    </View>
  );
}

function NotificationsContent({ profile }: { profile: UserProfile }) {
  const { useCases, notifications } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useSession()?.uid;
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [enabling, setEnabling] = useState(false);
  // Cada cambio se guarda al toque; si falla, vuelve a como estaba.
  const [settings, setSettings] = useState<NotificationSettings>(profile.notifications);
  const [error, setError] = useState<string | null>(null);

  // Al volver de los ajustes del teléfono, el permiso pudo cambiar.
  useEffect(() => {
    const check = () => void notifications.permission().then(setPermission);
    check();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => subscription.remove();
  }, [notifications]);

  async function enable() {
    if (!userId) return;
    setEnabling(true);
    setError(null);
    try {
      setPermission(await useCases.enablePushNotifications(userId));
    } catch {
      setError('No se pudieron activar. Revisa tu conexión y vuelve a intentar.');
    } finally {
      setEnabling(false);
    }
  }

  async function change(next: Partial<NotificationSettings>) {
    if (!userId) return;
    const before = settings;
    const updated = { ...settings, ...next };
    setSettings(updated);
    setError(null);
    try {
      await useCases.updateProfile(userId, { notifications: updated });
      invalidateProfile();
    } catch {
      setSettings(before);
      setError('No se pudo guardar el cambio. Revisa tu conexión.');
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
      <ThemedText color="textSecondary" style={styles.intro}>Te avisamos de lo que pasa con tu álbum aunque no tengas la app abierta.</ThemedText>

      {permission !== null && permission !== 'granted' && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]} accessibilityLiveRegion="polite">
          <View style={styles.status}>
            <Icon name="bell" color={colors.text} size={20} strokeWidth={1.9} />
            <View style={styles.flex}>
              <ThemedText variant="bodyStrong">{permission === 'denied' ? 'Están apagadas en tu teléfono' : 'Todavía no están activadas'}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                {permission === 'denied'
                  ? 'Para recibirlas, actívalas para Plumario en los ajustes del teléfono.'
                  : 'Tu teléfono te pedirá permiso para mostrarlas.'}
              </ThemedText>
            </View>
          </View>
          {permission === 'denied' ? (
            <Button label="Abrir ajustes del teléfono" variant="secondary" onPress={() => void Linking.openSettings()} />
          ) : (
            <Button label="Activar notificaciones" icon="bell" busy={enabling} onPress={() => void enable()} />
          )}
        </View>
      )}

      <View style={styles.section}>
        <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Avísame de</ThemedText>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {TOPICS.map(({ key, label, description }) => (
            <Switch key={key} label={label} description={description} value={settings[key]} onChange={(value) => void change({ [key]: value })} />
          ))}
        </View>
      </View>
      {error && <ThemedText variant="small" color="error" style={styles.intro} accessibilityLiveRegion="polite">{error}</ThemedText>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
});
