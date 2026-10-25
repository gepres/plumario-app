import { router, useLocalSearchParams } from 'expo-router';

import { ForgotPassword } from '@/screens/auth/forgot-password';

export default function ForgotPasswordRoute() {
  // Si en Login ya había escrito el correo, llega acá para no pedirlo dos veces.
  const { email } = useLocalSearchParams<{ email?: string }>();
  return (
    <ForgotPassword
      initialEmail={email}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
      onSent={(sentTo) => router.push({ pathname: '/reset-sent', params: { email: sentTo } })}
    />
  );
}
