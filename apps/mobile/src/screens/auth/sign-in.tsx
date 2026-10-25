import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FormScreen, GradientView, Logo, TextDivider, TextField, TextLink, ThemedText, useTheme } from '@plumario/ui';

import { AUTH_ERROR_MESSAGES, authErrorCode } from '@/constants/account-messages';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  onForgotPassword: (email: string) => void;
  onCreateAccount: () => void;
};

/** Login (design/project/TemaLogin.dc.html): entrar con correo y contraseña. */
export function SignIn({ onForgotPassword, onCreateAccount }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field: 'email' | 'password' | 'form'; message: string } | null>(null);
  const [providerNote, setProviderNote] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // Al entrar, la ruta raíz cambia sola a las pestañas (Stack.Protected).
      await useCases.signIn(email, password);
    } catch (e) {
      const code = authErrorCode(e);
      const field = code === 'invalid-email' ? 'email' : code === 'invalid-credentials' ? 'password' : 'form';
      setError({ field, message: AUTH_ERROR_MESSAGES[code] });
      setBusy(false);
    }
  }

  const hero = (
    <GradientView gradient={colors.hero} style={[styles.hero, { paddingTop: insets.top }]}>
      <Logo variant="mark" size={76} />
      <ThemedText variant="reveal" style={{ color: colors.onHero }} accessibilityRole="header">Plumario</ThemedText>
      <ThemedText variant="small" style={{ color: colors.onHeroSecondary }}>Colecciona las aves del Perú, foto a foto.</ThemedText>
    </GradientView>
  );

  return (
    <FormScreen header={hero} headerBleeds sheet>
      <StatusBar style="light" />
      <ThemedText variant="title" accessibilityRole="header">Inicia sesión</ThemedText>
      <TextField
        label="Correo"
        kind="email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error?.field === 'email') setError(null);
        }}
        placeholder="tucorreo@ejemplo.com"
        returnKeyType="next"
        error={error?.field === 'email' ? error.message : undefined}
      />
      <TextField
        label="Contraseña"
        kind="password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (error?.field === 'password') setError(null);
        }}
        returnKeyType="go"
        onSubmitEditing={submit}
        error={error?.field === 'password' ? error.message : undefined}
      />
      <View style={styles.forgot}>
        <TextLink label="¿Olvidaste tu contraseña?" onPress={() => onForgotPassword(email.trim())} />
      </View>
      {error?.field === 'form' && <ThemedText variant="small" color="error">{error.message}</ThemedText>}
      <Button label={busy ? 'Entrando…' : 'Entrar'} onPress={submit} busy={busy} />
      <TextDivider label="o entra con" />
      <View style={styles.providers}>
        {(['Google', 'Apple'] as const).map((provider) => (
          <View key={provider} style={styles.provider}>
            <Button
              label={provider}
              variant="tertiary"
              onPress={() => setProviderNote(`Entrar con ${provider} llega pronto. Por ahora, usa tu correo.`)}
            />
          </View>
        ))}
      </View>
      {providerNote && <ThemedText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">{providerNote}</ThemedText>}
      <View style={styles.footer}>
        <ThemedText variant="small" color="textSecondary">¿No tienes cuenta?</ThemedText>
        <TextLink label="Crear cuenta" onPress={onCreateAccount} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 286,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginVertical: -10,
  },
  providers: {
    flexDirection: 'row',
    gap: 10,
  },
  provider: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
});
