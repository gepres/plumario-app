import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FEEDBACK_MAX, type FeedbackKind } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Checkbox, FilterChips, Icon, ThemedText, TopBar, textStyles, useTheme } from '@plumario/ui';

import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

type Props = {
  kind?: FeedbackKind;
  onBack: () => void;
};

const KINDS: readonly { key: FeedbackKind; label: string; placeholder: string }[] = [
  { key: 'idea', label: 'Una idea', placeholder: 'Cuéntanos tu idea para el álbum…' },
  { key: 'error', label: 'Un error', placeholder: 'Qué pasó y qué estabas haciendo…' },
  { key: 'bird', label: 'Ave mal identificada', placeholder: 'Qué especie salió y cuál crees que es…' },
  { key: 'other', label: 'Otro', placeholder: 'Escribe tu comentario…' },
];

/** PerfilComentario: una idea, un error o un ave mal identificada, con captura y permiso para responder. */
export function ProfileFeedback({ kind: initial = 'idea', onBack }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSession();
  const [kind, setKind] = useState<FeedbackKind>(initial);
  const [text, setText] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [replyOk, setReplyOk] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // «Adjuntar una captura de pantalla»: se elige de la galería al marcarla.
  async function toggleScreenshot(checked: boolean) {
    if (!checked) return setScreenshot(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setScreenshot(result.assets[0].uri);
  }

  async function send() {
    if (!user) return;
    setSending(true);
    setError(null);
    try {
      const screenshotPath = screenshot ? await useCases.uploadScreenshot(user.uid, screenshot) : null;
      await useCases.sendFeedback({
        userId: user.uid,
        kind,
        text,
        replyTo: replyOk ? user.email : null,
        screenshotPath,
        appVersion: Constants.expoConfig?.version ?? 'dev',
        platform: Platform.OS,
      });
      setSent(true);
    } catch {
      setError('No se pudo enviar. Revisa tu conexión y vuelve a intentar.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TopBar title="Enviar un comentario" onBack={onBack} />
        <View style={styles.thanks} accessibilityRole="summary" accessibilityLiveRegion="polite">
          <View style={[styles.check, { backgroundColor: colors.success }]}>
            <Icon name="check" color={colors.background} size={32} strokeWidth={2.6} />
          </View>
          <ThemedText variant="title" style={styles.center}>¡Gracias!</ThemedText>
          <ThemedText color="textSecondary" style={styles.center}>
            Recibimos tu comentario.{replyOk ? ' Te responderemos a tu correo.' : ''}
          </ThemedText>
          <Button label="Volver a ayuda" variant="secondary" onPress={onBack} />
        </View>
      </View>
    );
  }

  const current = KINDS.find((k) => k.key === kind)!;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Enviar un comentario" onBack={onBack} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <ThemedText color="textSecondary">Leemos todo. Si es un error, cuéntanos qué estabas haciendo cuando pasó.</ThemedText>
        <View style={styles.section}>
          <ThemedText variant="eyebrow" color="textSecondary">Sobre qué es</ThemedText>
          <FilterChips label="Sobre qué es" value={kind} onChange={setKind} options={KINDS} />
        </View>
        <View style={styles.section}>
          <ThemedText variant="bodyStrong">Tu comentario</ThemedText>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={current.placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={FEEDBACK_MAX}
            accessibilityLabel="Tu comentario"
            textAlignVertical="top"
            style={[styles.textarea, { color: colors.text, backgroundColor: colors.field, borderColor: colors.border }]}
          />
          <ThemedText variant="caption" color="textSecondary">{text.length} de {FEEDBACK_MAX} caracteres</ThemedText>
        </View>
        <Checkbox label="Adjuntar una captura de pantalla" checked={!!screenshot} onChange={(checked) => void toggleScreenshot(checked)} />
        {screenshot && <Image source={{ uri: screenshot }} style={[styles.preview, { borderColor: colors.line }]} contentFit="cover" accessibilityLabel="Captura adjunta" />}
        <Checkbox label="Pueden responderme a mi correo" checked={replyOk} onChange={setReplyOk} />
        {error && <ThemedText variant="small" color="error">{error}</ThemedText>}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Button label="Enviar" icon="mail" onPress={() => void send()} busy={sending} disabled={!text.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    paddingBottom: spacing[4],
    gap: spacing[4],
  },
  section: {
    gap: spacing[2],
  },
  textarea: {
    ...textStyles.body,
    minHeight: 140,
    borderWidth: 1,
    borderRadius: radius.control,
    padding: 14,
  },
  preview: {
    width: 96,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    paddingHorizontal: layout.cardMargin,
    paddingTop: spacing[2],
  },
  thanks: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  check: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
