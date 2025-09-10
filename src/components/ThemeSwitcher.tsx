import React from 'react';
import { useTheme } from './ThemeProvider';
import './ThemeSwitcher.css';

const ThemeSwitcher: React.FC = () => {
  const { resolvedTheme, toggle } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      className="theme-switcher"
      onClick={toggle}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="theme-icon" data-mode={resolvedTheme}>
        {resolvedTheme === 'dark' ? '🌙' : '🌞'}
      </span>
      <span className="theme-label">{resolvedTheme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
};

export default ThemeSwitcher;
