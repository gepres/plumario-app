import { router, useLocalSearchParams } from 'expo-router';

import { ShareCardScreen } from '@/screens/share-card';

export default function ShareMedalRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ShareCardScreen subject={{ kind: 'medal', achievementId: id }} onBack={() => router.back()} />;
}
