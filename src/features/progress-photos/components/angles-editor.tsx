import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { IconButton, ReorderControl, Text, TextField, Toggle } from '@/shared/ui';

import type { TimelineAngle } from '../db/progress-photos.schema';
import type { TimelineService } from '../services/timeline.service';
import { AddItemField } from './add-item-field';
import { runGuarded } from './run-guarded';

type Props = { timelineId: string; angles: TimelineAngle[]; service: TimelineService };

export function AnglesEditor({ timelineId, angles, service }: Props) {
  const { t } = useTranslation('photos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startEditing = (angle: TimelineAngle) => {
    setEditingId(angle.id);
    setDraft(angle.label);
  };

  const commitEdit = () => {
    if (editingId && draft.trim()) service.renameAngle(editingId, draft);
    setEditingId(null);
  };

  const confirmRemove = (angle: TimelineAngle) =>
    Alert.alert(
      t('timelineSettings.removeAngleConfirmTitle', { label: angle.label }),
      t('timelineSettings.removeAngleConfirmMessage'),
      [
        { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
        {
          text: t('timelineSettings.remove'),
          style: 'destructive',
          onPress: () => runGuarded(t, () => service.removeAngle(angle.id)),
        },
      ],
    );

  return (
    <View className="gap-3">
      <View className="gap-2">
        {angles.map((angle, index) => (
          <View
            key={angle.id}
            className="min-h-16 flex-row items-center gap-2 rounded-2xl bg-surface-muted py-2 pl-4 pr-2">
            {editingId === angle.id ? (
              <TextField
                containerClassName="flex-1"
                className="min-h-11 bg-surface"
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={commitEdit}
                onBlur={commitEdit}
                autoFocus
                maxLength={40}
                accessibilityLabel={t('timelineSettings.rename')}
              />
            ) : (
              <Pressable
                className="flex-1 py-1"
                onPress={() => startEditing(angle)}
                accessibilityRole="button"
                accessibilityHint={t('timelineSettings.rename')}>
                <Text
                  className={cn('font-body-medium', !angle.isActive && 'text-muted')}
                  numberOfLines={1}>
                  {angle.label}
                </Text>
                {!angle.isActive ? (
                  <Text variant="caption" className="text-xs">
                    {t('timelineSettings.inactive')}
                  </Text>
                ) : null}
              </Pressable>
            )}
            <ReorderControl
              canMoveUp={index > 0}
              canMoveDown={index < angles.length - 1}
              onUp={() => service.moveAngle(angle.id, 'up')}
              onDown={() => service.moveAngle(angle.id, 'down')}
              labels={{ up: t('timelineSettings.moveUp'), down: t('timelineSettings.moveDown') }}
            />
            <Toggle
              value={angle.isActive}
              accessibilityLabel={
                angle.isActive ? t('timelineSettings.disable') : t('timelineSettings.enable')
              }
              onValueChange={(value) =>
                runGuarded(t, () => service.setAngleActive(angle.id, value))
              }
            />
            <IconButton
              icon="trash"
              variant="danger"
              size={18}
              diameter={36}
              accessibilityLabel={t('timelineSettings.remove')}
              onPress={() => confirmRemove(angle)}
            />
          </View>
        ))}
      </View>
      <AddItemField
        placeholder={t('timelineSettings.anglePlaceholder')}
        accessibilityLabel={t('timelineSettings.addAngle')}
        onAdd={(label) => service.addAngle(timelineId, label)}
      />
    </View>
  );
}
