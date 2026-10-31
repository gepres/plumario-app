import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HABITATS, type AlbumEntry } from '@plumario/core';
import { cardFinishes, layout, palette, radius, spacing, typography, type CardFinish, type Gradient, type TypeVariant } from '@plumario/tokens';
import { Button, Card, Chip, GradientView, ListRow, ProgressBar, ThemedText, useTheme, type ColorToken, type StickerFinish } from '@plumario/ui';

import { HomeSkeleton, SuggestionsSkeleton } from '@/components/screen-skeletons';
import { SpeciesCard, SpeciesCardBack } from '@/components/species-card';
import { HABITAT_LABELS } from '@/constants/habitats';
import { useDependencies, type Dependencies } from '@/infrastructure/dependencies';

const DATA_SOURCE_LABELS: Record<Dependencies['environment']['dataSource'], string> = {
  memory: 'muestra en memoria (11 especies del diseño)',
  emulator: 'Firestore del emulador local',
  firebase: 'Firestore del proyecto real',
};

const SWATCHES: [string, ColorToken][] = [
  ['Fondo', 'background'], ['Superficie', 'surface'], ['Superficie 2', 'surfaceAlt'], ['Texto', 'text'],
  ['Texto 2', 'textSecondary'], ['Línea', 'line'], ['Primario', 'primary'], ['Acento', 'accent'],
  ['Sol', 'sun'], ['Éxito', 'success'], ['Aviso', 'warning'], ['Error', 'error'],
];

const TYPE_SAMPLES: Record<TypeVariant, string> = {
  sheet: 'Categorías',
  reveal: 'Playero Arenero',
  title: 'Mis recompensas',
  heading: 'Elige tu región',
  section: 'Tus últimas aves',
  button: 'Guardar póster',
  body: 'Cada especie tiene una categoría.',
  bodyStrong: 'Póster 2: te faltan 8',
  label: 'Contraseña',
  small: '¿No tienes cuenta?',
  caption: 'Así aparece en tus pósteres.',
  captionStrong: 'No coincide con la anterior.',
  eyebrow: 'Medalla desbloqueada',
  scientific: 'Calidris alba',
};

// Los cónicos (holográfico, diamante) se pintarán con Skia; aquí van aproximados en lineal.
function asGradient(finish: CardFinish): Gradient {
  if (finish.type === 'linear') return finish;
  const last = finish.colors.length - 1;
  return { type: 'linear', angle: finish.from, stops: finish.colors.map((color, i) => ({ color, position: i / last })), css: finish.css };
}

// El Pelícano Peruano lleva dos sellos: sirve para ver la carta más cargada en los seis acabados.
const SAMPLE_CARD: AlbumEntry = {
  species: {
    id: 'pelecanus-thagus', regionId: 'ica', taxonClass: 'bird', albumNumber: 230, commonName: 'Pelícano Peruano', scientificName: 'Pelecanus thagus',
    habitat: 'coast', family: 'Pelecanidae', iucn: 'NT', nationalCategory: 'EN', threatened: true, endemic: false, emblematic: true, figure: 'pelican',
  },
  sticker: { speciesId: 'pelecanus-thagus', completedAt: new Date(2026, 9, 12), validPhotos: 5, chrome: null },
  category: 'diamond',
};
const SAMPLE_FINISHES: readonly StickerFinish[] = ['normal', 'holographic', 'silver', 'gold', 'ruby', 'diamond'];

/** Catálogo vivo de tokens y componentes: para revisar la paleta F en claro y oscuro en el teléfono. */
export function DesignSystem() {
  const { colors, mode } = useTheme();
  const { environment } = useDependencies();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
      <View style={styles.block}>
        <ThemedText variant="eyebrow" color="primary">Opción {palette.option} · {palette.name}</ThemedText>
        <ThemedText variant="heading">Modo {mode === 'dark' ? 'oscuro' : 'claro'}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{palette.motto}. Cambia el tema del teléfono para ver el otro modo.</ThemedText>
      </View>

      <View style={styles.grid}>
        {SWATCHES.map(([name, key]) => (
          <View key={key} style={styles.swatch}>
            <View style={[styles.color, { backgroundColor: colors[key], borderColor: colors.line }]} />
            <ThemedText variant="bodyStrong">{name}</ThemedText>
            <ThemedText variant="caption" color="textSecondary">{colors[key]}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.block}>
        <ThemedText variant="section">Hábitats</ThemedText>
        <View style={styles.row}>
          {HABITATS.map((habitat) => (
            <View key={habitat} style={styles.cell}>
              <View style={[styles.strip, { backgroundColor: colors.habitats[habitat] }]} />
              <ThemedText variant="caption" color="textSecondary">{HABITAT_LABELS[habitat]}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <ThemedText variant="section">Degradados y cromos</ThemedText>
        <View style={styles.row}>
          {(['hero', 'reveal', 'fab'] as const).map((key) => (
            <View key={key} style={styles.cell}>
              <GradientView gradient={colors[key]} style={styles.plate} />
              <ThemedText variant="caption" color="textSecondary">{key}</ThemedText>
            </View>
          ))}
          {Object.entries(cardFinishes).map(([key, finish]) => (
            <View key={key} style={styles.cell}>
              <GradientView gradient={asGradient(finish)} style={styles.plate} />
              <ThemedText variant="caption" color="textSecondary">{key}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <ThemedText variant="section">Cartas</ThemedText>
        <ThemedText variant="caption" color="textSecondary">Del cromado al diamante brillan solas y al tocarlas. La normal no brilla.</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          {SAMPLE_FINISHES.map((finish) => (
            <SpeciesCard key={finish} entry={SAMPLE_CARD} total={294} size={250} finish={finish} />
          ))}
          <SpeciesCardBack entry={SAMPLE_CARD} size={250} finish="gold" />
        </ScrollView>
      </View>

      <View style={styles.block}>
        <ThemedText variant="section">Componentes</ThemedText>
        <Button label="Primario" onPress={() => {}} icon="camera" />
        <Button label="Secundario" variant="secondary" onPress={() => {}} />
        <View style={styles.pair}>
          <View style={styles.half}><Button label="Google" variant="tertiary" onPress={() => {}} /></View>
          <View style={styles.half}><Button label="Apple" variant="tertiary" onPress={() => {}} /></View>
        </View>
        <Button label="Deshabilitado" disabled onPress={() => {}} />
        <Card>
          <ProgressBar label="Litoral" current={8} total={43} />
          <View style={styles.chips}>
            <Chip label="Nuevo" color="primary" />
            <Chip label="Amenazada" color="error" />
            <Chip label="3 medallas" />
          </View>
        </Card>
        <ListRow title="Privacidad" detail="Tus fotos sin ubicación pública" onPress={() => {}} />
      </View>

      <View style={styles.block}>
        <ThemedText variant="section">Esqueletos de carga</ThemedText>
        <ThemedText variant="caption" color="textSecondary">Mientras llegan los datos: Inicio y las sugerencias de la IA.</ThemedText>
        <SuggestionsSkeleton />
        <HomeSkeleton />
      </View>

      <View style={styles.block}>
        <ThemedText variant="section">Letra</ThemedText>
        {(Object.keys(typography) as TypeVariant[]).map((variant) => (
          <View key={variant} style={[styles.specimen, { borderColor: colors.line }]}>
            <ThemedText variant={variant}>{TYPE_SAMPLES[variant]}</ThemedText>
            <ThemedText variant="caption" color="textSecondary">{variant} · {typography[variant].size}</ThemedText>
          </View>
        ))}
      </View>

      <Card>
        <ThemedText variant="bodyStrong">Firebase</ThemedText>
        <ThemedText color={environment.firebaseConfigured ? 'success' : 'warning'}>
          {environment.firebaseConfigured
            ? 'Esta build lleva la configuración del proyecto.'
            : 'Sin configurar: faltan los archivos del proyecto (ver docs/environment.md).'}
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary">Datos: {DATA_SOURCE_LABELS[environment.dataSource]}</ThemedText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  content: {
    padding: layout.cardMargin,
    gap: spacing[6],
  },
  block: {
    gap: spacing[2],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing[4],
    columnGap: spacing[3],
  },
  swatch: {
    width: '30%',
    flexGrow: 1,
    gap: 2,
  },
  color: {
    height: 48,
    borderRadius: radius.control,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  cell: {
    flexGrow: 1,
    minWidth: 56,
    gap: 4,
  },
  strip: {
    height: 14,
    borderRadius: 4,
  },
  plate: {
    height: 56,
    borderRadius: radius.control,
  },
  pair: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  half: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  specimen: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing[2],
  },
});
