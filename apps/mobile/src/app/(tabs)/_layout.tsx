import { Tabs } from 'expo-router/js-tabs';

import { NavigationTabBar } from '@/components/navigation-tab-bar';

// Pestañas JS (no nativas) porque la barra del diseño es propia: flotante, con muesca y el botón
// de la cámara en medio, que abre un modal en vez de ser una pestaña.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <NavigationTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="album" options={{ title: 'Álbum' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Recompensas' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
