import { router } from 'expo-router';

import { ProfileEdit } from '@/screens/profile/edit';

export default function ProfileEditRoute() {
  return <ProfileEdit onBack={() => router.back()} onSaved={() => router.back()} />;
}
