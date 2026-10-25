import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { fonts, textStyles, useTheme } from '@plumario/ui';

import { CelebrationHost } from '@/components/celebration-host';
import { useSession } from '@/hooks/use-session';
import { DependenciesProvider } from '@/infrastructure/dependencies';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fonts);
  const { colors, mode } = useTheme();

  // Sin las fuentes, el texto saldría con la del sistema y saltaría al cargarlas.
  if (!loaded && !error) return null;

  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.tabBar,
      text: colors.text,
      border: colors.line,
      notification: colors.error,
    },
  };

  return (
    <DependenciesProvider>
      <ThemeProvider value={navigationTheme}>
        <RootStack />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </DependenciesProvider>
  );
}

/** Con sesión, la app; sin sesión, las pantallas de cuenta. Al entrar o salir cambia sola. */
function RootStack() {
  const { colors } = useTheme();
  const signedIn = useSession() !== null;

  // Se monta cuando ya están las fuentes y las dependencias: recién ahí se quita la pantalla de arranque.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {/* El grupo (auth) no tiene index: sin destino explícito, «/» quedaría sin pantalla. */}
        <Stack.Protected guard={signedIn} redirectTo="/sign-in">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-sighting" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="habitat/[habitat]" />
          <Stack.Screen name="species/[id]" />
          <Stack.Screen name="sticker/[id]" />
          <Stack.Screen name="chrome-categories" />
          <Stack.Screen name="poster/new" />
          <Stack.Screen name="poster/[id]" />
          <Stack.Screen name="poster/habitat/[habitat]" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen
          name="design-system"
          options={{
            headerShown: true,
            title: 'Sistema visual',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontFamily: textStyles.heading.fontFamily },
          }}
        />
      </Stack>
      {/* Las medallas nuevas se celebran sobre cualquier pantalla de la app. */}
      {signedIn && <CelebrationHost />}
    </>
  );
}
