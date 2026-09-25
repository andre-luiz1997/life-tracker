import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Card, Chip, IconButton, Text, TextField } from '@/shared/ui';

import type { MetricDefinition, TemplateKey } from '../db/progress-photos.schema';
import type { TimelineService } from '../services/timeline.service';
import { getTemplate } from '../templates';
import { runGuarded } from './run-guarded';

type Props = {
  timelineId: string;
  templateKey: TemplateKey;
  metrics: MetricDefinition[];
  service: TimelineService;
};

type Draft = { id: string | null; label: string; unit: string };
const EMPTY: Draft = { id: null, label: '', unit: '' };

export function MetricsEditor({ timelineId, templateKey, metrics, service }: Props) {
  const { t } = useTranslation('photos');
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const existingKeys = new Set(metrics.map((m) => m.key));
  const suggestions = getTemplate(templateKey).metrics.filter((m) => !existingKeys.has(m.key));
  const canSave = draft.label.trim() && draft.unit.trim();

  const save = () => {
    if (!canSave) return;
    runGuarded(t, () => {
      if (draft.id) service.updateMetric(draft.id, draft);
      else service.addMetric(timelineId, draft);
    });
    setDraft(EMPTY);
  };

  const confirmRemove = (metric: MetricDefinition) =>
    Alert.alert(
      t('timelineSettings.removeMetricConfirmTitle', { label: metric.label }),
      t('timelineSettings.removeMetricConfirmMessage'),
      [
        { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
        {
          text: t('timelineSettings.remove'),
          style: 'destructive',
          onPress: () => runGuarded(t, () => service.removeMetric(metric.id)),
        },
      ],
    );

  return (
    <View className="gap-3">
      {metrics.length ? (
        <Card className="gap-1 p-2">
          {metrics.map((metric, index) => (
            <View
              key={metric.id}
              className={cn(
                'flex-row items-center gap-1 py-1 pl-2',
                index > 0 && 'border-t border-border',
              )}>
              <Text
                className="flex-1"
                numberOfLines={1}
                onPress={() => setDraft({ id: metric.id, label: metric.label, unit: metric.unit })}
                accessibilityHint={t('timelineSettings.rename')}>
                {metric.label} <Text variant="caption">({metric.unit})</Text>
              </Text>
              <IconButton
                icon="chevron-up"
                size={18}
                disabled={index === 0}
                accessibilityLabel={t('timelineSettings.moveUp')}
                onPress={() => service.moveMetric(metric.id, 'up')}
              />
              <IconButton
                icon="chevron-down"
                size={18}
                disabled={index === metrics.length - 1}
                accessibilityLabel={t('timelineSettings.moveDown')}
                onPress={() => service.moveMetric(metric.id, 'down')}
              />
              <IconButton
                icon="trash"
                size={18}
                color="danger"
                accessibilityLabel={t('timelineSettings.remove')}
                onPress={() => confirmRemove(metric)}
              />
            </View>
          ))}
        </Card>
      ) : null}

      <View className="flex-row items-center gap-2">
        <TextField
          containerClassName="flex-[2]"
          placeholder={t('timelineSettings.metricLabelPlaceholder')}
          accessibilityLabel={t('timelineSettings.metricLabelPlaceholder')}
          value={draft.label}
          onChangeText={(label) => setDraft((d) => ({ ...d, label }))}
          maxLength={30}
        />
        <TextField
          containerClassName="flex-1"
          placeholder={t('timelineSettings.metricUnitPlaceholder')}
          accessibilityLabel={t('timelineSettings.metricUnitPlaceholder')}
          value={draft.unit}
          onChangeText={(unit) => setDraft((d) => ({ ...d, unit }))}
          onSubmitEditing={save}
          maxLength={10}
          autoCapitalize="none"
        />
        <IconButton
          icon={draft.id ? 'check' : 'plus'}
          color="primary"
          disabled={!canSave}
          accessibilityLabel={
            draft.id ? t('actions.save', { ns: 'common' }) : t('timelineSettings.addMetric')
          }
          onPress={save}
        />
      </View>

      {suggestions.length ? (
        <View className="gap-2">
          <Text variant="caption">{t('timelineSettings.suggestions')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((metric) => (
              <Chip
                key={metric.key}
                onPress={() =>
                  service.addMetric(timelineId, {
                    key: metric.key,
                    label: t(`metrics.${metric.key}` as 'metrics.weight'),
                    unit: metric.unit,
                  })
                }
                label={`+ ${t(`metrics.${metric.key}` as 'metrics.weight')} (${metric.unit})`}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
