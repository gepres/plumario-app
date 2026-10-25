import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, FormScreen, IconTile, TextField, TextLink, ThemedText, TopBar } from '@plumario/ui';

import { AUTH_ERROR_MESSAGES, authErrorCode } from '@/constants/account-messages';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  initialEmail?: string;
  onBack: () => void;
  onSent: (email: string) => void;
};

/** OlvideContrasena (design/project/OlvideContrasena.dc.html): pedir el enlace para crear una nueva. */
export function ForgotPassword({ initialEmail = '', onBack, onSent }: Props) {
  const { useCases } = useDependencies();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await useCases.requestPasswordReset(email);
      onSent(email.trim());
    } catch (e) {
      setError(AUTH_ERROR_MESSAGES[authErrorCode(e)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen header={<TopBar onBack={onBack} />}>
      <IconTile name="key" />
      <View style={styles.heading}>
        <ThemedText variant="title" accessibilityRole="header">¿Olvidaste tu contraseña?</ThemedText>
        <ThemedText color="textSecondary">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.</ThemedText>
      </View>
      <TextField
        label="Correo"
        kind="email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(null);
        }}
        placeholder="tucorreo@ejemplo.com"
        returnKeyType="send"
        onSubmitEditing={submit}
        error={error ?? undefined}
      />
      <Button label="Enviar enlace" icon="mail" onPress={submit} busy={busy} />
      <View style={styles.footer}>
        <TextLink label="Volver a iniciar sesión" onPress={onBack} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
});
