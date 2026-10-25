import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing } from '@plumario/tokens';

import { textStyles } from '../theme/fonts';
import { useTheme } from '../theme/use-theme';
import { Icon } from './icon';
import { ThemedText } from './themed-text';

// Campo de formulario de design/project/Campo.dc.html: la etiqueta siempre visible arriba, la ayuda
// abajo, y el error en lugar de la ayuda con ícono y borde de 2 px. «handle» antepone la @ del
// usuario; «password» suma el botón para mostrar u ocultar lo escrito.
export type TextFieldKind = 'text' | 'email' | 'password' | 'handle';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry' | 'placeholderTextColor'> & {
  label: string;
  kind?: TextFieldKind;
  help?: string;
  error?: string;
};

const KIND_DEFAULTS: Record<TextFieldKind, TextInputProps> = {
  text: { autoCapitalize: 'sentences' },
  email: { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email', textContentType: 'emailAddress' },
  password: { autoCapitalize: 'none', autoCorrect: false, autoComplete: 'current-password', textContentType: 'password' },
  handle: { autoCapitalize: 'none', autoCorrect: false, autoComplete: 'username-new', textContentType: 'username' },
};

export function TextField({ label, kind = 'text', help, error, onFocus, onBlur, ...input }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = kind === 'password';
  const note = error || help;

  // El borde pasa de 1 a 2 px con el foco o el error; el relleno compensa para que el texto no salte.
  const borderWidth = error || focused ? 2 : 1;
  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={styles.field}>
      <ThemedText variant="label">{label}</ThemedText>
      <View
        style={[
          styles.box,
          { borderWidth, borderColor, backgroundColor: colors.field, paddingLeft: 15 - borderWidth, paddingRight: (isPassword ? 7 : 15) - borderWidth },
        ]}>
        {kind === 'handle' && <ThemedText variant="bodyStrong" color="textSecondary">@</ThemedText>}
        <TextInput
          {...KIND_DEFAULTS[kind]}
          {...input}
          accessibilityLabel={label}
          accessibilityHint={note}
          aria-invalid={!!error}
          secureTextEntry={isPassword && !revealed}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }]}
        />
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setRevealed(!revealed)}
            style={styles.eye}>
            <Icon name={revealed ? 'eyeOff' : 'eye'} color={colors.textSecondary} size={20} />
          </Pressable>
        )}
      </View>
      {note && (
        <View style={styles.note}>
          {error && <Icon name="alert" color={colors.error} size={15} strokeWidth={2.2} />}
          <ThemedText variant={error ? 'captionStrong' : 'caption'} color={error ? 'error' : 'textSecondary'} style={styles.noteText}>
            {note}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  box: {
    minHeight: 52,
    borderRadius: radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  input: {
    ...textStyles.body,
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 0,
  },
  eye: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteText: {
    flex: 1,
  },
});
