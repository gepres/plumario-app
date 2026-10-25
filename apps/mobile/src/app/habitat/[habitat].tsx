import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { HABITATS, type Habitat } from '@plumario/core';

import { HabitatPage } from '@/screens/album/habitat-page';

export default function HabitatRoute() {
  const { habitat } = useLocalSearchParams<{ habitat: string }>();
  const known = HABITATS.find((h): h is Habitat => h === habitat);
  if (!known) return <Redirect href="/album" />;
  return (
    <HabitatPage
      habitat={known}
      onBack={() => router.back()}
      onOpenSpecies={(id) => router.push({ pathname: '/species/[id]', params: { id } })}
      onAddPhoto={(speciesId, source) => router.push({ pathname: '/new-sighting', params: { speciesId, source } })}
    />
  );
}
