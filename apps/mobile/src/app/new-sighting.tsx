import { router } from 'expo-router';

import { NewSighting } from '@/screens/new-sighting';

/** Lo abre el botón de la cámara de la barra: es un modal, no una pestaña. */
export default function NewSightingRoute() {
  return <NewSighting onClose={() => router.back()} />;
}
