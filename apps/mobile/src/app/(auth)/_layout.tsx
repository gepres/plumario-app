import { Stack } from 'expo-router';

import { useTheme } from '@plumario/ui';

export const unstable_settings = { anchor: 'sign-in' };

/** Pantallas sin sesión: entrar, crear cuenta y recuperar la contraseña. */
export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-sent" />
      <Stack.Screen name="new-password" />
    </Stack>
  );
}
