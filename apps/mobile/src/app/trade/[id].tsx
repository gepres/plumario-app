import { router } from 'expo-router';

import { TradePaused } from '@/screens/trade-paused';

/** Los enlaces de propuestas antiguas (plumario://trade/{id}) llegan a la pausa. */
export default function TradeRoute() {
  return <TradePaused onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
