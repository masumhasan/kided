import React from 'react';
import { Screen, ActiveTab } from '../../lib/types';
import { HomeIcon, ObjectsIcon, StoryIcon, QuizIcon, RewardsIcon, MicIcon, LightbulbIcon, EyeIcon, ProfileIcon, TreasureHuntIcon, ScienceIcon } from '../Icons/Icons';
import './Sidebar.css';


type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
  onFeatureNav: (tab: ActiveTab) => void;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  t: (key: string) => string;
};

const FeatureItem = ({ icon, label, onClick }: { icon: JSX.Element, label: string, onClick: () => void }) => (
    <a onClick={onClick} className="sidebar-feature-item">
        <div className="sidebar-feature-icon">{icon}</div>
        <span>{label}</span>
    </a>
);


export const Sidebar = ({ isOpen, onClose, onNavigate, onFeatureNav, isAuthenticated, onSignIn, onSignOut, t }: SidebarProps) => {
    
    const features: { tab: ActiveTab; icon: JSX.Element; label: string }[] = [
        { tab: 'Home', icon: <HomeIcon />, label: t('nav.home') },
        { tab: 'Object Scan', icon: <ObjectsIcon />, label: t('nav.objectScan') },
        { tab: 'Learning Camp', icon: <ScienceIcon />, label: t('nav.learningCamp') },
        { tab: 'Voice Assistant', icon: <MicIcon />, label: t('nav.voiceAssistant') },
        { tab: 'Playground', icon: <EyeIcon />, label: t('nav.playground') },
        { tab: 'Treasure Hunt', icon: <TreasureHuntIcon />, label: t('nav.treasureHunt') },
        { tab: 'Story', icon: <StoryIcon />, label: t('nav.story') },
        { tab: 'Homework', icon: <LightbulbIcon />, label: t('nav.homework') },
        { tab: 'Quiz', icon: <QuizIcon />, label: t('nav.quiz') },
        { tab: 'Rewards', icon: <RewardsIcon />, label: t('nav.rewards') },
    ];
    
    const handleStaticNavClick = (screen: Screen) => {
        onNavigate(screen);
        onClose();
    };

    const handleFeatureClick = (tab: ActiveTab) => {
        onFeatureNav(tab);
        onClose();
    };

    const handleSignOutClick = () => {
        onSignOut();
        onClose();
    }
    
    const handleSignInClick = () => {
        onSignIn();
        onClose();
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>{t('sidebar.menu')}</h3>
                    <button onClick={onClose}>&times;</button>
                </div>

                <div className="sidebar-section">
                    <h4>{t('sidebar.features')}</h4>
                    <nav className="sidebar-nav features">
                        {features.map(feature => (
                           <FeatureItem
                                key={feature.tab}
                                icon={feature.icon}
                                label={feature.label}
                                onClick={() => handleFeatureClick(feature.tab)}
                           />
                        ))}
                    </nav>
                </div>
                
                <div className="sidebar-section">
                     <h4>{t('sidebar.settings')}</h4>
                    <nav className="sidebar-nav static">
                        <a onClick={() => handleStaticNavClick('parent-dashboard')} className="sidebar-feature-item">
                            <div className="sidebar-feature-icon"><ProfileIcon /></div>
                            <span>{t('sidebar.parentDashboard')}</span>
                        </a>
                        <a onClick={() => handleStaticNavClick('profile')} className="sidebar-feature-item">
                             <div className="sidebar-feature-icon"><ProfileIcon /></div>
                            <span>{t('sidebar.profile')}</span>
                        </a>
                        <a onClick={() => handleStaticNavClick('about')}>{t('sidebar.about')}</a>
                        <a onClick={() => handleStaticNavClick('terms')}>{t('sidebar.terms')}</a>
                        <a onClick={() => handleStaticNavClick('privacy')}>{t('sidebar.privacy')}</a>
                         {isAuthenticated ? (
                            <a onClick={handleSignOutClick} className="sidebar-feature-item">
                                <span>{t('sidebar.signOut')}</span>
                            </a>
                        ) : (
                            <a onClick={handleSignInClick} className="sidebar-feature-item">
                                <span>{t('sidebar.signIn')}</span>
                            </a>
                        )}
                    </nav>
                </div>
            </div>
        </>
    );
};