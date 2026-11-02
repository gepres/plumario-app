import { router, useLocalSearchParams } from 'expo-router';

import { ShareCardScreen } from '@/screens/share-card';

export default function ShareStickerRoute() {
  const { id, photo, finish } = useLocalSearchParams<{ id: string; photo?: string; finish?: string }>();
  return <ShareCardScreen subject={{ kind: 'sticker', speciesId: id, finish }} withPhoto={photo === '1'} onBack={() => router.back()} />;
}
