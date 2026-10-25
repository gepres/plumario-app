import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { PixelRatio, View } from 'react-native';

import { ScaledFrame } from '@plumario/ui';

import type { CaptureTarget } from '@/utils/export-image';

type Size = {
  /** El tamaño con que se dibuja la pieza (el del póster A3 o la tarjeta). */
  baseWidth: number;
  baseHeight: number;
  /** El ancho en píxeles de la imagen exportada. */
  exportWidth: number;
};

/**
 * Exportar una pieza en alta: solo mientras se exporta se monta, fuera de la pantalla, una copia a
 * ese tamaño; se espera a que se dibuje y se captura. `element` va en la pantalla, `run` exporta.
 */
export function useOffscreenCapture(content: ReactNode, { baseWidth, baseHeight, exportWidth }: Size) {
  const [armed, setArmed] = useState(false);
  const target = useRef<ComponentRef<typeof View>>(null);
  const drawn = useRef<(() => void) | null>(null);
  const width = exportWidth / PixelRatio.get();

  const element = armed ? (
    <View pointerEvents="none" style={{ position: 'absolute', left: -width - 1000, top: 0 }}>
      <View
        ref={target}
        collapsable={false}
        // Un momento después de medirse, para que los SVG y las fotos terminen de dibujarse.
        onLayout={() => setTimeout(() => drawn.current?.(), 300)}>
        <ScaledFrame baseWidth={baseWidth} baseHeight={baseHeight} width={width}>
          {content}
        </ScaledFrame>
      </View>
    </View>
  ) : null;

  async function run<T>(task: (view: CaptureTarget) => Promise<T>): Promise<T> {
    const ready = new Promise<void>((resolve) => {
      drawn.current = resolve;
    });
    setArmed(true);
    await ready;
    try {
      return await task(target as CaptureTarget);
    } finally {
      setArmed(false);
    }
  }

  return { element, run };
}
