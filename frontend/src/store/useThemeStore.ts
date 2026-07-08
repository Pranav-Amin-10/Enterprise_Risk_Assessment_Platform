import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  fontSize: 'sm' | 'md' | 'lg';
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Read initial preferences from localStorage
  const savedTheme = (localStorage.getItem('grc_theme') as 'dark' | 'light') || 'dark';
  const savedFontSize = (localStorage.getItem('grc_font_size') as 'sm' | 'md' | 'lg') || 'md';

  // Apply font size style to HTML document element
  const applyFontSize = (size: 'sm' | 'md' | 'lg') => {
    const root = window.document.documentElement;
    if (size === 'sm') {
      root.style.fontSize = '14.5px';
    } else if (size === 'md') {
      root.style.fontSize = '16.25px'; // Increased slightly as requested
    } else {
      root.style.fontSize = '18.0px';
    }
  };

  // Run initial applies
  const root = window.document.documentElement;
  if (savedTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  applyFontSize(savedFontSize);

  return {
    theme: savedTheme,
    toggleTheme: () => set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('grc_theme', nextTheme);
      
      const root = window.document.documentElement;
      if (nextTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),
    fontSize: savedFontSize,
    setFontSize: (size) => set(() => {
      localStorage.setItem('grc_font_size', size);
      applyFontSize(size);
      return { fontSize: size };
    }),
  };
});
