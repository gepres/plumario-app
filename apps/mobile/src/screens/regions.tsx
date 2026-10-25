import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_REGION_ID, regionByMapId, REGIONS, searchRegions, type Region } from '@plumario/core';
import { layout, radius, spacing } from '@plumario/tokens';
import { Button, Icon, PeruMap, RegionMap, ThemedText, ToggleGroup, TopBar, textStyles, useTheme } from '@plumario/ui';

import { invalidateProfile } from '@/hooks/profile-version';
import { useAlbum } from '@/hooks/use-album';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

export type RegionsView = 'map' | 'list';

type Props = {
  view: RegionsView;
  onChangeView: (view: RegionsView) => void;
  onBack: () => void;
  /** «Seguir en Ica»: vuelve a Inicio con el álbum de la región. */
  onContinue: () => void;
};

const current = REGIONS.find((r) => r.id === DEFAULT_REGION_ID)!;

/** RegionMapa y RegionLista: cada región es un álbum; hoy solo Ica está disponible. */
export function Regions({ view, onChangeView, onBack, onContinue }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { useCases } = useDependencies();
  const userId = useSession()?.uid;
  const profile = useProfile();
  const state = useAlbum();
  const [selected, setSelected] = useState(current.mapId);
  const [query, setQuery] = useState('');
  // Los avisos se guardan en el perfil; mientras, se ve el cambio enseguida.
  const [alerts, setAlerts] = useState<readonly string[] | null>(null);
  const regionAlerts = alerts ?? profile?.regionAlerts ?? [];

  const album = state.status === 'ready' ? state.album : null;
  const progress = album ? `${album.total} especies · tu álbum, llevas ${album.registered}` : '';

  async function toggleAlert(region: Region) {
    if (!userId) return;
    const before = regionAlerts;
    const next = before.includes(region.id) ? before.filter((id) => id !== region.id) : [...before, region.id];
    setAlerts(next);
    try {
      await useCases.updateProfile(userId, { regionAlerts: next });
      invalidateProfile();
    } catch {
      setAlerts(before);
    }
  }

  const region = regionByMapId(selected) ?? current;
  const upcoming = searchRegions(query).filter((r) => !r.available);
  const showAvailable = searchRegions(query).some((r) => r.available);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TopBar title="Elige tu región" onBack={onBack} />
      <View style={styles.tabs}>
        <ToggleGroup label="Vista" value={view} onChange={onChangeView} options={[{ key: 'map', label: 'Mapa' }, { key: 'list', label: 'Lista' }]} />
      </View>

      {/* Una key por vista: si no, la lista hereda el desplazamiento del mapa. */}
      {view === 'map' ? (
        <ScrollView key="map" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
          <ThemedText color="textSecondary" style={styles.intro}>Cada región es un álbum con sus propias aves, medallas y pósteres. Toca una en el mapa.</ThemedText>
          <View style={styles.map}>
            <RegionMap width={Math.min(width - layout.cardMargin * 2, 363)} selected={selected} isAvailable={(id) => !!regionByMapId(id)?.available} onSelect={setSelected} />
            <View style={styles.legend}>
              <Legend color={colors.primary} label="Disponible" />
              <Legend color={colors.line} label="Próximamente" />
            </View>
          </View>
          <View accessibilityLiveRegion="polite" accessibilityLabel="Región elegida" style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.cardHead}>
              <View style={[styles.emblem, { backgroundColor: colors.surfaceAlt }, !region.available && styles.dim]}>
                <PeruMap height={44} />
              </View>
              <View style={styles.flex}>
                <ThemedText variant="eyebrow" color={region.available ? 'success' : 'warning'}>{region.available ? 'Disponible · tu álbum actual' : 'Próximamente'}</ThemedText>
                <ThemedText variant="heading">{region.name}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  {region.available ? progress : 'Estamos preparando su lista de aves. Tus fotos de aquí se guardan y contarán cuando abra.'}
                </ThemedText>
              </View>
            </View>
            {region.available ? (
              <Button label={`Seguir en ${region.name}`} onPress={onContinue} />
            ) : (
              <Button
                label={regionAlerts.includes(region.id) ? 'Te avisaremos' : 'Avísame cuando esté'}
                icon={regionAlerts.includes(region.id) ? 'check' : 'bell'}
                variant={regionAlerts.includes(region.id) ? 'secondary' : 'primary'}
                onPress={() => void toggleAlert(region)}
              />
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView key="list" keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[6] }]}>
          <View style={[styles.search, { backgroundColor: colors.field, borderColor: colors.border }]}>
            <Icon name="search" color={colors.textSecondary} size={18} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar región"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Buscar región"
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {showAvailable && (
            <View style={styles.section}>
              <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Disponible</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
                accessibilityLabel={`${current.name}, ${progress}`}
                onPress={onContinue}
                style={[styles.available, { backgroundColor: colors.surface, borderColor: colors.text }]}>
                <PeruMap height={56} />
                <View style={styles.flex}>
                  <ThemedText variant="heading">{current.name}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">{progress}</ThemedText>
                </View>
                <View style={[styles.check, { backgroundColor: colors.text }]}>
                  <Icon name="check" color={colors.background} size={14} strokeWidth={3} />
                </View>
              </Pressable>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <ThemedText variant="section" accessibilityRole="header">Próximamente</ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                {REGIONS.length - 1} regiones · {regionAlerts.length === 1 ? '1 aviso activo' : `${regionAlerts.length} avisos activos`}
              </ThemedText>
            </View>
            <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {upcoming.length === 0 && <ThemedText variant="small" color="textSecondary" style={styles.empty}>No hay regiones con «{query.trim()}».</ThemedText>}
              {upcoming.map((r, i) => {
                const on = regionAlerts.includes(r.id);
                return (
                  <View key={r.id} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                    <ThemedText variant="bodyStrong" style={styles.flex}>{r.name}</ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={on ? `Te avisaremos cuando ${r.name} esté disponible. Quitar aviso` : `Avisarme cuando ${r.name} esté disponible`}
                      onPress={() => void toggleAlert(r)}
                      style={[styles.alert, on ? { borderColor: colors.success } : { backgroundColor: colors.surfaceAlt, borderColor: 'transparent' }]}>
                      <Icon name={on ? 'check' : 'bell'} color={on ? colors.success : colors.text} size={16} strokeWidth={2} />
                      <ThemedText variant="captionStrong" color={on ? 'success' : 'text'}>{on ? 'Avisado' : 'Avisarme'}</ThemedText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <ThemedText variant="caption" color="textSecondary">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabs: {
    paddingHorizontal: layout.cardMargin,
    paddingBottom: spacing[2],
    alignItems: 'flex-start',
  },
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  intro: {
    marginHorizontal: 4,
  },
  map: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: spacing[3],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  emblem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    opacity: 0.5,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  sectionHead: {
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  available: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  empty: {
    padding: 14,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  alert: {
    minHeight: 36,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
