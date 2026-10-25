import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { isPasswordValid, passwordRules, type PasswordRule } from '@plumario/core';
import { Button, FormScreen, Icon, IconTile, TextField, ThemedText, TopBar, useTheme } from '@plumario/ui';

import { AUTH_ERROR_MESSAGES, authErrorCode } from '@/constants/account-messages';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  /** El código del enlace del correo (oobCode). */
  code: string;
  onBack: () => void;
  onRequestAnother: () => void;
};

const RULE_LABELS: Record<PasswordRule, string> = {
  length: 'Al menos 8 caracteres',
  letter: 'Una letra',
  number: 'Un número',
};

type Link = { status: 'checking' } | { status: 'valid'; email: string } | { status: 'expired' };

/** NuevaContrasena (design/project/NuevaContrasena.dc.html): se abre desde el enlace del correo. */
export function NewPassword({ code, onBack, onRequestAnother }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const [link, setLink] = useState<Link>({ status: 'checking' });
  const [password, setPassword] = useState('');
  const [repeated, setRepeated] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    useCases
      .checkResetCode(code)
      .then((email) => current && setLink({ status: 'valid', email }))
      .catch(() => current && setLink({ status: 'expired' }));
    return () => {
      current = false;
    };
  }, [useCases, code]);

  const matches = password === repeated;
  // El aviso de que no coinciden sale cuando ya escribió tanto como la primera, no a cada letra.
  const mismatch = repeated.length >= password.length && repeated.length > 0 && !matches;
  const ready = isPasswordValid(password) && matches;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // Guarda y entra: la ruta raíz pasa sola a Inicio (Stack.Protected).
      await useCases.resetPassword({ code, password, repeated });
    } catch (e) {
      const errorCode = authErrorCode(e);
      if (errorCode === 'expired-code') setLink({ status: 'expired' });
      else setError(AUTH_ERROR_MESSAGES[errorCode]);
      setBusy(false);
    }
  }

  if (link.status === 'checking') {
    return (
      <FormScreen header={<TopBar onBack={onBack} />}>
        <ActivityIndicator accessibilityLabel="Revisando el enlace" />
      </FormScreen>
    );
  }

  if (link.status === 'expired') {
    return (
      <FormScreen header={<TopBar onBack={onBack} />}>
        <IconTile name="lock" />
        <View style={styles.heading}>
          <ThemedText variant="title" accessibilityRole="header">El enlace ya no sirve</ThemedText>
          <ThemedText color="textSecondary">{AUTH_ERROR_MESSAGES['expired-code']}</ThemedText>
        </View>
        <Button label="Pedir otro enlace" icon="mail" onPress={onRequestAnother} />
      </FormScreen>
    );
  }

  return (
    <FormScreen header={<TopBar onBack={onBack} />}>
      <IconTile name="lock" />
      <View style={styles.heading}>
        <ThemedText variant="title" accessibilityRole="header">Crea una nueva contraseña</ThemedText>
        <ThemedText color="textSecondary">Para la cuenta {link.email}.</ThemedText>
      </View>
      <TextField
        label="Nueva contraseña"
        kind="password"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <View accessibilityLabel="Requisitos" style={styles.rules}>
        {passwordRules(password).map(({ rule, met }) => (
          <View key={rule} style={styles.rule} accessibilityLabel={`${RULE_LABELS[rule]}: ${met ? 'cumple' : 'falta'}`}>
            <Icon name={met ? 'check' : 'dot'} color={met ? colors.success : colors.textSecondary} size={16} strokeWidth={met ? 2.6 : 4} />
            <ThemedText variant="small" color={met ? 'success' : 'textSecondary'}>{RULE_LABELS[rule]}</ThemedText>
          </View>
        ))}
      </View>
      <TextField
        label="Repite la contraseña"
        kind="password"
        value={repeated}
        onChangeText={setRepeated}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => ready && submit()}
        error={mismatch ? 'No coincide con la anterior.' : undefined}
      />
      {error && <ThemedText variant="small" color="error">{error}</ThemedText>}
      <Button label="Guardar y entrar" onPress={submit} disabled={!ready} busy={busy} />
      {!ready && <ThemedText variant="caption" color="textSecondary" style={styles.hint}>Se activa cuando las dos contraseñas coinciden.</ThemedText>}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 8,
    marginTop: 6,
  },
  rules: {
    gap: 6,
    marginTop: -2,
    marginHorizontal: 2,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    marginTop: -4,
    marginHorizontal: 2,
  },
});
