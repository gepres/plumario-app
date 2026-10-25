import { router } from 'expo-router';

import { ChromeCategories } from '@/screens/chrome-categories';

export default function ChromeCategoriesRoute() {
  return <ChromeCategories onBack={() => router.back()} />;
}
