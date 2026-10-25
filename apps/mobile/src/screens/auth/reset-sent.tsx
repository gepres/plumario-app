import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { Button, FormScreen, IconTile, InfoNote, TextLink, ThemedText, TopBar } from '@plumario/ui';

import { AUTH_ERROR_MESSAGES, authErrorCode } from '@/constants/account-messages';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  email: string;
  onBack: () => void;
  onChangeEmail: () => void;
  onSignIn: () => void;
};

/** Segundos hasta poder pedir otro enlace, para no mandar correos de más. */
const RESEND_AFTER = 45;

const countdown = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** OlvideEnviado (design/project/OlvideEnviado.dc.html): el enlace va en camino. */
export function ResetSent({ email, onBack, onChangeEmail, onSignIn }: Props) {
  const { useCases } = useDependencies();
  const [wait, setWait] = useState(RESEND_AFTER);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function resend() {
    setError(null);
    try {
      await useCases.requestPasswordReset(email);
      setResent(true);
      setWait(RESEND_AFTER);
    } catch (e) {
      setError(AUTH_ERROR_MESSAGES[authErrorCode(e)]);
    }
  }

  // En iOS, message: abre la bandeja de Mail; en Android no hay un enlace equivalente y mailto:
  // abre la app de correo para escribir, desde donde se vuelve a la bandeja.
  const openMail = () => Linking.openURL(Platform.OS === 'ios' ? 'message:' : 'mailto:').catch(() => undefined);

  return (
    <FormScreen header={<TopBar onBack={onBack} />}>
      <IconTile name="mail" />
      <View style={styles.heading}>
        <ThemedText variant="title" accessibilityRole="header">Revisa tu correo</ThemedText>
        <ThemedText color="textSecondary">
          Enviamos un enlace a <ThemedText variant="bodyStrong">{email}</ThemedText>. Ábrelo para crear tu nueva contraseña; vence en una hora.
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Button label="Abrir mi correo" onPress={openMail} />
        <Button
          label={wait > 0 ? `${resent ? 'Enlace reenviado · ' : ''}Reenviar en ${countdown(wait)}` : 'Reenviar enlace'}
          variant="tertiary"
          disabled={wait > 0}
          onPress={resend}
        />
      </View>
      {error && <ThemedText variant="small" color="error">{error}</ThemedText>}
      <InfoNote>
        <ThemedText variant="small" color="textSecondary">
          ¿No llega? Revisa la carpeta de spam o{' '}
          <ThemedText variant="label" color="primary" accessibilityRole="link" onPress={onChangeEmail}>escribe otro correo</ThemedText>.
        </ThemedText>
      </InfoNote>
      <View style={styles.footer}>
        <TextLink label="Volver a iniciar sesión" onPress={onSignIn} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 8,
    marginTop: 6,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
});
