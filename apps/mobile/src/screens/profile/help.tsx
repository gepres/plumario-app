import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FeedbackKind } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Icon, ThemedText, TopBar, textStyles, useTheme } from '@plumario/ui';

type Props = {
  onBack: () => void;
  onWrite: (kind: FeedbackKind) => void;
};

const FAQS: readonly { question: string; answer: string }[] = [
  { question: '¿Por qué mi sticker no salió cromado?', answer: 'El cromo sale al azar: 1 de cada 8 al completar un sticker. También lo consigues con 5 fotos validadas de la misma especie o por intercambio.' },
  { question: 'Tomé otra foto de la misma ave. ¿Cuenta?', answer: 'Se cuentan especies, no fotos. Las fotos extra van a la galería de esa especie y suman para su cromo por fotos.' },
  { question: 'La app no reconoce mi foto', answer: 'Prueba con una foto donde el ave se vea entera y nítida. Si sabes qué especie es, puedes elegirla de la lista.' },
  { question: '¿Cuándo se habilita el póster de un hábitat?', answer: 'Al completar todas sus especies. Mientras, lo ves con las que faltan en sombra. Cada 10 especies también ganas un póster con tus aves.' },
  { question: '¿Cómo intercambio un cromo?', answer: 'Desde el detalle de un sticker: «Pedir su cromo» u «Ofrecer en intercambio». Se manda por enlace o con un código QR, uno por uno y con un cromo de igual o mayor categoría.' },
  { question: '¿Alguien ve dónde tomé mis fotos?', answer: 'No. La ubicación solo asigna la foto a su región, y en especies amenazadas se oculta siempre.' },
];

// Para buscar sin importar tildes ni mayúsculas.
const plain = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** PerfilAyuda: preguntas frecuentes con buscador y, si no alcanza, un comentario. */
export function ProfileHelp({ onBack, onWrite }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(0);
  const found = FAQS.filter((faq) => !query.trim() || plain(`${faq.question} ${faq.answer}`).includes(plain(query.trim())));

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Ayuda y comentarios" onBack={onBack} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
        <View style={[styles.search, { backgroundColor: colors.field, borderColor: colors.border }]}>
          <Icon name="search" color={colors.textSecondary} size={18} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar en la ayuda"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Buscar en la ayuda"
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <View style={styles.section}>
          <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Preguntas frecuentes</ThemedText>
          <View style={[styles.faqs, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {found.length === 0 && <ThemedText variant="small" color="textSecondary" style={styles.empty}>No encontramos «{query.trim()}». Escríbenos abajo.</ThemedText>}
            {found.map((faq, i) => {
              const expanded = open === FAQS.indexOf(faq) || (!!query.trim() && found.length === 1);
              return (
                <View key={faq.question} style={i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    onPress={() => setOpen(expanded ? -1 : FAQS.indexOf(faq))}
                    style={styles.question}>
                    <ThemedText variant="bodyStrong" style={styles.flex}>{faq.question}</ThemedText>
                    <View style={expanded && styles.flip}>
                      <Icon name="chevronDown" color={colors.textSecondary} size={18} strokeWidth={2} />
                    </View>
                  </Pressable>
                  {expanded && <ThemedText variant="small" color="textSecondary" style={styles.answer}>{faq.answer}</ThemedText>}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>¿No encontraste tu respuesta?</ThemedText>
          <View style={styles.contact}>
            <View style={styles.flex}>
              <Button label="Comentario" icon="mail" variant="secondary" onPress={() => onWrite('idea')} />
            </View>
            <View style={styles.flex}>
              <Button label="Un error" icon="alert" variant="secondary" onPress={() => onWrite('error')} />
            </View>
          </View>
        </View>

        <ThemedText variant="caption" color="textSecondary" style={styles.version}>Plumario {Constants.expoConfig?.version ?? ''} · Edición Ica</ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[4],
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    ...textStyles.body,
    flex: 1,
    paddingVertical: 0,
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    marginHorizontal: 4,
  },
  faqs: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  empty: {
    padding: 14,
  },
  question: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  flip: {
    transform: [{ rotate: '180deg' }],
  },
  answer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  flex: {
    flex: 1,
  },
  contact: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  version: {
    textAlign: 'center',
  },
});
