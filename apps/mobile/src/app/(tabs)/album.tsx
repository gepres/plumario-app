import { router, useLocalSearchParams } from 'expo-router';

import { Album } from '@/screens/album';

export default function AlbumRoute() {
  const { search } = useLocalSearchParams<{ search?: string }>();
  return (
    <Album
      focusSearch={search}
      onOpenHabitat={(habitat) => router.push({ pathname: '/habitat/[habitat]', params: { habitat } })}
      onOpenSpecies={(id) => router.push({ pathname: '/species/[id]', params: { id } })}
      onAddPhoto={(speciesId, source) => router.push({ pathname: '/new-sighting', params: { speciesId, source } })}
    />
  );
}
