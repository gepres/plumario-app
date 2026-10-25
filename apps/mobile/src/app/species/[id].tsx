import { router, useLocalSearchParams } from 'expo-router';

import { SpeciesGallery } from '@/screens/species-gallery';

export default function SpeciesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SpeciesGallery
      speciesId={id}
      onBack={() => router.back()}
      onOpenSticker={(speciesId) => router.push({ pathname: '/sticker/[id]', params: { id: speciesId } })}
      onAddPhoto={(speciesId, source) => router.push({ pathname: '/new-sighting', params: { speciesId, source } })}
    />
  );
}
