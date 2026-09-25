import { Alert, Linking, View } from 'react-native';

import { i18n, useTranslation } from '@/core/i18n';
import { withExternalActivity } from '@/core/lifecycle';
import { requestNotificationPermission } from '@/core/notifications';
import { Card, Chip, DateField, Text, Toggle } from '@/shared/ui';

import type { Timeline } from '../db/progress-photos.schema';
import type { TimelineService } from '../services/timeline.service';
import { getTemplate } from '../templates';
import { DEFAULT_REMINDER_TIME, formatTime, parseTime } from './schedule';

const INTERVALS = [7, 14, 30];

export function ReminderEditor({
  timeline,
  service,
}: {
  timeline: Timeline;
  service: TimelineService;
}) {
  const { t } = useTranslation('photos');
  const suggested = getTemplate(timeline.templateKey).reminderIntervalDays ?? 7;
  const interval = timeline.reminderIntervalDays;
  const time = timeline.reminderTime ?? DEFAULT_REMINDER_TIME;
  const options = [...new Set([suggested, ...INTERVALS])].sort((a, b) => a - b);

  const timeAsDate = (() => {
    const { hours, minutes } = parseTime(time);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  })();

  const enable = async (value: boolean) => {
    if (!value) return service.setReminder(timeline.id, null);
    // Permission is asked only now, when the user opts in.
    if (!(await requestNotificationPermission())) {
      return Alert.alert(
        t('reminders.permissionDeniedTitle'),
        t('reminders.permissionDeniedMessage'),
        [
          { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
          {
            text: t('reminders.openSettings'),
            onPress: () => withExternalActivity(() => Linking.openSettings()),
          },
        ],
      );
    }
    service.setReminder(timeline.id, { intervalDays: suggested, time });
  };

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 font-body-medium">{t('reminders.enable')}</Text>
        <Toggle
          value={interval !== null}
          onValueChange={enable}
          accessibilityLabel={t('reminders.enable')}
        />
      </View>

      {interval !== null ? (
        <>
          <View className="gap-2">
            <Text variant="caption" className="font-body-medium">
              {t('reminders.every')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {options.map((days) => (
                <Chip
                  key={days}
                  role="radio"
                  selected={interval === days}
                  onPress={() => service.setReminder(timeline.id, { intervalDays: days, time })}
                  label={`${t('reminders.days', { count: days })}${
                    days === suggested ? ` (${t('reminders.suggested')})` : ''
                  }`}
                />
              ))}
            </View>
          </View>
          <DateField
            label={t('reminders.time')}
            mode="time"
            value={timeAsDate}
            locale={i18n.language}
            onChange={(d) =>
              service.setReminder(timeline.id, { intervalDays: interval, time: formatTime(d) })
            }
          />
          <Text variant="caption">{t('reminders.hint')}</Text>
        </>
      ) : null}
    </Card>
  );
}
