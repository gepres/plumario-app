import { router, useLocalSearchParams } from 'expo-router';

import { StickerDetail } from '@/screens/sticker-detail';

export default function StickerRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  return (
    <StickerDetail
      speciesId={id}
      onBack={() => router.back()}
      // Si se llegó desde la galería, se vuelve a ella en vez de apilar otra igual.
      onOpenGallery={(speciesId) => (from === 'gallery' ? router.back() : router.push({ pathname: '/species/[id]', params: { id: speciesId } }))}
      onShare={(speciesId, withPhoto) => router.push({ pathname: '/share/sticker/[id]', params: { id: speciesId, photo: withPhoto ? '1' : '0' } })}
    />
  );
}
