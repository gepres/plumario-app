import { router, useLocalSearchParams } from 'expo-router';

import { Identify } from '@/screens/new-sighting/identify';

export default function IdentifyRoute() {
  const { photo, takenAt, lat, lng } = useLocalSearchParams<{ photo: string; takenAt: string; lat?: string; lng?: string }>();
  return (
    <Identify
      photoUri={photo}
      takenAt={new Date(takenAt)}
      onBack={() => router.back()}
      onChoose={(speciesId) => router.push({ pathname: '/new-sighting/place', params: { photo, takenAt, speciesId, ...(lat && lng ? { lat, lng } : {}) } })}
    />
  );
}
