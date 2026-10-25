import { router, useLocalSearchParams } from 'expo-router';

import { Place } from '@/screens/new-sighting/place';

export default function PlaceRoute() {
  const { photo, takenAt, speciesId } = useLocalSearchParams<{ photo: string; takenAt: string; speciesId: string }>();
  return (
    <Place
      photoUri={photo}
      takenAt={new Date(takenAt)}
      speciesId={speciesId}
      onBack={() => router.back()}
      // Otra foto para la misma especie: vuelve a la cámara, que ya sabe cuál es.
      onChangePhoto={() => router.dismissTo({ pathname: '/new-sighting', params: { speciesId } })}
      onSaved={(sightingId) => router.replace({ pathname: '/new-sighting/result', params: { sightingId, speciesId } })}
    />
  );
}
