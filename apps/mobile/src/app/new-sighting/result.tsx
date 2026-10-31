import { router, useLocalSearchParams } from 'expo-router';

import { useCloseFlow } from '@/hooks/use-close-flow';
import { SightingResultScreen } from '@/screens/new-sighting/result';

export default function ResultRoute() {
  const { sightingId, speciesId } = useLocalSearchParams<{ sightingId: string; speciesId: string }>();
  const close = useCloseFlow();
  return (
    <SightingResultScreen
      sightingId={sightingId}
      speciesId={speciesId}
      onClose={close}
      onOpenSpecies={(id) => {
        close();
        router.push({ pathname: '/species/[id]', params: { id } });
      }}
      onRegisterAnother={() => router.dismissTo('/new-sighting')}
      onRetry={(id) => router.dismissTo({ pathname: '/new-sighting', params: { speciesId: id } })}
    />
  );
}
