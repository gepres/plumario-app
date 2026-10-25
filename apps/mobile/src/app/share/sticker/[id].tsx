import { router, useLocalSearchParams } from 'expo-router';

import { ShareCardScreen } from '@/screens/share-card';

export default function ShareStickerRoute() {
  const { id, photo } = useLocalSearchParams<{ id: string; photo?: string }>();
  return <ShareCardScreen subject={{ kind: 'sticker', speciesId: id }} withPhoto={photo === '1'} onBack={() => router.back()} />;
}
