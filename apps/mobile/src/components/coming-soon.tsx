import { Card, ThemedText } from '@plumario/ui';

type Props = {
  /** Qué hará la pantalla cuando se construya. */
  description: string;
  /** Los artboards de diseno/project/ que la definen. */
  design: string[];
};

/** Aviso de pantalla aún sin construir, con los artboards del diseño que la definen. */
export function ComingSoon({ description, design }: Props) {
  return (
    <Card>
      <ThemedText variant="bodyStrong">Pantalla pendiente</ThemedText>
      <ThemedText color="textSecondary">{description}</ThemedText>
      <ThemedText variant="caption" color="textSecondary">Diseño: {design.join(' · ')}</ThemedText>
    </Card>
  );
}
