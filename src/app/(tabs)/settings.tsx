import { BackupSettings } from '@/features/backup';
import { FigureSettings } from '@/features/progress-photos';
import { SecuritySettings } from '@/features/security';
import { AppearanceSettings, SettingsScreen } from '@/features/settings';

export default function SettingsRoute() {
  return (
    <SettingsScreen>
      <AppearanceSettings />
      <FigureSettings />
      <BackupSettings />
      <SecuritySettings />
    </SettingsScreen>
  );
}
