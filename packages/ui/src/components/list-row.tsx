import { Pressable, StyleSheet, View } from 'react-native';

import { layout, radius, spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

type Props = {
  title: string;
  detail?: string;
  onPress?: () => void;
};

/** Fila de lista del diseño: alto mínimo 52, título en negrita, detalle en texto 2 y una acción. */
export function ListRow({ title, detail, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.line }, pressed && styles.pressed]}>
      <View style={styles.text}>
        <ThemedText variant="bodyStrong">{title}</ThemedText>
        {detail && <ThemedText variant="caption" color="textSecondary">{detail}</ThemedText>}
      </View>
      {onPress && <Icon name="chevronRight" color={colors.textSecondary} size={18} strokeWidth={2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.listRow,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  text: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
