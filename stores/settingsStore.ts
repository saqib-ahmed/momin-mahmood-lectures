import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppSettings } from '../types';
import { zustandStorage } from '../services/storage';
import { DEFAULT_SETTINGS } from '../constants';

interface SettingsState extends AppSettings {
  // Actions
  setDownloadOverWifiOnly: (value: boolean) => void;
  setSkipForwardSeconds: (seconds: number) => void;
  setSkipBackwardSeconds: (seconds: number) => void;
  setDefaultPlaybackSpeed: (speed: number) => void;
  setSleepTimerMinutes: (minutes: number | null) => void;
  setAutoPlayNext: (value: boolean) => void;
  setDarkMode: (mode: 'system' | 'light' | 'dark') => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setDownloadOverWifiOnly: (value) => set({ downloadOverWifiOnly: value }),
      setSkipForwardSeconds: (seconds) => set({ skipForwardSeconds: seconds }),
      setSkipBackwardSeconds: (seconds) => set({ skipBackwardSeconds: seconds }),
      setDefaultPlaybackSpeed: (speed) => set({ defaultPlaybackSpeed: speed }),
      setSleepTimerMinutes: (minutes) => set({ sleepTimerMinutes: minutes }),
      setAutoPlayNext: (value) => set({ autoPlayNext: value }),
      setDarkMode: (mode) => set({ darkMode: mode }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
