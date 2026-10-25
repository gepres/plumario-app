import { router } from 'expo-router';

import { ProfilePractices } from '@/screens/profile/practices';

export default function ProfilePracticesRoute() {
  return <ProfilePractices onBack={() => router.back()} />;
}
