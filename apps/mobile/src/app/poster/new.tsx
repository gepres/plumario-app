import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { PosterGenerate } from '@/screens/poster-generate';

export default function NewPosterRoute() {
  const { number } = useLocalSearchParams<{ number: string }>();
  const parsed = Number(number);
  if (!Number.isInteger(parsed) || parsed < 1) return <Redirect href={{ pathname: '/rewards', params: { tab: 'posters' } }} />;
  return (
    <PosterGenerate
      number={parsed}
      onBack={() => router.back()}
      // Guardado, se reemplaza por PosterListo: «Volver» desde ahí regresa a los pósteres, no al generador.
      onSaved={(id) => router.replace({ pathname: '/poster/[id]', params: { id } })}
    />
  );
}
