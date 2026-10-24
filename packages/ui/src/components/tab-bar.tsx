import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { layout } from '@plumario/tokens';

import { useTheme } from '../theme/use-theme';
import { GradientView } from './gradient-view';
import { Icon, type IconName } from './icon';

// Portada de diseno/project/BarraNav.dc.html: barra flotante con muesca para el botón de la cámara.
// La pestaña activa se rellena a dos tonos, sin texto. No sabe de rutas: recibe las pestañas ya
// resueltas, y la app la conecta con su navegador.

export type TabBarItem = {
  key: string;
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

type Props = {
  /** Dos a cada lado del botón de la cámara. */
  items: readonly TabBarItem[];
  cameraLabel: string;
  onCameraPress: () => void;
  /** Margen inferior del área segura del dispositivo. */
  bottomInset?: number;
};

const MARGIN = 16;
const BUTTON = 52;
const FAB = 58;
// Centros de las pestañas medidos desde el centro de la pantalla, como en el diseño (390 de ancho).
const OFFSETS = [-132, -68, 68, 132];

/** El contorno de la barra con la muesca centrada; con ancho 358 es el path del diseño. */
function outline(width: number) {
  const c = width / 2;
  return [
    `M28 8 H${c - 66}`,
    `C ${c - 48} 8 ${c - 44} 12 ${c - 38} 24`,
    `C ${c - 30} 41 ${c - 17} 50 ${c} 50`,
    `C ${c + 17} 50 ${c + 30} 41 ${c + 38} 24`,
    `C ${c + 44} 12 ${c + 48} 8 ${c + 66} 8`,
    `H${width - 28} A28 28 0 0 1 ${width} 36 V42 A28 28 0 0 1 ${width - 28} 70`,
    'H28 A28 28 0 0 1 0 42 V36 A28 28 0 0 1 28 8 Z',
  ].join(' ');
}

export function TabBar({ items, cameraLabel, onCameraPress, bottomInset = 0 }: Props) {
  const { colors, shadows } = useTheme();
  // Se mide el contenedor, no la ventana: la barra puede vivir en un marco más angosto (web,
  // tableta). Hasta medirlo, se asume el ancho de la ventana para no dibujar en blanco.
  const window = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(window.width);
  const width = containerWidth - MARGIN * 2;
  const center = containerWidth / 2;

  return (
    <View
      pointerEvents="box-none"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[styles.container, { height: layout.tabBar + bottomInset }]}>
      {/* La sombra la proyecta una caja algo menor, escondida bajo la barra: el SVG no tiene sombra. */}
      <View pointerEvents="none" style={[styles.shadow, { width: width - 40, backgroundColor: colors.tabBar, boxShadow: shadows.floating }]} />
      <Svg width={width} height={70} style={styles.shape} pointerEvents="none">
        <Path d={outline(width)} fill={colors.tabBar} />
      </Svg>

      {items.slice(0, OFFSETS.length).map((item, index) => (
        <Pressable
          key={item.key}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: item.active }}
          hitSlop={4}
          onPress={item.onPress}
          onLongPress={item.onLongPress}
          style={[styles.tab, { left: center + OFFSETS[index]! - BUTTON / 2 }]}>
          <Icon
            name={item.icon}
            size={27}
            color={item.active ? colors.tabActiveStroke : colors.tabInactive}
            strokeWidth={item.active ? 2 : 1.8}
            fill={item.active ? colors.tabActiveFill : undefined}
          />
        </Pressable>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cameraLabel}
        onPress={onCameraPress}
        style={({ pressed }) => [styles.fab, { left: center - FAB / 2, boxShadow: shadows.fab }, pressed && styles.pressed]}>
        <GradientView gradient={colors.fab} style={styles.fabBackground}>
          <Icon name="camera" size={27} color={colors.onFab} strokeWidth={2} />
        </GradientView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Por debajo del fondo de la muesca (y = 50 en el SVG) y dentro de las puntas redondeadas: así
  // no se asoma por la muesca ni por las esquinas.
  shadow: {
    position: 'absolute',
    left: MARGIN + 20,
    top: 26 + 50,
    height: 20,
    borderRadius: 10,
  },
  shape: {
    position: 'absolute',
    left: MARGIN,
    top: 26,
  },
  tab: {
    position: 'absolute',
    top: 41,
    width: BUTTON,
    height: BUTTON,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    top: 8,
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
  },
  fabBackground: {
    flex: 1,
    borderRadius: FAB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
