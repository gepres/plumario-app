import { router } from 'expo-router';

import { PrivacyPolicy } from '@/screens/profile/policy';

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicy onBack={() => router.back()} />;
}
