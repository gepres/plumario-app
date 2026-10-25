import { router, useLocalSearchParams } from 'expo-router';

import { useCloseFlow } from '@/hooks/use-close-flow';
import { SightingQueued } from '@/screens/new-sighting/queued';

export default function QueuedRoute() {
  const { speciesId } = useLocalSearchParams<{ speciesId: string }>();
  const close = useCloseFlow();
  return <SightingQueued speciesId={speciesId} onClose={close} onRegisterAnother={() => router.dismissTo('/new-sighting')} />;
}
