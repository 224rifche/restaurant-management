'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => { } });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Récupérer le thème sauvé ou utiliser sombre par défaut
    const savedTheme = localStorage.getItem('slm-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('slm-theme', newTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      // Forcer une petite mise à jour des classes du body si nécessaire
      document.body.className = document.body.className;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
