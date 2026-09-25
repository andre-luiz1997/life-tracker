import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Button, Card, Text, TextField } from '@/shared/ui';

import { exportBackup } from '../hooks/use-backup';
import { BACKUP_PASSWORD_MIN_LENGTH } from '../services/backup.service';

export function ExportBackupScreen() {
  const { t } = useTranslation('backup');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const min = BACKUP_PASSWORD_MIN_LENGTH;
  const tooShort = password.length > 0 && password.length < min;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = password.length >= min && confirm === password;

  const submit = async () => {
    setBusy(true);
    try {
      await exportBackup(password, t('shareTitle'), (done, total) => setProgress({ done, total }));
      router.back();
    } catch (error) {
      if (__DEV__) console.error(error);
      Alert.alert(t('exportError'));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('exportTitle'), presentation: 'modal' }} />
      <ScrollView contentContainerClassName="gap-5 p-4" keyboardShouldPersistTaps="handled">
        <Card>
          <Text variant="caption">{t('passwordHint', { min })}</Text>
        </Card>
        <TextField
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          error={tooShort ? t('passwordShort', { min }) : undefined}
        />
        <TextField
          label={t('passwordConfirm')}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          error={mismatch ? t('passwordMismatch') : undefined}
        />
        <Button
          label={progress ? t('creating', progress) : busy ? t('preparing') : t('create')}
          onPress={submit}
          disabled={!valid}
          loading={busy && !progress}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
