import { router, useLocalSearchParams } from 'expo-router';

import type { FeedbackKind } from '@plumario/core';

import { ProfileFeedback } from '@/screens/profile/feedback';

const KINDS: readonly FeedbackKind[] = ['idea', 'error', 'bird', 'other'];

export default function ProfileFeedbackRoute() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  return <ProfileFeedback kind={KINDS.find((k) => k === kind)} onBack={() => router.back()} />;
}
