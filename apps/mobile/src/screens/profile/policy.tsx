import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@plumario/tokens';
import { ThemedText, TopBar, useTheme } from '@plumario/ui';

type Props = {
  onBack: () => void;
};

// Lo que la app hace hoy con los datos, en palabras simples. El texto legal definitivo lo revisa el
// equipo antes de publicar la app.
const SECTIONS: readonly { title: string; body: string }[] = [
  { title: 'Qué guardamos', body: 'Tu nombre, tu @usuario y tu correo; tus fotos de aves con su fecha; tus stickers, cromos, medallas y pósteres; y tus propuestas de intercambio.' },
  { title: 'La ubicación', body: 'Solo si activas «Guardar la ubicación», y solo para asignar la foto a su región. Nadie más la ve. En especies amenazadas no se guarda nunca, ni el lugar que escribas.' },
  { title: 'Quién ve qué', body: 'Tus fotos son solo tuyas. Al intercambiar se ven tu @usuario y los cromos, nunca tus fotos ni dónde las tomaste. En pósteres y tarjetas sale tu nombre o, si lo prefieres, tu @usuario.' },
  { title: 'La IA', body: 'Tus fotos se usan para reconocer la especie. Solo se usan para mejorar el reconocimiento si activas esa opción en Privacidad.' },
  { title: 'Tus derechos', body: 'Puedes descargar tus datos o eliminar tu cuenta desde Privacidad. Al eliminarla se borran tu álbum, tus fotos y tu @usuario.' },
  { title: 'Contacto', body: 'Escríbenos desde Ayuda y comentarios.' },
];

/** Política de privacidad (desde PerfilPrivacidad). */
export function PrivacyPolicy({ onBack }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Política de privacidad" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText variant="section" accessibilityRole="header">{section.title}</ThemedText>
            <ThemedText color="textSecondary">{section.body}</ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.textMargin,
    gap: spacing[4],
  },
  section: {
    gap: 6,
  },
});
