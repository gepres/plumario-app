import { router } from 'expo-router';

import { ProfileTrades } from '@/screens/profile/trades';

export default function ProfileTradesRoute() {
  return <ProfileTrades onBack={() => router.back()} onOpenTrade={(id) => router.push({ pathname: '/trade/[id]', params: { id } })} />;
}
