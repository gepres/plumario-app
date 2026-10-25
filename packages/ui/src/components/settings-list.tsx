import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Icon, type IconName } from './icon';
import { ThemedText } from './themed-text';

export type SettingsItem = {
  key: string;
  title: string;
  detail?: string;
  icon?: IconName;
  /** Sin acción, la fila se ve apagada (lo que todavía no está). */
  onPress?: () => void;
  /** Para lo que no se deshace («Eliminar tu cuenta»). */
  danger?: boolean;
};

/** Grupo de ajustes en una tarjeta, separados por líneas (Perfil · Ajustes, PerfilPrivacidad · Tus datos). */
export function SettingsList({ items, label }: { items: readonly SettingsItem[]; label?: string }) {
  const { colors } = useTheme();
  return (
    <View accessibilityLabel={label} style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {items.map((item, i) => {
        const ink = item.danger ? colors.error : colors.text;
        return (
          <Pressable
            key={item.key}
            accessibilityRole={item.onPress ? 'button' : undefined}
            accessibilityState={{ disabled: !item.onPress }}
            disabled={!item.onPress}
            onPress={item.onPress}
            style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }, pressed && styles.pressed, !item.onPress && styles.off]}>
            {item.icon && (
              <View style={[styles.tile, { backgroundColor: colors.surfaceAlt }]}>
                <Icon name={item.icon} color={ink} size={18} strokeWidth={1.9} />
              </View>
            )}
            <View style={styles.text}>
              <ThemedText variant="bodyStrong" style={{ color: ink }}>{item.title}</ThemedText>
              {item.detail && <ThemedText variant="caption" color="textSecondary">{item.detail}</ThemedText>}
            </View>
            {item.onPress && <Icon name="chevronRight" color={colors.textSecondary} size={16} strokeWidth={2} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  off: {
    opacity: 0.55,
  },
});
