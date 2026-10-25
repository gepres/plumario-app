import { router } from 'expo-router';

import { Rewards } from '@/screens/rewards';

export default function RewardsRoute() {
  return (
    <Rewards
      onOpenAlbum={() => router.navigate('/album')}
      onOpenCategories={() => router.push('/chrome-categories')}
      onOpenSticker={(id) => router.push({ pathname: '/sticker/[id]', params: { id } })}
      onOpenSpecies={(id) => router.push({ pathname: '/species/[id]', params: { id } })}
    />
  );
}
