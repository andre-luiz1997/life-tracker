import { BackupSettings } from '@/features/backup';
import { SecuritySettings } from '@/features/security';
import { SettingsScreen } from '@/features/settings';

export default function SettingsRoute() {
  return (
    <SettingsScreen>
      <BackupSettings />
      <SecuritySettings />
    </SettingsScreen>
  );
}
