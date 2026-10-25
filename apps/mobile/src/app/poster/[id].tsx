import { router, useLocalSearchParams } from 'expo-router';

import { PosterReady } from '@/screens/poster-ready';

export default function PosterRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PosterReady posterId={id} onClose={() => (router.canGoBack() ? router.back() : router.replace({ pathname: '/rewards', params: { tab: 'posters' } }))} />;
}
