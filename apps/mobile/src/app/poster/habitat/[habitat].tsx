import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { HABITATS, type Habitat } from '@plumario/core';

import { PosterHabitat } from '@/screens/poster-habitat';

export default function HabitatPosterRoute() {
  const { habitat } = useLocalSearchParams<{ habitat: string }>();
  const known = HABITATS.find((h): h is Habitat => h === habitat);
  if (!known) return <Redirect href={{ pathname: '/rewards', params: { tab: 'posters' } }} />;
  return <PosterHabitat habitat={known} onBack={() => router.back()} />;
}
