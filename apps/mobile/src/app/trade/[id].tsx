import { router, useLocalSearchParams } from 'expo-router';

import { TradeReceived } from '@/screens/trade-received';

/** Abre el enlace de una propuesta (plumario://trade/{id}), también desde el QR. */
export default function TradeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <TradeReceived tradeId={id} onClose={close} onOpenSticker={(speciesId) => router.replace({ pathname: '/sticker/[id]', params: { id: speciesId } })} />;
}
