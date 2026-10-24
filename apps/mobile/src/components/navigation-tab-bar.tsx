import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar, type IconName, type TabBarItem } from '@plumario/ui';

// Adaptador entre el navegador de pestañas de expo-router y la TabBar de @plumario/ui, que no
// sabe de rutas. El botón de la cámara no es una pestaña: abre el registro como modal.
const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Inicio', icon: 'home' },
  album: { label: 'Álbum', icon: 'album' },
  rewards: { label: 'Recompensas', icon: 'rewards' },
  profile: { label: 'Perfil', icon: 'profile' },
};

export function NavigationTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const items: TabBarItem[] = state.routes.flatMap((route, index) => {
    const tab = TABS[route.name];
    if (!tab) return [];
    const active = index === state.index;
    return [
      {
        key: route.key,
        ...tab,
        active,
        onPress: () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigateToTab(route.key);
        },
        onLongPress: () => emitter.emit({ type: 'tabLongPress', target: route.key }),
      },
    ];
  });

  return (
    <TabBar
      items={items}
      cameraLabel="Registrar un ave"
      onCameraPress={() => router.push('/new-sighting')}
      bottomInset={insets.bottom}
    />
  );
}
