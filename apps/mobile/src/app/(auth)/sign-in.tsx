import { router } from 'expo-router';

import { SignIn } from '@/screens/auth/sign-in';

export default function SignInRoute() {
  return (
    <SignIn
      onForgotPassword={(email) => router.push({ pathname: '/forgot-password', params: email ? { email } : {} })}
      onCreateAccount={() => router.push('/sign-up')}
    />
  );
}
