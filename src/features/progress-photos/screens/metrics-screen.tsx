import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { i18n, useTranslation } from '@/core/i18n';
import { Card, EmptyState, Text } from '@/shared/ui';

import { LineChart } from '../components/line-chart';
import { useMetricHistory } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { formatChange, formatDecimal, type MetricPoint, summarize } from '../lib/metrics';

export function MetricsScreen({ timelineId }: { timelineId: string }) {
  const { t } = useTranslation('photos');
  const details = useTimelineDetails(timelineId);
  const history = useMetricHistory(timelineId);
  const locale = i18n.language;

  if (details.status === 'loading' || history.status === 'loading') return null;
  if (!details.data) return <EmptyState title={t('timeline.notFound')} />;

  const { metrics, timeline } = details.data;
  const seriesOf = (metricId: string): MetricPoint[] =>
    (history.data ?? [])
      .filter((r) => r.value.metricId === metricId)
      .map((r) => ({ date: r.takenAt, value: r.value.value }));

  return (
    <>
      <Stack.Screen options={{ title: t('metricsScreen.title') }} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-12">
        {!metrics.length ? <EmptyState title={t('metricsScreen.noMetrics')} /> : null}
        {metrics.map((metric) => {
          const points = seriesOf(metric.id);
          const summary = summarize(points);
          return (
            <Card key={metric.id} className="gap-3">
              <View className="flex-row items-baseline justify-between">
                <Text variant="subtitle">{metric.label}</Text>
                {summary ? (
                  <Text variant="caption">
                    {t('metricsScreen.records', { count: points.length })}
                  </Text>
                ) : null}
              </View>

              {summary ? (
                <>
                  <View className="flex-row justify-between">
                    <View>
                      <Text variant="caption">{t('metricsScreen.last')}</Text>
                      <Text className="text-xl font-bold">
                        {formatDecimal(summary.last.value, locale)} {metric.unit}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text variant="caption">{t('metricsScreen.change')}</Text>
                      <Text className="text-xl font-bold">
                        {formatChange(summary.change, metric.unit, locale)}
                      </Text>
                    </View>
                  </View>
                  <LineChart
                    points={points}
                    color={timeline.color}
                    accessibilityLabel={`${metric.label}: ${formatDecimal(summary.first.value, locale)} → ${formatDecimal(summary.last.value, locale)} ${metric.unit}`}
                  />
                  <View className="flex-row justify-between">
                    <Text variant="caption">
                      {summary.first.date.toLocaleDateString(locale, { dateStyle: 'short' })}
                    </Text>
                    <Text variant="caption">
                      {summary.last.date.toLocaleDateString(locale, { dateStyle: 'short' })}
                    </Text>
                  </View>
                </>
              ) : (
                <Text variant="caption">
                  {t('metricsScreen.empty')} {t('metricsScreen.emptyHint')}
                </Text>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </>
  );
}
