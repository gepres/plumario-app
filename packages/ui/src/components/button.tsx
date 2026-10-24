import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@plumario/tokens';

import { useTheme, type ColorToken } from '../theme/use-theme';
import { Icon, type IconName } from './icon';
import { ThemedText } from './themed-text';

// Variantes de diseno/project/Boton.dc.html: uno primario por pantalla; el secundario para la
// segunda acción; el terciario para opciones en par (Google y Apple); el claro sobre fondos oscuros.
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'light';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
};

const VARIANTS: Record<ButtonVariant, { background?: ColorToken; ink: ColorToken; border?: ColorToken; height: number }> = {
  primary: { background: 'primary', ink: 'onPrimary', height: 52 },
  secondary: { ink: 'primary', border: 'primary', height: 48 },
  tertiary: { ink: 'text', border: 'border', height: 48 },
  light: { background: 'background', ink: 'text', height: 52 },
};

export function Button({ label, onPress, variant = 'primary', icon, disabled = false }: Props) {
  const { colors } = useTheme();
  const v = VARIANTS[variant];
  const ink: ColorToken = disabled ? 'textSecondary' : v.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: v.height,
          backgroundColor: disabled ? colors.surfaceAlt : v.background ? colors[v.background] : 'transparent',
          borderColor: v.border && !disabled ? colors[v.border] : 'transparent',
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.content}>
        {icon && <Icon name={icon} color={colors[ink]} size={20} strokeWidth={2} />}
        <ThemedText variant="button" color={ink}>{label}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.control,
    borderWidth: 1.5,
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pressed: {
    opacity: 0.85,
  },
});
