import { useNavigation } from 'expo-router';
import { useCallback } from 'react';

/**
 * Cierra un flujo que vive en un modal con su propia pila (Registrar): vuelve a la pantalla desde
 * la que se abrió, esté en el paso que esté. router.dismiss() solo saldría del paso actual.
 */
export function useCloseFlow() {
  const navigation = useNavigation();
  return useCallback(() => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else navigation.goBack();
  }, [navigation]);
}
