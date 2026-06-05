import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-200/50 hover:bg-slate-200 dark:bg-dark-800/60 dark:hover:bg-dark-700/80 text-slate-700 dark:text-dark-200 border border-slate-300/30 dark:border-dark-700/40 transition-all duration-300 ease-in-out shadow-sm hover:scale-105"
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
