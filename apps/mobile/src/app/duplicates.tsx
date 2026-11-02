import { router } from 'expo-router';

import { Duplicates } from '@/screens/duplicates';

export default function DuplicatesRoute() {
  return <Duplicates onBack={() => router.back()} />;
}
