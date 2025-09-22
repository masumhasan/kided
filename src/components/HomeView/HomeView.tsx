import React from 'react';
import { UserProfile, ActiveTab } from '../../lib/types';
import { StarIcon, ObjectsIcon, StoryIcon, QuizIcon, RewardsIcon, LightbulbIcon, MicIcon, EyeIcon, XPIcon, TreasureHuntIcon, ScienceIcon } from '../Icons/Icons';
import './HomeView.css';

type HomeViewProps = {
  userProfile: UserProfile | null;
  onNavigate: (tab: ActiveTab) => void;
  t: (key: string) => string;
};

const HomeView = ({ userProfile, onNavigate, t }: HomeViewProps) => {
    const progress = userProfile?.progress || { stars: 0, objectsDiscovered: 0, xp: 0 };
    const name = userProfile?.name || null;
    
    return (
      <div className="home-view">
        <div className="greeting">
          <h2>{name ? t('home.greetingPersonalized').replace('{name}', name) : t('home.greeting')}</h2>
          <p>{t('home.prompt')}</p>
        </div>
        <div className="progress-summary-card">
          <div className="summary-item">
            <StarIcon filled />
            <div>
              <h3>{progress.stars}</h3>
              <p>{t('home.stars')}</p>
            </div>
          </div>
          <div className="summary-item">
            <ObjectsIcon />
            <div>
              <h3>{progress.objectsDiscovered}</h3>
              <p>{t('home.stickers')}</p>
            </div>
          </div>
           <div className="summary-item">
            <XPIcon />
            <div>
              <h3>{progress.xp}</h3>
              <p>{t('home.xp')}</p>
            </div>
          </div>
        </div>
        <div className="feature-nav">
          <div className="feature-card" onClick={() => onNavigate("Object Scan")}>
            <div className="feature-icon-wrapper scan">
              <ObjectsIcon />
            </div>
            <div>
              <h3>{t('home.objectDetector')}</h3>
              <p>{t('home.objectDesc')}</p>
            </div>
          </div>
           <div className="feature-card" onClick={() => onNavigate("Learning Camp")}>
            <div className="feature-icon-wrapper camp">
              <ScienceIcon />
            </div>
            <div>
              <h3>{t('home.learningCamp')}</h3>
              <p>{t('home.learningCampDesc')}</p>
            </div>
          </div>
           <div className="feature-card" onClick={() => onNavigate("Treasure Hunt")}>
            <div className="feature-icon-wrapper rewards">
              <TreasureHuntIcon />
            </div>
            <div>
              <h3>{t('home.treasureHunt')}</h3>
              <p>{t('home.treasureHuntDesc')}</p>
            </div>
          </div>
          <div className="feature-card" onClick={() => onNavigate("Story")}>
            <div className="feature-icon-wrapper story">
              <StoryIcon />
            </div>
            <div>
              <h3>{t('home.storyTime')}</h3>
              <p>{t('home.storyDesc')}</p>
            </div>
          </div>
           <div className="feature-card" onClick={() => onNavigate("Voice Assistant")}>
            <div className="feature-icon-wrapper voice-assistant">
              <MicIcon />
            </div>
            <div>
              <h3>{t('home.voiceAssistant')}</h3>
              <p>{t('home.voiceAssistantDesc')}</p>
            </div>
          </div>
          <div className="feature-card" onClick={() => onNavigate("Playground")}>
            <div className="feature-icon-wrapper playground">
              <EyeIcon />
            </div>
            <div>
              <h3>{t('home.playground')}</h3>
              <p>{t('home.playgroundDesc')}</p>
            </div>
          </div>
           <div className="feature-card" onClick={() => onNavigate("Homework")}>
            <div className="feature-icon-wrapper homework">
              <LightbulbIcon />
            </div>
            <div>
              <h3>{t('home.homework')}</h3>
              <p>{t('home.homeworkDesc')}</p>
            </div>
          </div>
          <div className="feature-card" onClick={() => onNavigate("Quiz")}>
            <div className="feature-icon-wrapper quiz">
              <QuizIcon />
            </div>
            <div>
              <h3>{t('home.funQuiz')}</h3>
              <p>{t('home.funQuizDesc')}</p>
            </div>
          </div>
          <div className="feature-card" onClick={() => onNavigate("Rewards")}>
            <div className="feature-icon-wrapper rewards">
              <RewardsIcon />
            </div>
            <div>
              <h3>{t('home.stickerBook')}</h3>
              <p>{t('home.stickerBookDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    );
}

export default HomeView;