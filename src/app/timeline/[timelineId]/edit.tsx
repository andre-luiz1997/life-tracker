import { useLocalSearchParams } from 'expo-router';

import { EditorScreen } from '@/features/progress-photos';

export default function EditRoute() {
  const { timelineId, shot } = useLocalSearchParams<{ timelineId: string; shot?: string }>();
  return <EditorScreen timelineId={timelineId} shotIndex={Number(shot ?? 0)} />;
}
