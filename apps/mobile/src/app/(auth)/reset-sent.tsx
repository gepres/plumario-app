import { router, useLocalSearchParams } from 'expo-router';

import { ResetSent } from '@/screens/auth/reset-sent';

export default function ResetSentRoute() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  return (
    <ResetSent
      email={email}
      onBack={() => router.back()}
      onChangeEmail={() => router.back()}
      onSignIn={() => router.dismissTo('/sign-in')}
    />
  );
}
