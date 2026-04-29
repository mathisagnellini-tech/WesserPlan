import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: document.documentElement.classList.contains('dark'),
  toggle: () => set((state) => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    if (state.isDark) {
      html.classList.remove('dark');
      localStorage.setItem('wesserplan-theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('wesserplan-theme', 'dark');
    }
    setTimeout(() => html.classList.remove('theme-transition'), 350);
    return { isDark: !state.isDark };
  }),
  setTheme: (theme) => set(() => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('wesserplan-theme', theme);
    setTimeout(() => html.classList.remove('theme-transition'), 350);
    return { isDark: theme === 'dark' };
  }),
}));
