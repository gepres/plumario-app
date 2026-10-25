import { router } from 'expo-router';

import { ProfileHelp } from '@/screens/profile/help';

export default function ProfileHelpRoute() {
  return <ProfileHelp onBack={() => router.back()} onWrite={(kind) => router.push({ pathname: '/profile/feedback', params: { kind } })} />;
}
