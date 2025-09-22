import React from 'react';
import './WelcomeScreen.css';

type WelcomeScreenProps = {
  onStart: () => void;
  t: (key: string) => string;
};

const WelcomeScreen = ({ onStart, t }: WelcomeScreenProps) => (
  <div className="welcome-screen">
    <img
      src="https://raw.githubusercontent.com/masumhasan/eduplay/refs/heads/main/images/edubot.gif"
      alt="KidEd Mascot"
      className="robot-illustration"
    />
    <h1>{t('welcome.title')}</h1>
    <p className="tagline">{t('welcome.tagline')}</p>
    <button onClick={onStart} className="btn btn-start">
      <svg width="24" height="24" viewBox="0 0 24" fill="currentColor">
        <path d="M8 5v14l11-7z"></path>
      </svg>
      {t('welcome.startButton')}
    </button>
    <p className="subtitle">{t('welcome.subtitle')}</p>
  </div>
);

export default WelcomeScreen;