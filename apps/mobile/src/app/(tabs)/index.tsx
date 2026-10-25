import { router } from 'expo-router';

import { Home } from '@/screens/home';

export default function HomeRoute() {
  return (
    <Home
      onOpenRegions={() => router.push('/regions')}
      onOpenAlbum={() => router.navigate('/album')}
      // Un valor nuevo cada vez, para que el álbum vuelva a enfocar el buscador aunque ya esté abierto.
      onSearch={() => router.navigate({ pathname: '/album', params: { search: String(Date.now()) } })}
      onOpenPosters={() => router.navigate({ pathname: '/rewards', params: { tab: 'posters' } })}
      onOpenSticker={(id) => router.push({ pathname: '/sticker/[id]', params: { id } })}
      onOpenHabitat={(habitat) => router.push({ pathname: '/habitat/[habitat]', params: { habitat } })}
      onRegister={() => router.push('/new-sighting')}
      onAddPhoto={(speciesId, source) => router.push({ pathname: '/new-sighting', params: { speciesId, source } })}
    />
  );
}
