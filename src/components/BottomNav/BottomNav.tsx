import React from 'react';
import { ActiveTab } from '../../lib/types';
// FIX: Imported ProfileIcon to use for the Parent Dashboard navigation item.
import { HomeIcon, ObjectsIcon, StoryIcon, QuizIcon, MenuIcon, LightbulbIcon, MicIcon, RewardsIcon, EyeIcon, TreasureHuntIcon, ScienceIcon, ProfileIcon } from '../Icons/Icons';
import './BottomNav.css';

type BottomNavProps = {
  activeTab: ActiveTab;
  onNav: (tab: ActiveTab) => void;
  t: (key: string) => string;
};

export const BottomNav = ({ activeTab, onNav, t }: BottomNavProps) => {
  const navItems: ActiveTab[] = [
    "Home",
    "Object Scan",
    "Voice Assistant",
    "Treasure Hunt",
    "Quiz",
    "Menu",
  ];
  // FIX: Added 'Parent Dashboard' to the Exclude utility type to prevent a type error, as it's not part of the visible bottom navigation.
  const itemLabels: { [key in Exclude<ActiveTab, 'Chat' | 'Rewards' | 'Story' | 'Homework' | 'Playground' | 'Learning Camp' | 'Parent Dashboard'>]: string } = {
    Home: t('nav.home'),
    "Object Scan": t('nav.objectScan'),
    Quiz: t('nav.quiz'),
    Menu: t('nav.menu'),
    "Voice Assistant": t('nav.voiceAssistant'),
    "Treasure Hunt": t('nav.treasureHunt'),
  };
  // FIX: Added 'Parent Dashboard' with a corresponding icon to the icons map to satisfy the ActiveTab type.
  const icons: { [key in ActiveTab]: JSX.Element } = {
    Home: <HomeIcon />,
    "Object Scan": <ObjectsIcon />,
    Story: <StoryIcon />,
    Quiz: <QuizIcon />,
    Rewards: <RewardsIcon />,
    Menu: <MenuIcon />,
    Homework: <LightbulbIcon />,
    "Voice Assistant": <MicIcon />,
    Playground: <EyeIcon />,
    "Treasure Hunt": <TreasureHuntIcon />,
    "Learning Camp": <ScienceIcon />,
    "Parent Dashboard": <ProfileIcon />,
  };
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <a
          key={item}
          className={`nav-item ${activeTab === item ? "active" : ""}`}
          onClick={() => onNav(item)}
        >
          {icons[item]}
          <span>{itemLabels[item]}</span>
        </a>
      ))}
    </nav>
  );
};
