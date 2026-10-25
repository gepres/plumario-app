import { router, useLocalSearchParams } from 'expo-router';

import { NewPassword } from '@/screens/auth/new-password';

/**
 * Se abre desde el enlace del correo: plumario://new-password?oobCode=… (oobCode es el nombre que
 * Firebase le da al código del enlace).
 */
export default function NewPasswordRoute() {
  const { oobCode = '' } = useLocalSearchParams<{ oobCode?: string }>();
  return (
    <NewPassword
      code={oobCode}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
      onRequestAnother={() => router.replace('/forgot-password')}
    />
  );
}
