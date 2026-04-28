import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * User-facing notification preferences. Currently stored client-side only;
 * a future backend integration (e.g. Supabase `user_preferences` table or the
 * .NET API) can replace `persist` with a sync layer without changing the
 * consumer-facing shape.
 */
export interface NotificationPrefs {
  /** Weekly digest e-mail. */
  summary: boolean;
  /** Critical alerts (e.g. import failure). */
  alerts: boolean;
  /** Product updates and news. */
  news: boolean;
}

export type AppLanguage = 'fr' | 'en';

interface PreferencesState {
  notifications: NotificationPrefs;
  language: AppLanguage;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;
  setLanguage: (lang: AppLanguage) => void;
  reset: () => void;
}

const defaults: Pick<PreferencesState, 'notifications' | 'language'> = {
  notifications: { summary: true, alerts: true, news: false },
  language: 'fr',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      setNotification: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
      setLanguage: (language) => set({ language }),
      reset: () => set(defaults),
    }),
    {
      name: 'wesserplan-preferences',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
