import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { TradePropose } from '@/screens/trade-propose';

export default function NewTradeRoute() {
  // ?request=especie para pedir su cromo; ?offer=especie para ofrecer el propio.
  const { request, offer } = useLocalSearchParams<{ request?: string; offer?: string }>();
  const speciesId = request ?? offer;
  if (!speciesId) return <Redirect href={{ pathname: '/rewards', params: { tab: 'chromes' } }} />;
  return <TradePropose mode={request ? 'request' : 'offer'} speciesId={speciesId} onBack={() => router.back()} />;
}
