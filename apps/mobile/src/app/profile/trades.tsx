import { router } from 'expo-router';

import { TradePaused } from '@/screens/trade-paused';

export default function ProfileTradesRoute() {
  return <TradePaused onBack={() => router.back()} />;
}
