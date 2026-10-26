import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { rewardsView } from '@plumario/core';
import { layout, spacing } from '@plumario/tokens';
import { BirdAvatar, Button, Icon, PeruMap, SettingsList, StatusBarScrim, ThemedText, useTheme } from '@plumario/ui';

import { APPEARANCE_LABELS } from '@/constants/appearance';
import { stickerTint } from '@/constants/habitats';
import { useAchievements } from '@/hooks/use-achievements';
import { useAlbum } from '@/hooks/use-album';
import { useAppearance } from '@/hooks/use-appearance';
import { usePosters } from '@/hooks/use-posters';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useDependencies } from '@/infrastructure/dependencies';

export type ProfileLink = 'edit' | 'appearance' | 'privacy' | 'trades' | 'practices' | 'help' | 'regions' | 'design-system';

type Props = {
  onOpen: (link: ProfileLink) => void;
  onOpenAlbum: () => void;
  onOpenRewards: (tab: 'medals' | 'chromes' | 'posters') => void;
};

const monthYear = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' });

/** Perfil (design/project/Perfil.dc.html): quién eres, tu región, tus números y los ajustes. */
export function Profile({ onOpen, onOpenAlbum, onOpenRewards }: Props) {
  const { useCases } = useDependencies();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSession();
  const profile = useProfile();
  const state = useAlbum();
  const records = useAchievements();
  const posters = usePosters();
  const [appearance] = useAppearance();
  const album = state.status === 'ready' ? state.album : null;
  const favorite = album?.entries.find((e) => e.species.id === profile?.favoriteSpeciesId);
  const rewards = album ? rewardsView(album, records ?? []) : null;
  const savedPosters = posters?.filter((p) => p.kind === 'species').length;

  const stats = [
    { label: 'Especies', value: album?.registered, onPress: onOpenAlbum },
    { label: 'Medallas', value: rewards?.earned.length, onPress: () => onOpenRewards('medals') },
    { label: 'Cromos', value: rewards?.chromes, onPress: () => onOpenRewards('chromes') },
    { label: savedPosters === 1 ? 'Póster' : 'Pósteres', value: savedPosters, onPress: () => onOpenRewards('posters') },
  ];

  return (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4], paddingBottom: layout.tabBar + insets.bottom + spacing[4] }]}>
        <View style={styles.header}>
          <View style={[styles.avatar, { boxShadow: `0 0 0 3px ${colors.surface}, 0 0 0 4px ${colors.line}` }]}>
            <BirdAvatar figure={favorite?.species.figure ?? 'gull'} tint={stickerTint(favorite?.species.habitat ?? 'coast')} empty={!favorite} size={72} />
          </View>
          <View style={styles.flex}>
            <ThemedText variant="title" accessibilityRole="header" numberOfLines={2}>{profile?.displayName || 'Tu perfil'}</ThemedText>
            {profile && (
              <ThemedText variant="small" color="textSecondary">@{profile.handle} · desde {monthYear.format(profile.createdAt)}</ThemedText>
            )}
            {favorite && <ThemedText variant="caption" color="textSecondary">Ave favorita: {favorite.species.commonName}</ThemedText>}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Editar perfil" onPress={() => onOpen('edit')} style={styles.edit} disabled={!profile}>
            <Icon name="edit" color={colors.text} size={20} strokeWidth={1.9} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mi región: Ica${album ? `, ${album.registered} de ${album.total} especies` : ''}. Cambiar`}
          onPress={() => onOpen('regions')}
          style={[styles.region, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <PeruMap height={64} />
          <View style={styles.flex}>
            <ThemedText variant="eyebrow" color="primary">Mi región</ThemedText>
            <ThemedText variant="heading">Ica</ThemedText>
            {album && <ThemedText variant="caption" color="textSecondary">{album.registered} de {album.total} especies</ThemedText>}
          </View>
          <View style={styles.change}>
            <ThemedText variant="label">Cambiar</ThemedText>
            <Icon name="chevronRight" color={colors.text} size={16} strokeWidth={2.2} />
          </View>
        </Pressable>

        <View accessibilityLabel="Resumen" style={styles.stats}>
          {stats.map((stat) => (
            <Pressable
              key={stat.label}
              accessibilityRole="button"
              accessibilityLabel={`${stat.value ?? 0} ${stat.label}`}
              onPress={stat.onPress}
              style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}>
              <ThemedText variant="heading">{stat.value ?? '–'}</ThemedText>
              <ThemedText variant="captionStrong" color="textSecondary">{stat.label}</ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText variant="section" accessibilityRole="header" style={styles.sectionTitle}>Ajustes</ThemedText>
          <SettingsList
            label="Ajustes"
            items={[
              // Las notificaciones llegan con los avisos push; mientras, la fila se ve apagada.
              { key: 'notifications', icon: 'bell', title: 'Notificaciones', detail: 'Pronto: logros, intercambios y nuevas regiones' },
              { key: 'appearance', icon: 'appearance', title: 'Apariencia', detail: APPEARANCE_LABELS[appearance].title, onPress: () => onOpen('appearance') },
              { key: 'privacy', icon: 'shield', title: 'Privacidad', detail: 'La ubicación de tus fotos no se comparte', onPress: () => onOpen('privacy') },
              { key: 'trades', icon: 'swap', title: 'Intercambios', detail: 'Solo por enlace o código QR · tus propuestas', onPress: () => onOpen('trades') },
              { key: 'practices', icon: 'eye', title: 'Buenas prácticas', detail: 'Cómo observar sin molestar a las aves', onPress: () => onOpen('practices') },
              { key: 'help', icon: 'help', title: 'Ayuda y comentarios', detail: 'Preguntas frecuentes y contacto', onPress: () => onOpen('help') },
              ...(__DEV__ ? [{ key: 'design', icon: 'image' as const, title: 'Sistema visual', detail: 'Solo en desarrollo: paleta, letra y componentes', onPress: () => onOpen('design-system') }] : []),
            ]}
          />
        </View>

        {/* Al salir, la ruta raíz vuelve sola a Login (Stack.Protected). */}
        <View style={styles.signOut}>
          {user?.email && <ThemedText variant="caption" color="textSecondary" style={styles.center}>Entraste como {user.email}</ThemedText>}
          <Button label="Cerrar sesión" variant="tertiary" onPress={() => void useCases.signOut()} />
        </View>
      </ScrollView>
      <StatusBarScrim />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.cardMargin,
    gap: spacing[3],
  },
  header: {
    paddingLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  edit: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  region: {
    marginTop: spacing[1],
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: 6,
  },
  stat: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    marginHorizontal: 4,
  },
  signOut: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
  center: {
    textAlign: 'center',
  },
});
