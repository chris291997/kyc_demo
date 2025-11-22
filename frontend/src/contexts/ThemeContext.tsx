import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage or system preference
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) {
      console.log('🎨 Theme loaded from localStorage:', stored);
      return stored;
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('🎨 System preference: dark');
      return 'dark';
    }
    
    console.log('🎨 Default theme: light');
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('🌙 Dark mode activated - class added to <html>');
    } else {
      root.classList.remove('dark');
      console.log('☀️ Light mode activated - class removed from <html>');
    }
    
    localStorage.setItem('theme', theme);
    console.log('💾 Theme saved to localStorage:', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      console.log('🔄 Theme toggled:', prev, '→', newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

