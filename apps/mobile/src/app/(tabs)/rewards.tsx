import { router, useLocalSearchParams } from 'expo-router';

import { Rewards, type RewardsTab } from '@/screens/rewards';

const TABS: readonly RewardsTab[] = ['medals', 'chromes', 'posters'];

export default function RewardsRoute() {
  // La pestaña va en la ruta, para llegar directo a «Pósteres» desde otras pantallas.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return (
    <Rewards
      tab={TABS.find((t) => t === tab) ?? 'medals'}
      onChangeTab={(next) => router.setParams({ tab: next })}
      onOpenAlbum={() => router.navigate('/album')}
      onOpenCategories={() => router.push('/chrome-categories')}
      onOpenSticker={(id) => router.push({ pathname: '/sticker/[id]', params: { id } })}
      onOpenSpecies={(id) => router.push({ pathname: '/species/[id]', params: { id } })}
      onOpenPoster={(id) => router.push({ pathname: '/poster/[id]', params: { id } })}
      onGeneratePoster={(number) => router.push({ pathname: '/poster/new', params: { number: String(number) } })}
      onOpenHabitatPoster={(habitat) => router.push({ pathname: '/poster/habitat/[habitat]', params: { habitat } })}
      onRequestTrade={(id) => router.push({ pathname: '/trade/new', params: { request: id } })}
      onShareMedal={(id) => router.push({ pathname: '/share/medal/[id]', params: { id } })}
    />
  );
}
