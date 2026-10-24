import { router } from 'expo-router';

import { Profile } from '@/screens/profile';

// La ruta resuelve la navegación; la pantalla solo avisa qué se tocó.
export default function ProfileRoute() {
  return <Profile onOpenDesignSystem={() => router.push('/design-system')} />;
}
