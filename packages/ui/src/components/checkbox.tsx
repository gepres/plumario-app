import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Casilla con su texto, que se marca tocando cualquiera de los dos (consentimientos de Registro). */
export function Checkbox({ label, checked, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={styles.row}>
      <View
        style={[
          styles.box,
          { borderColor: checked ? colors.primary : colors.border, backgroundColor: checked ? colors.primary : colors.field },
        ]}>
        {checked && <Icon name="check" color={colors.onPrimary} size={15} strokeWidth={3} />}
      </View>
      <ThemedText variant="small" color="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
