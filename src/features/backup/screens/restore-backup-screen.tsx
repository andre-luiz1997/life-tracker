import type { File } from 'expo-file-system';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { IncompatibleDumpError, useDatabaseRestart } from '@/core/db';
import { i18n, useTranslation } from '@/core/i18n';
import { Button, Card, Text, TextField } from '@/shared/ui';

import { inspectBackup, pickBackupFile, restoreBackup } from '../hooks/use-backup';
import { InvalidBackupError } from '../lib/container';
import { type BackupSummary, WrongPasswordError } from '../services/backup.service';

export function RestoreBackupScreen() {
  const { t } = useTranslation('backup');
  const restart = useDatabaseRestart();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'verifying' | 'restoring' | null>(null);

  const pick = async () => {
    const picked = await pickBackupFile();
    if (!picked) return;
    setFile(picked);
    setSummary(null);
    setError(null);
  };

  const verify = async () => {
    if (!file) return;
    setBusy('verifying');
    setError(null);
    try {
      setSummary(await inspectBackup(file, password));
    } catch (e) {
      setError(
        e instanceof WrongPasswordError
          ? t('wrongPassword')
          : e instanceof IncompatibleDumpError
            ? t('newer')
            : t('invalid'),
      );
      if (__DEV__ && !(e instanceof WrongPasswordError) && !(e instanceof InvalidBackupError))
        console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const replace = () =>
    Alert.alert(t('replaceTitle'), t('replaceMessage'), [
      { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
      {
        text: t('replace'),
        style: 'destructive',
        onPress: async () => {
          if (!file) return;
          setBusy('restoring');
          router.dismissAll();
          try {
            await restart(() => restoreBackup(file, password));
            Alert.alert(t('restored'));
          } catch (e) {
            Alert.alert(e instanceof IncompatibleDumpError ? t('newer') : t('restoreError'));
          }
        },
      },
    ]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t('restoreTitle'), presentation: 'modal' }} />
      <ScrollView contentContainerClassName="gap-5 p-4" keyboardShouldPersistTaps="handled">
        <Button variant="secondary" label={t('pickFile')} onPress={pick} />
        {file ? (
          <Card className="gap-1">
            <Text variant="caption">{t('selected')}</Text>
            <Text numberOfLines={1}>{file.name}</Text>
          </Card>
        ) : null}

        {file && !summary ? (
          <>
            <TextField
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={verify}
              error={error ?? undefined}
            />
            <Button
              label={busy === 'verifying' ? t('verifying') : t('verify')}
              onPress={verify}
              loading={busy === 'verifying'}
              disabled={!password}
            />
          </>
        ) : null}

        {summary ? (
          <>
            <Card>
              <Text>
                {t('summary', {
                  date: summary.createdAt.toLocaleString(i18n.language, {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  }),
                  count: summary.photoCount,
                })}
              </Text>
            </Card>
            <Button
              variant="danger"
              label={busy === 'restoring' ? t('restoring') : t('restore')}
              onPress={replace}
              loading={busy === 'restoring'}
            />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
