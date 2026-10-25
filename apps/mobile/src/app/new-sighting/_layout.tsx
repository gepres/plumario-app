import { Stack } from 'expo-router';

import { useTheme } from '@plumario/ui';

export const unstable_settings = { anchor: 'index' };

/** Registrar un ave (FlujoRegistrar): cámara → la IA sugiere → colocar → resultado. */
export default function NewSightingLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="identify" />
      <Stack.Screen name="place" />
      <Stack.Screen name="queued" options={{ gestureEnabled: false }} />
      <Stack.Screen name="result" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
