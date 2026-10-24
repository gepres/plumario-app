import { Screen } from '@plumario/ui';

import { ComingSoon } from '@/components/coming-soon';

/** Recompensas: medallas, cromos y pósteres (pendiente). */
export function Rewards() {
  return (
    <Screen title="Mis recompensas">
      <ComingSoon
        description="Medallas, cromos y pósteres: lo obtenido y lo que falta para lo siguiente."
        design={['Main', 'RecompensasStickers', 'RecompensasPosteres', 'CatalogoLogros']}
      />
    </Screen>
  );
}
