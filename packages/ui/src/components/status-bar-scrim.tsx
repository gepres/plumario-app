import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/use-theme';

/**
 * Franja del color de fondo detrás de la barra de estado, para que el contenido que se desplaza no
 * pase por debajo de la hora y los íconos. Va al final de la pantalla, encima de lo desplazable.
 */
export function StatusBarScrim() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.background }} />;
}
