import { BackupSettings } from '@/features/backup';
import { FigureSettings } from '@/features/progress-photos';
import { SecuritySettings } from '@/features/security';
import { SettingsScreen } from '@/features/settings';

export default function SettingsRoute() {
  return (
    <SettingsScreen>
      <FigureSettings />
      <BackupSettings />
      <SecuritySettings />
    </SettingsScreen>
  );
}
