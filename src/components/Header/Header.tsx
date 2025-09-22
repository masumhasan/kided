import React from 'react';
import { BackIcon, SunIcon, MoonIcon, WorldIcon, SoundOnIcon, SoundOffIcon } from '../Icons/Icons';
import './Header.css';

type HeaderProps = {
  title: string;
  isDarkMode: boolean;
  setIsDarkMode: (on: boolean) => void;
  isTtsOn: boolean;
  onToggleTts: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  onLanguageClick: () => void;
};

export const Header = ({
  title,
  isDarkMode,
  setIsDarkMode,
  isTtsOn,
  onToggleTts,
  showBackButton,
  onBack,
  onLanguageClick,
}: HeaderProps) => {
  return (
    <header className="app-header">
      {showBackButton && (
        <button onClick={onBack} className="back-button" aria-label="Go back">
            <BackIcon />
        </button>
      )}
      <h2>{title}</h2>
      <div className="header-controls">
         <button
          className="theme-toggle"
          onClick={onToggleTts}
          aria-label="Toggle sound"
        >
          {isTtsOn ? <SoundOnIcon size={24} /> : <SoundOffIcon size={24} />}
        </button>
        <button
          className="theme-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <SunIcon size={24} /> : <MoonIcon size={24} />}
        </button>
        <button
          className="language-toggle"
          onClick={onLanguageClick}
          aria-label="Select language"
        >
          <WorldIcon size={24} />
        </button>
      </div>
    </header>
  );
};