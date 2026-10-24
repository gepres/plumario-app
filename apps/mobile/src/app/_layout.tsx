import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { fonts, textStyles, useTheme } from '@plumario/ui';

import { DependenciesProvider } from '@/infrastructure/dependencies';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fonts);
  const { colors, mode } = useTheme();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

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
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-sighting" options={{ presentation: 'modal' }} />
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
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </DependenciesProvider>
  );
}
