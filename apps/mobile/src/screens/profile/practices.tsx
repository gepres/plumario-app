import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@plumario/tokens';
import { BirdSticker, Icon, ThemedText, TopBar, textStyles, useTheme, type IconName } from '@plumario/ui';

import { stickerTint } from '@/constants/habitats';

type Props = {
  onBack: () => void;
};

const PRACTICES: readonly { title: string; detail: string; icon: IconName }[] = [
  { title: 'Guarda distancia y usa el zoom', detail: 'Acércate despacio y nunca persigas a un ave para sacar la foto.', icon: 'eye' },
  { title: 'Nidos, colonias y crías, de lejos', detail: 'No entres a colonias ni dormideros. La app no valida fotos de nidos ni pichones.', icon: 'nest' },
  { title: 'Sin flash ni cantos grabados', detail: 'El flash las asusta y los cantos reproducidos las confunden y las cansan.', icon: 'flash' },
  { title: 'No las alimentes ni las toques', detail: 'La comida humana les hace daño y cambia su forma de buscar alimento.', icon: 'noFeed' },
  { title: 'En áreas protegidas, por el sendero', detail: 'En lugares como la Reserva de Paracas sigue las rutas y lo que indiquen los guardaparques.', icon: 'pin' },
  { title: 'No publiques dónde están las amenazadas', detail: 'La app ya oculta su ubicación. Evita contarla también en redes.', icon: 'shieldCheck' },
];

/** PerfilBuenasPracticas: cómo observar sin molestar a las aves. */
export function ProfilePractices({ onBack }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Buenas prácticas" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
        <View style={[styles.lead, { backgroundColor: colors.surface, borderColor: colors.line }]} accessible>
          <View style={styles.tilt}>
            <BirdSticker figure="gull" name="" number="038" tint={stickerTint('coast')} finish="normal" size={56} />
          </View>
          <View style={styles.flex}>
            <ThemedText variant="heading">Ninguna foto vale más que el ave</ThemedText>
            <ThemedText variant="small" color="textSecondary">Si el ave deja de hacer lo que hacía por tu culpa, estás muy cerca.</ThemedText>
          </View>
        </View>

        <View accessibilityRole="list" style={styles.list}>
          {PRACTICES.map((practice) => (
            <View key={practice.title} accessible style={styles.item}>
              <View style={[styles.tile, { backgroundColor: colors.surfaceAlt }]}>
                <Icon name={practice.icon} color={colors.text} size={20} strokeWidth={1.9} />
              </View>
              <View style={styles.flex}>
                <ThemedText variant="bodyStrong">{practice.title}</ThemedText>
                <ThemedText variant="small" color="textSecondary">{practice.detail}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.help, { borderColor: colors.border }]} accessible>
          <Icon name="alert" color={colors.text} size={20} strokeWidth={1.9} />
          <ThemedText variant="small" style={styles.flex}>
            <ThemedText variant="small" style={styles.bold}>¿Un ave herida o atrapada?</ThemedText> No la toques ni la alimentes. Avisa a SERFOR o a la autoridad local y, si puedes, quédate cerca sin acercarte.
          </ThemedText>
        </View>
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
  lead: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tilt: {
    transform: [{ rotate: '-6deg' }],
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  list: {
    gap: spacing[4],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  help: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  bold: {
    fontFamily: textStyles.bodyStrong.fontFamily,
  },
});
