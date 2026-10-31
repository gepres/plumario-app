import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nextHandleChange, normalizeHandle, type UserProfile } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { BirdAvatar, Button, Icon, TextField, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { SettingsSkeleton } from '@/components/screen-skeletons';
import { AUTH_ERROR_MESSAGES, profileErrors, type ProfileErrors } from '@/constants/account-messages';
import { stickerTint } from '@/constants/habitats';
import { STICKER_ART } from '@/constants/sticker-art';
import { invalidateProfile } from '@/hooks/profile-version';
import { useAlbum } from '@/hooks/use-album';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  onBack: () => void;
  onSaved: () => void;
};

const shortDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

/** PerfilEditar: ave favorita (la foto de perfil), nombre, @usuario y correo. */
export function ProfileEdit({ onBack, onSaved }: Props) {
  const profile = useProfile();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Editar perfil" onBack={onBack} />
      {/* El formulario arranca con el perfil ya cargado, así sus valores iniciales son los de verdad. */}
      {profile ? <EditForm profile={profile} onSaved={onSaved} /> : <SettingsSkeleton inset />}
    </KeyboardAvoidingView>
  );
}

function EditForm({ profile, onSaved }: { profile: UserProfile; onSaved: () => void }) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSession();
  const state = useAlbum();
  const [favorite, setFavorite] = useState(profile.favoriteSpeciesId);
  const [name, setName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const registered = state.status === 'ready' ? state.album.entries.filter((e) => e.sticker) : [];
  const chosen = registered.find((e) => e.species.id === favorite);
  const emailChanged = !!user?.email && email.trim().toLowerCase() !== user.email.toLowerCase();
  const until = nextHandleChange(profile, new Date());

  async function save() {
    if (!user) return;
    setSaving(true);
    setErrors({});
    setNotice(null);
    try {
      if (name !== profile.displayName || favorite !== profile.favoriteSpeciesId) {
        await useCases.updateProfile(user.uid, { displayName: name, favoriteSpeciesId: favorite });
      }
      if (normalizeHandle(handle) !== profile.handle) await useCases.changeHandle(user.uid, profile, handle);
      if (emailChanged) await useCases.changeEmail(email, password);
      invalidateProfile();
      // El correo no cambia hasta abrir el enlace: se avisa antes de salir.
      if (emailChanged) setNotice(`Te enviamos un enlace a ${email.trim()}. Tu correo cambia cuando lo abras.`);
      else onSaved();
    } catch (error) {
      invalidateProfile();
      setErrors(profileErrors(error));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!user?.email) return;
    setNotice(null);
    try {
      await useCases.requestPasswordReset(user.email);
      setNotice(`Te enviamos un correo a ${user.email} para cambiar tu contraseña.`);
    } catch {
      setErrors({ form: AUTH_ERROR_MESSAGES.network });
    }
  }

  return (
    <>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={[styles.favorite, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.favoriteHead}>
            <BirdAvatar figure={chosen?.species.figure ?? 'gull'} tint={stickerTint(chosen?.species.habitat ?? 'coast')} empty={!chosen} size={64} art={chosen && STICKER_ART[chosen.species.id]} />
            <View style={styles.flex}>
              <ThemedText variant="eyebrow" color="primary">Tu ave favorita</ThemedText>
              <ThemedText variant="bodyStrong">{chosen?.species.commonName ?? 'Sin elegir'}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">Es tu foto de perfil. Elige entre las aves que ya registraste.</ThemedText>
            </View>
          </View>
          {registered.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.birds} accessibilityRole="radiogroup" accessibilityLabel="Tu ave favorita">
              {registered.map((entry) => {
                const selected = entry.species.id === favorite;
                return (
                  <Pressable
                    key={entry.species.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={entry.species.commonName}
                    onPress={() => setFavorite(entry.species.id)}
                    style={[styles.bird, selected && { boxShadow: `0 0 0 3px ${colors.surface}, 0 0 0 5px ${colors.text}` }]}>
                    <BirdAvatar figure={entry.species.figure} tint={stickerTint(entry.species.habitat)} chromed={!!entry.finish} size={50} art={STICKER_ART[entry.species.id]} />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <ThemedText variant="caption" color="textSecondary">Registra tu primera ave para elegirla.</ThemedText>
          )}
        </View>

        <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Cómo te llamas" help="Así aparece en tus pósteres." error={errors.displayName} maxLength={40} />
        <TextField
          label="Usuario"
          kind="handle"
          value={handle}
          onChangeText={setHandle}
          placeholder="tu_usuario"
          help={until ? `Podrás cambiarlo desde el ${shortDate.format(until)}.` : 'Se puede cambiar una vez cada 30 días.'}
          error={errors.handle}
          editable={!until}
          maxLength={25}
        />
        <TextField label="Correo" kind="email" value={email} onChangeText={setEmail} placeholder="tucorreo@ejemplo.com" help="Para entrar y recuperar tu contraseña." error={errors.email} />
        {emailChanged && (
          <TextField label="Tu contraseña actual" kind="password" value={password} onChangeText={setPassword} help="Para confirmar que eres tú antes de cambiar el correo." error={errors.password} />
        )}
        <Pressable accessibilityRole="button" onPress={() => void changePassword()} style={[styles.passwordRow, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          <Icon name="key" color={colors.text} size={20} strokeWidth={1.9} />
          <ThemedText variant="bodyStrong" style={styles.flex}>Cambiar contraseña</ThemedText>
          <Icon name="chevronRight" color={colors.textSecondary} size={16} strokeWidth={2} />
        </Pressable>
      </ScrollView>
      {/* Los avisos van sobre el botón, a la vista aunque el formulario sea largo. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        {notice && <ThemedText variant="small" color="success" accessibilityLiveRegion="polite">{notice}</ThemedText>}
        {errors.form && <ThemedText variant="small" color="error">{errors.form}</ThemedText>}
        <Button label="Guardar cambios" onPress={() => void save()} busy={saving} disabled={emailChanged && !password} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  favorite: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: spacing[3],
  },
  favoriteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  birds: {
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  bird: {
    borderRadius: 25,
  },
  passwordRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
    gap: spacing[2],
  },
});
