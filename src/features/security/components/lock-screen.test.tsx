import '@/core/i18n';

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { useLockStore } from '../lib/lock.store';
import type { SecurityService } from '../services/security.service';
import { LockScreen } from './lock-screen';

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-haptics', () => ({ selectionAsync: () => Promise.resolve() }));
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: async () => false,
  isEnrolledAsync: async () => false,
  authenticateAsync: async () => ({ success: false }),
}));
jest.mock('@/core/maintenance', () => ({ eraseAllData: jest.fn() }));
jest.mock('@/core/db', () => ({ useDatabaseRestart: () => jest.fn() }));

function fakeService(overrides: Partial<SecurityService> = {}): SecurityService {
  return {
    isPinEnabled: async () => true,
    setPin: jest.fn(),
    removePin: jest.fn(),
    remainingLockoutMs: () => 0,
    verifyPin: async (pin: string) =>
      pin === '2468' ? { ok: true } : { ok: false, lockedUntil: null },
    recordSuccessfulUnlock: jest.fn(),
    getPreferences: () => ({ biometrics: false, autoLock: 'immediate', blockScreenshots: true }),
    setPreferences: jest.fn(),
    ...overrides,
  } as SecurityService;
}

async function typePin(digits: string) {
  for (const d of digits) await fireEvent.press(screen.getByLabelText(d));
}

describe('LockScreen', () => {
  beforeEach(() => useLockStore.getState().init(true));

  it('rejects a wrong PIN and unlocks with the right one', async () => {
    await render(<LockScreen service={fakeService()} />);
    expect(screen.getByText('Digite seu PIN')).toBeOnTheScreen();

    await typePin('1111');
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('PIN incorreto')).toBeOnTheScreen();
    expect(useLockStore.getState().status).toBe('locked');

    await typePin('2468');
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(useLockStore.getState().status).toBe('unlocked'));
  });

  it('keeps the confirm button disabled below the minimum length', async () => {
    await render(<LockScreen service={fakeService()} />);
    await typePin('12');
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
  });

  it('shows the lockout countdown and disables the keypad', async () => {
    await render(<LockScreen service={fakeService({ remainingLockoutMs: () => 30_000 })} />);
    expect(screen.getByText('Muitas tentativas. Tente de novo em 30 segundos.')).toBeOnTheScreen();
    expect(screen.getByLabelText('5')).toBeDisabled();
  });
});
