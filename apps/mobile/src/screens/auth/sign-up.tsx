import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SignUpInput } from '@plumario/core';
import { Button, Checkbox, FormScreen, TextField, TextLink, ThemedText, TopBar } from '@plumario/ui';

import { signUpErrors, type SignUpErrors } from '@/constants/account-messages';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  onBack: () => void;
  onSignIn: () => void;
};

const EMPTY: SignUpInput = { displayName: '', handle: '', email: '', password: '', acceptedTerms: false, ageConfirmed: false };

/** Registro (design/project/Registro.dc.html): nombre, @usuario, correo, contraseña y consentimientos. */
export function SignUp({ onBack, onSignIn }: Props) {
  const { useCases } = useDependencies();
  const [form, setForm] = useState<SignUpInput>(EMPTY);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [busy, setBusy] = useState(false);
  const ready = form.acceptedTerms && form.ageConfirmed;

  function change<K extends keyof SignUpInput>(field: K, value: SignUpInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field in errors) setErrors(({ [field]: _, ...rest }) => rest);
  }

  async function submit() {
    setBusy(true);
    setErrors({});
    try {
      // Con la cuenta creada, la ruta raíz pasa sola a Inicio (Stack.Protected).
      await useCases.signUp(form);
    } catch (e) {
      setErrors(signUpErrors(e));
      setBusy(false);
    }
  }

  return (
    <FormScreen header={<TopBar title="Crea tu cuenta" onBack={onBack} />}>
      <ThemedText variant="small" color="textSecondary" style={styles.intro}>
        Tu álbum se guarda en tu cuenta: no pierdes tus aves si cambias de celular.
      </ThemedText>
      <TextField
        label="Nombre"
        value={form.displayName}
        onChangeText={(text) => change('displayName', text)}
        placeholder="Cómo te llamas"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        help="Así aparece en tus pósteres."
        error={errors.displayName}
      />
      <TextField
        label="Usuario"
        kind="handle"
        value={form.handle}
        onChangeText={(text) => change('handle', text)}
        placeholder="tu_usuario"
        help="Para intercambiar cromos. Lo ven otras personas."
        error={errors.handle}
      />
      <TextField
        label="Correo"
        kind="email"
        value={form.email}
        onChangeText={(text) => change('email', text)}
        placeholder="tucorreo@ejemplo.com"
        error={errors.email}
      />
      <TextField
        label="Contraseña"
        kind="password"
        value={form.password}
        onChangeText={(text) => change('password', text)}
        placeholder="Crea una contraseña"
        autoComplete="new-password"
        textContentType="newPassword"
        help="Mínimo 8 caracteres, con una letra y un número."
        error={errors.password}
      />
      <View>
        <Checkbox label="Acepto los términos y la política de privacidad" checked={form.acceptedTerms} onChange={(on) => change('acceptedTerms', on)} />
        <Checkbox label="Tengo 14 años o más, o permiso de mi madre, padre o tutor" checked={form.ageConfirmed} onChange={(on) => change('ageConfirmed', on)} />
      </View>
      {(errors.form || errors.consent) && <ThemedText variant="small" color="error">{errors.form ?? errors.consent}</ThemedText>}
      <Button label={busy ? 'Creando tu cuenta…' : 'Crear cuenta'} onPress={submit} disabled={!ready} busy={busy} />
      <View style={styles.footer}>
        <ThemedText variant="small" color="textSecondary">¿Ya tienes cuenta?</ThemedText>
        <TextLink label="Inicia sesión" onPress={onSignIn} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginHorizontal: 4,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
});
