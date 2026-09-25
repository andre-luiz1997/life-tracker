import { create } from 'zustand';

type LockState = {
  /** `checking` until we know whether a PIN exists (keeps content hidden on cold start). */
  status: 'checking' | 'locked' | 'unlocked';
  pinEnabled: boolean;
  init: (pinEnabled: boolean) => void;
  lock: () => void;
  unlock: () => void;
  setPinEnabled: (enabled: boolean) => void;
};

export const useLockStore = create<LockState>((set, get) => ({
  status: 'checking',
  pinEnabled: false,
  init: (pinEnabled) => set({ pinEnabled, status: pinEnabled ? 'locked' : 'unlocked' }),
  lock: () => get().pinEnabled && set({ status: 'locked' }),
  unlock: () => set({ status: 'unlocked' }),
  setPinEnabled: (pinEnabled) => set({ pinEnabled }),
}));
