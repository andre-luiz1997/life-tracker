import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Card, IconButton, Text, TextField } from '@/shared/ui';

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
      <Card className="gap-1 p-2">
        {angles.map((angle, index) => (
          <View
            key={angle.id}
            className={cn(
              'flex-row items-center gap-1 py-1 pl-2',
              index > 0 && 'border-t border-border',
            )}>
            {editingId === angle.id ? (
              <TextField
                containerClassName="flex-1"
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={commitEdit}
                onBlur={commitEdit}
                autoFocus
                maxLength={40}
                accessibilityLabel={t('timelineSettings.rename')}
              />
            ) : (
              <Text
                className={cn('flex-1', !angle.isActive && 'text-muted')}
                numberOfLines={1}
                onPress={() => startEditing(angle)}
                accessibilityHint={t('timelineSettings.rename')}>
                {angle.label}
              </Text>
            )}
            <Switch
              value={angle.isActive}
              accessibilityLabel={
                angle.isActive ? t('timelineSettings.disable') : t('timelineSettings.enable')
              }
              onValueChange={(value) =>
                runGuarded(t, () => service.setAngleActive(angle.id, value))
              }
            />
            <IconButton
              icon="chevron-up"
              size={18}
              disabled={index === 0}
              accessibilityLabel={t('timelineSettings.moveUp')}
              onPress={() => service.moveAngle(angle.id, 'up')}
            />
            <IconButton
              icon="chevron-down"
              size={18}
              disabled={index === angles.length - 1}
              accessibilityLabel={t('timelineSettings.moveDown')}
              onPress={() => service.moveAngle(angle.id, 'down')}
            />
            <IconButton
              icon="trash"
              size={18}
              color="danger"
              accessibilityLabel={t('timelineSettings.remove')}
              onPress={() => confirmRemove(angle)}
            />
          </View>
        ))}
      </Card>
      <AddItemField
        placeholder={t('timelineSettings.anglePlaceholder')}
        accessibilityLabel={t('timelineSettings.addAngle')}
        onAdd={(label) => service.addAngle(timelineId, label)}
      />
    </View>
  );
}
