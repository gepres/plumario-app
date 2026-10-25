import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@plumario/tokens';

import { useTheme, type ColorToken } from '../theme/use-theme';
import { Icon, type IconName } from './icon';
import { ThemedText } from './themed-text';

// Piezas chicas que repiten las pantallas de cuenta (Login, Registro, Olvidé, NuevaContrasena).

/** Línea – texto – línea («o entra con»). */
export function TextDivider({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.rule, { backgroundColor: colors.line }]} />
      <ThemedText variant="caption" color="textSecondary">{label}</ThemedText>
      <View style={[styles.rule, { backgroundColor: colors.line }]} />
    </View>
  );
}

/** Texto que se toca como un enlace («¿Olvidaste tu contraseña?», «Crear cuenta»). */
export function TextLink({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="link" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} hitSlop={8} style={styles.link}>
      <ThemedText variant="label" color={disabled ? 'textSecondary' : 'primary'}>{label}</ThemedText>
    </Pressable>
  );
}

/** Ícono grande en un cuadro redondeado, arriba de los títulos de Olvidé y NuevaContrasena. */
export function IconTile({ name, background = 'surfaceAlt' }: { name: IconName; background?: ColorToken }) {
  const { colors } = useTheme();
  return (
    <View accessible={false} style={[styles.tile, { backgroundColor: colors[background] }]}>
      <Icon name={name} color={colors.text} size={34} strokeWidth={1.8} />
    </View>
  );
}

/** Aviso en un recuadro con una «i» («¿No llega? Revisa la carpeta de spam…»). */
export function InfoNote({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.note, { backgroundColor: colors.surface }]}>
      <View style={[styles.noteMark, { backgroundColor: colors.surfaceAlt }]}>
        <ThemedText variant="captionStrong">i</ThemedText>
      </View>
      <View style={styles.noteBody}>{children}</View>
    </View>
  );
}

/** Barra de arriba con «Volver» y, si hace falta, el título de la pantalla. */
export function TopBar({ title, subtitle, onBack }: { title?: string; subtitle?: string; onBack?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.topBar}>
      {onBack && (
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
          <Icon name="back" color={colors.text} size={22} strokeWidth={2} />
        </Pressable>
      )}
      {title && (
        <View style={styles.titles}>
          <ThemedText variant="heading" accessibilityRole="header" numberOfLines={1}>{title}</ThemedText>
          {subtitle && <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>{subtitle}</ThemedText>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  rule: {
    flex: 1,
    height: 1,
  },
  link: {
    minHeight: 44,
    justifyContent: 'center',
  },
  tile: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    paddingVertical: spacing[3],
    borderRadius: radius.control,
  },
  noteMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBody: {
    flex: 1,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
  },
  titles: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
