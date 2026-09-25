import { router, Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { colorOf, useAppColorScheme } from '@/shared/theme';
import { Button, Card, EmptyState, Icon, IconButton, Section, Text } from '@/shared/ui';

import { useCaptureSession } from '../capture/capture-session.store';

import { TimelineIcon } from '../components/timeline-icon';
import { useTimelineDetails } from '../hooks/use-timelines';
import { getTemplate } from '../templates';

export function TimelineScreen({ timelineId }: { timelineId: string }) {
  const { t } = useTranslation('photos');
  const scheme = useAppColorScheme();
  const details = useTimelineDetails(timelineId);

  if (details.status === 'loading') return null;
  if (!details.data) return <EmptyState title={t('timeline.notFound')} />;

  const { timeline, angles, entryCount } = details.data;
  const template = getTemplate(timeline.templateKey);
  const activeAngles = angles.filter((a) => a.isActive);

  const newEntry = () => {
    useCaptureSession.getState().start(timelineId);
    router.push({ pathname: '/timeline/[timelineId]/session', params: { timelineId } });
  };

  const openSettings = () =>
    router.push({ pathname: '/timeline/[timelineId]/settings', params: { timelineId } });

  return (
    <>
      <Stack.Screen
        options={{
          title: timeline.title,
          headerRight: () => (
            <IconButton
              icon="settings"
              accessibilityLabel={t('timeline.settings')}
              onPress={openSettings}
            />
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-4 pb-12">
        <View className="flex-row items-center gap-4">
          <TimelineIcon icon={timeline.icon} color={timeline.color} size={56} />
          <View className="flex-1">
            <Text variant="title" numberOfLines={2}>
              {timeline.title}
            </Text>
            <Text variant="caption">{t(`templates.${timeline.templateKey}.name`)}</Text>
          </View>
        </View>

        <Section title={t('timeline.angles')}>
          <View className="flex-row flex-wrap gap-2">
            {activeAngles.map((angle) => (
              <View key={angle.id} className="rounded-full bg-surface-muted px-3 py-1.5">
                <Text variant="caption" className="text-foreground">
                  {angle.label}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Button label={t('timeline.newEntry')} onPress={newEntry} />

        {entryCount === 0 ? (
          <Card className="items-center py-10">
            <EmptyState
              title={t('timeline.noEntries')}
              description={t('timeline.noEntriesDescription')}
            />
          </Card>
        ) : (
          <Text variant="caption">{t('home.entries', { count: entryCount })}</Text>
        )}

        <Section title={t('timeline.tips')}>
          <Card className="gap-3">
            {template.tips.map((tip) => (
              <View key={tip} className="flex-row gap-3">
                <Icon name="lightbulb" size={18} color={colorOf(scheme, 'muted')} />
                <Text className="flex-1">
                  {t(`tips.${timeline.templateKey}.${tip}` as 'tips.custom.consistency')}
                </Text>
              </View>
            ))}
          </Card>
        </Section>
      </ScrollView>
    </>
  );
}
