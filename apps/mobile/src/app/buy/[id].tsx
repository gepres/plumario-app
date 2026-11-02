import { router, useLocalSearchParams } from 'expo-router';

import { BuyFinish } from '@/screens/buy-finish';

export default function BuyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BuyFinish speciesId={id} onBack={() => router.back()} />;
}
