import { ListRow, Screen } from '@plumario/ui';

import { ComingSoon } from '@/components/coming-soon';

type Props = {
  onOpenDesignSystem: () => void;
};

/** Perfil: región, números y ajustes (pendiente), con acceso al catálogo del sistema visual. */
export function Profile({ onOpenDesignSystem }: Props) {
  return (
    <Screen title="Perfil">
      <ComingSoon
        description="Tu región, tus números y los ajustes: notificaciones, privacidad, intercambios y ayuda."
        design={['Perfil', 'PerfilEditar', 'PerfilPrivacidad', 'PerfilAyuda']}
      />
      <ListRow title="Ver el sistema visual" detail="Paleta F, letra, cromos y componentes, como los usa la app" onPress={onOpenDesignSystem} />
    </Screen>
  );
}
