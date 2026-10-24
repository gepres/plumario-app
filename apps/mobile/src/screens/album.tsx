import { Screen } from '@plumario/ui';

import { ComingSoon } from '@/components/coming-soon';

/** Álbum: las siluetas por hábitat (pendiente). */
export function Album() {
  return (
    <Screen title="Álbum">
      <ComingSoon
        description="Las siluetas por hábitat; al tocar una, se completa con tu foto."
        design={['Album', 'AlbumSilueta', 'AlbumColocar', 'GaleriaEspecie']}
      />
    </Screen>
  );
}
