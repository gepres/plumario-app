// Tema y letra.
export { useTheme } from './theme/use-theme';
export type { ColorToken } from './theme/use-theme';
export { fonts, textStyles } from './theme/fonts';

// Componentes de la guía (design/project/GuiaComponentes.dc.html).
export { BirdAvatar } from './components/bird-avatar';
export { BirdFigure, type BirdArt } from './components/bird-figure';
export { BirdCard, BirdCardBack, BirdCardCover, CARD_HEIGHT, CARD_WIDTH, FlipCard } from './components/bird-card';
export type { CardFact, CardSeal, CardTrait } from './components/bird-card';
export type { CardHabitat } from './components/card-faces';
export { BirdSticker } from './components/bird-sticker';
export type { StickerFinish } from './components/bird-sticker';
export { Button } from './components/button';
export { CategoryBadge } from './components/category-badge';
export type { ButtonVariant } from './components/button';
export { Card } from './components/card';
export { Checkbox } from './components/checkbox';
export { Chip } from './components/chip';
export { FilterChips } from './components/filter-chips';
export { FinishSwatch } from './components/finish-swatch';
export { FormScreen } from './components/form-screen';
export { IconTile, InfoNote, TextDivider, TextLink, TopBar } from './components/form-parts';
export { GradientView } from './components/gradient-view';
export { Icon } from './components/icon';
export type { IconName } from './components/icon';
export { ListRow } from './components/list-row';
export { Logo } from './components/logo';
export { Medal } from './components/medal';
export { NoticeBanner } from './components/notice-banner';
export type { MedalKind } from './components/medal';
export { ProgressBar } from './components/progress-bar';
export { Rays } from './components/rays';
export { Screen } from './components/screen';
export { SegmentedTabs } from './components/segmented-tabs';
export { Skeleton, SkeletonBlock, SkeletonStickers } from './components/skeleton';
export { Sheet } from './components/sheet';
export { StatusBarScrim } from './components/status-bar-scrim';
export { HOLOGRAPHIC } from './components/sticker-finishes';
export type { ChromeFinish } from './components/sticker-finishes';
export { TabBar } from './components/tab-bar';
export { TextField } from './components/text-field';
export { ScaledFrame } from './components/scaled-frame';
export { SettingsList } from './components/settings-list';
export type { SettingsItem } from './components/settings-list';
export { Switch } from './components/switch';
export { ToggleGroup } from './components/toggle-group';
export type { TextFieldKind } from './components/text-field';
export type { TabBarItem } from './components/tab-bar';
export { ThemedText } from './components/themed-text';
export type { ThemedTextProps } from './components/themed-text';

// Figuras de las aves (SistemaSiluetas), generadas desde design/assets.
export { FIGURE_SVGS } from './figures/figure-svgs';
export type { FigureName } from './figures/figure-svgs';

// Pósteres (Poster10 y PosterHabitat), en 1123 × 1587 para mostrar y exportar.
export { HabitatPoster } from './posters/habitat-poster';
export type { HabitatPosterCell } from './posters/habitat-poster';
export { POSTER_HEIGHT, POSTER_WIDTH, PosterFrame } from './posters/poster-frame';
export type { PosterHabitat } from './posters/poster-scenes';
export { SpeciesPoster } from './posters/species-poster';
export type { PosterSticker } from './posters/species-poster';

// Tarjeta para compartir un logro (TarjetaLogro), en 1080 × 1350.
export { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, ShareCard } from './share/share-card';

// Mapa del Perú con la región del álbum (Perfil, RegionLista).
export { PeruMap } from './regions/peru-map';
export { RegionMap } from './regions/region-map';
