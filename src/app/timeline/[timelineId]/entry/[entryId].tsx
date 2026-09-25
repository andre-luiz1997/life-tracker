import { useLocalSearchParams } from 'expo-router';

import { EntryScreen } from '@/features/progress-photos';

export default function EntryRoute() {
  const { timelineId, entryId } = useLocalSearchParams<{ timelineId: string; entryId: string }>();
  return <EntryScreen timelineId={timelineId} entryId={entryId} />;
}
