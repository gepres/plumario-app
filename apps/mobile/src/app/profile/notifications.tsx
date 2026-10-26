import { router } from 'expo-router';

import { ProfileNotifications } from '@/screens/profile/notifications';

export default function ProfileNotificationsRoute() {
  return <ProfileNotifications onBack={() => router.back()} />;
}
