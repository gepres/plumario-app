import { router, useLocalSearchParams } from 'expo-router';

import { Identify } from '@/screens/new-sighting/identify';

export default function IdentifyRoute() {
  const { photo, takenAt } = useLocalSearchParams<{ photo: string; takenAt: string }>();
  return (
    <Identify
      photoUri={photo}
      takenAt={new Date(takenAt)}
      onBack={() => router.back()}
      onChoose={(speciesId) => router.push({ pathname: '/new-sighting/place', params: { photo, takenAt, speciesId } })}
    />
  );
}
