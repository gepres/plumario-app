import { StyleSheet, View } from 'react-native';

import { RECYCLE_FEATHERS, type PieceFinish } from '@plumario/core';
import { spacing } from '@plumario/tokens';
import { Button, Sheet, ThemedText } from '@plumario/ui';

import { finishTitle } from '@/constants/cards';
import { feathersLabel, FINISH_WITH_ARTICLE } from '@/constants/economy';

/** Lo que vale mucho y no se recupera se confirma: reciclar un rubí o un diamante. */
export const needsConfirmation = (finish: PieceFinish) => finish === 'ruby' || finish === 'diamond';

type Props = {
  piece: { finish: PieceFinish; speciesName: string } | null;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function RecycleSheet({ piece, busy, onConfirm, onClose }: Props) {
  return (
    <Sheet visible={!!piece} onClose={busy ? () => undefined : onClose} label="Confirmar reciclaje">
      {piece && (
        <View style={styles.root}>
          <ThemedText variant="heading">¿Reciclar {FINISH_WITH_ARTICLE[piece.finish]}?</ThemedText>
          <ThemedText color="textSecondary">
            Es una pieza de {finishTitle(piece.finish).toLowerCase()} de {piece.speciesName}. Te da {feathersLabel(RECYCLE_FEATHERS[piece.finish])} y no se puede deshacer.
          </ThemedText>
          <Button label={`Reciclar · ${feathersLabel(RECYCLE_FEATHERS[piece.finish])}`} busy={busy} onPress={onConfirm} />
          <Button label="Guardarla" variant="tertiary" disabled={busy} onPress={onClose} />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[3],
  },
});
