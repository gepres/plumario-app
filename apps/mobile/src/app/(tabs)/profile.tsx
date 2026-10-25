import { router } from 'expo-router';

import { Profile } from '@/screens/profile';

// La ruta resuelve la navegación; la pantalla solo avisa qué se tocó.
export default function ProfileRoute() {
  return (
    <Profile
      onOpen={(link) => {
        if (link === 'design-system') router.push('/design-system');
        else router.push(`/profile/${link}`);
      }}
      onOpenAlbum={() => router.navigate('/album')}
      onOpenRewards={(tab) => router.navigate({ pathname: '/rewards', params: { tab } })}
    />
  );
}
