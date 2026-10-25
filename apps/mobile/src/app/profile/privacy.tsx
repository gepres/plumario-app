import { router } from 'expo-router';

import { ProfilePrivacy } from '@/screens/profile/privacy';

export default function ProfilePrivacyRoute() {
  return <ProfilePrivacy onBack={() => router.back()} onOpenPolicy={() => router.push('/profile/policy')} />;
}
