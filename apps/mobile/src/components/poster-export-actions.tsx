import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText, useTheme, type IconName } from '@plumario/ui';

import { usePosterExport } from '@/components/poster-content';
import { capturePosterPng, createPosterPdf, POSTER_EXPORT_HEIGHT, POSTER_EXPORT_WIDTH, savePosterToPhotos, sharePoster } from '@/utils/export-poster';

type Props = {
  /** El póster tal como se exporta (el mismo que se ve). */
  poster: ReactNode;
  /** Para el nombre del PDF y el pie de imprenta («Póster 1 · Mis aves de Ica»). */
  caption: string;
  /** Mientras no se pueda descargar (póster de hábitat sin completar), los botones se ven apagados. */
  disabled?: boolean;
};

type Busy = 'pdf' | 'png' | 'share' | null;

/** PosterListo: PDF A3 para imprimir, PNG en alta para las fotos y compartir. */
export function PosterExportActions({ poster, caption, disabled = false }: Props) {
  const { colors } = useTheme();
  const { element, run } = usePosterExport(poster);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function act(kind: Exclude<Busy, null>) {
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === 'pdf') {
        const uri = await run((view) => createPosterPdf(view, caption));
        await sharePoster(uri, 'application/pdf', caption);
      } else {
        const uri = await run((view) => capturePosterPng(view, caption));
        if (kind === 'share') await sharePoster(uri, 'image/png', caption);
        else setMessage((await savePosterToPhotos(uri)) ? { text: 'Guardado en tus fotos.' } : { text: 'Para guardarlo, permite que Plumario acceda a tus fotos.', error: true });
      }
    } catch {
      setMessage({ text: 'No se pudo exportar el póster. Vuelve a intentar.', error: true });
    } finally {
      setBusy(null);
    }
  }

  const option = (kind: 'pdf' | 'png', icon: IconName, title: string, detail: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || !!busy, busy: busy === kind }}
      disabled={disabled || !!busy}
      onPress={() => void act(kind)}
      style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.line }, disabled && styles.off]}>
      <Icon name={icon} color={colors.text} size={22} strokeWidth={1.9} />
      <View style={styles.flex}>
        <ThemedText variant="bodyStrong">{title}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{detail}</ThemedText>
      </View>
      {busy === kind ? <ActivityIndicator color={colors.primary} /> : <Icon name="chevronRight" color={colors.textSecondary} size={16} strokeWidth={2.2} />}
    </Pressable>
  );

  return (
    <View style={styles.root}>
      {option('pdf', 'file', 'PDF A3 para imprimir', 'Con 3 mm de sangrado y marcas de corte')}
      {option('png', 'image', 'Imagen PNG', `Alta resolución, ${POSTER_EXPORT_WIDTH} × ${POSTER_EXPORT_HEIGHT} px`)}
      {message && (
        <ThemedText variant="small" color={message.error ? 'error' : 'success'} accessibilityLiveRegion="polite">
          {message.text}
        </ThemedText>
      )}
      <Button label="Compartir" icon="share" onPress={() => void act('share')} disabled={disabled || !!busy} busy={busy === 'share'} />
      {element}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[2],
  },
  option: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingVertical: spacing[2],
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  off: {
    opacity: 0.5,
  },
  flex: {
    flex: 1,
    gap: 1,
  },
});
