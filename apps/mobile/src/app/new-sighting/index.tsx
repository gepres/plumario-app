import { router, useLocalSearchParams } from 'expo-router';

import { useAlbum } from '@/hooks/use-album';
import { useCloseFlow } from '@/hooks/use-close-flow';
import { Camera } from '@/screens/new-sighting/camera';

/**
 * Lo abre el botón de la cámara de la barra (foto primero) o un sticker vacío del álbum, que ya
 * trae la especie (speciesId) y si se elige de la cámara o de la galería (source).
 */
export default function NewSightingRoute() {
  const { speciesId, source } = useLocalSearchParams<{ speciesId?: string; source?: 'camera' | 'gallery' }>();
  const close = useCloseFlow();
  const state = useAlbum();
  const species = speciesId && state.status === 'ready' ? state.album.entries.find((e) => e.species.id === speciesId)?.species : undefined;
  return (
    <Camera
      speciesName={species?.commonName}
      startWithGallery={source === 'gallery'}
      onClose={close}
      onFromAlbum={() => {
        close();
        router.navigate('/album');
      }}
      onPhoto={({ uri, takenAt, location }) => {
        // La ubicación viaja con la foto; se guarda o no según la privacidad, al final.
        const params = { photo: uri, takenAt: takenAt.toISOString(), ...(location ? { lat: String(location.latitude), lng: String(location.longitude) } : {}) };
        if (speciesId) router.push({ pathname: '/new-sighting/place', params: { ...params, speciesId } });
        else router.push({ pathname: '/new-sighting/identify', params });
      }}
    />
  );
}
