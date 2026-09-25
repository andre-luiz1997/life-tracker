import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Chip, IconButton, ReorderControl, Tag, Text, TextField } from '@/shared/ui';

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
        <View className="gap-2">
          {metrics.map((metric, index) => (
            <View
              key={metric.id}
              className={cn(
                'min-h-16 flex-row items-center gap-2 rounded-2xl bg-surface-muted py-2 pl-4 pr-2',
                draft.id === metric.id && 'border-2 border-primary',
              )}>
              <Pressable
                className="flex-1 flex-row items-center gap-2 py-1"
                onPress={() => setDraft({ id: metric.id, label: metric.label, unit: metric.unit })}
                accessibilityRole="button"
                accessibilityHint={t('timelineSettings.rename')}>
                <Text className="font-body-medium" numberOfLines={1}>
                  {metric.label}
                </Text>
                <Tag tone="soft" label={metric.unit} />
              </Pressable>
              <ReorderControl
                canMoveUp={index > 0}
                canMoveDown={index < metrics.length - 1}
                onUp={() => service.moveMetric(metric.id, 'up')}
                onDown={() => service.moveMetric(metric.id, 'down')}
                labels={{ up: t('timelineSettings.moveUp'), down: t('timelineSettings.moveDown') }}
              />
              <IconButton
                icon="trash"
                variant="danger"
                size={18}
                diameter={36}
                accessibilityLabel={t('timelineSettings.remove')}
                onPress={() => confirmRemove(metric)}
              />
            </View>
          ))}
        </View>
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
          variant="solid"
          diameter={52}
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
