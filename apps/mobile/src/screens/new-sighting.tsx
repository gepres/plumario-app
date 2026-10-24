import { Button, Screen } from '@plumario/ui';

import { ComingSoon } from '@/components/coming-soon';

type Props = {
  onClose: () => void;
};

/** Registrar un ave: foto, sugerencia de la IA y colocarla en el álbum (pendiente). */
export function NewSighting({ onClose }: Props) {
  return (
    <Screen title="Registrar ave" withTabBar={false}>
      <ComingSoon
        description="Tomar o elegir la foto, que la IA sugiera la especie y colocarla en el álbum."
        design={['RegistrarCamara', 'RegistrarIdentificar', 'RegistrarColocar', 'RegistrarCompletado']}
      />
      <Button label="Volver" variant="secondary" onPress={onClose} />
    </Screen>
  );
}
