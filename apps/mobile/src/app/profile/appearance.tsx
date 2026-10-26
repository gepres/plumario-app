import { router } from 'expo-router';

import { ProfileAppearance } from '@/screens/profile/appearance';

export default function ProfileAppearanceRoute() {
  return <ProfileAppearance onBack={() => router.back()} />;
}
