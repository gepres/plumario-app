import { router, useLocalSearchParams } from 'expo-router';

import { Regions, type RegionsView } from '@/screens/regions';

export default function RegionsRoute() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  return (
    <Regions
      view={view === 'list' ? 'list' : 'map'}
      onChangeView={(next) => router.setParams({ view: next })}
      onBack={() => router.back()}
      onContinue={() => router.dismissTo('/')}
    />
  );
}

export type { RegionsView };
