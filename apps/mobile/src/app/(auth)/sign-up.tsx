import { router } from 'expo-router';

import { SignUp } from '@/screens/auth/sign-up';

export default function SignUpRoute() {
  return <SignUp onBack={() => router.back()} onSignIn={() => router.dismissTo('/sign-in')} />;
}
