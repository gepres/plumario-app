import { router, useLocalSearchParams } from 'expo-router';

import { PackOpen } from '@/screens/pack-open';

export default function PackRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PackOpen
      packId={id}
      onClose={() => router.back()}
      onOpenSpecies={(speciesId) => router.replace({ pathname: '/sticker/[id]', params: { id: speciesId } })}
    />
  );
}
