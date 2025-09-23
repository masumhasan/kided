import React from 'react';
import { UserProfile } from '../../lib/types';
import { QuizIcon, ObjectsIcon, StoryIcon, StarIcon, LightbulbIcon, TreasureHuntIcon, ScienceIcon } from '../Icons/Icons';
import { LoadingView } from '../LoadingView/LoadingView';
import './StaticPages.css';

type StaticPageProps = {
  t: (key: string) => string;
};

export const AboutUsScreen = ({ t }: StaticPageProps) => (
    <div className="static-page-view">
        <h2>{t('about.title')}</h2>
        <p>{t('about.mission')}</p>
        
        <h3>{t('about.featuresTitle')}</h3>
        
        <h4>{t('about.objectDetectorTitle')}</h4>
        <p>{t('about.objectDetectorText')}</p>

        <h4>{t('about.storyTimeTitle')}</h4>
        <p>{t('about.storyTimeText')}</p>

        <h4>{t('about.funQuizTitle')}</h4>
        <p>{t('about.funQuizText')}</p>

        <h4>{t('about.stickerBookTitle')}</h4>
        <p>{t('about.stickerBookText')}</p>
    </div>
);

export const TermsScreen = ({ t }: StaticPageProps) => (
    <div className="static-page-view">
        <h2>{t('terms.title')}</h2>
        <p>{t('terms.intro')}</p>
        
        <h3>{t('terms.rulesTitle')}</h3>
        <p>{t('terms.rulesText')}</p>

        <h3>{t('terms.aiTitle')}</h3>
        <p>{t('terms.aiText')}</p>

        <h3>{t('terms.safetyTitle')}</h3>
        <p>{t('terms.safetyText')}</p>

        <p>{t('terms.outro')}</p>
    </div>
);

export const PrivacyScreen = ({ t }: StaticPageProps) => (
    <div className="static-page-view">
        <h2>{t('privacy.title')}</h2>
        <p>{t('privacy.lastUpdated')}</p>
        <p>{t('privacy.intro')}</p>
        
        <h3>{t('privacy.infoTitle')}</h3>
        <p>{t('privacy.infoText1')}</p>
        <p>{t('privacy.infoText2')}</p>

        <h3>{t('privacy.cameraTitle')}</h3>
        <p>{t('privacy.cameraText')}</p>

        <h3>{t('privacy.sharingTitle')}</h3>
        <p>{t('privacy.sharingText')}</p>

        <h3>{t('privacy.parentsTitle')}</h3>
        <p>{t('privacy.parentsText')}</p>
    </div>
);


const activityIcons: { [key: string]: JSX.Element } = {
  'quiz': <QuizIcon />,
  'object-scan': <ObjectsIcon />,
  'story': <StoryIcon />,
  'treasure-hunt': <TreasureHuntIcon />,
  'learning-camp': <ScienceIcon />,
  'default': <StarIcon filled />,
};

type ParentDashboardProps = {
    profile: UserProfile | null;
    tips: string;
    isLoadingTips: boolean;
    t: (key: string) => string;
}
export const ParentDashboardView = ({ profile, tips, isLoadingTips, t }: ParentDashboardProps) => {
    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="parent-dashboard-view">
            <h2>{t('parentDashboard.title')}</h2>
            <p>{t('parentDashboard.description').replace('{name}', profile?.name || 'your child')}</p>

            <div className="dashboard-section">
                <h3><StarIcon filled /> {t('parentDashboard.timelineHeader')}</h3>
                {profile?.activityLog && profile.activityLog.length > 0 ? (
                    <ul className="timeline">
                        {profile.activityLog.map(log => (
                            <li key={log.id} className="timeline-item">
                                <div className="timeline-icon">
                                    {activityIcons[log.type] || activityIcons['default']}
                                </div>
                                <div className="timeline-content">
                                    <h4>{log.description}</h4>
                                    <p className="timestamp">{formatTimestamp(log.timestamp)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-timeline">{t('parentDashboard.emptyTimeline')}</p>
                )}
            </div>
            
            <div className="dashboard-section">
                <h3><LightbulbIcon /> {t('parentDashboard.tipsHeader')}</h3>
                {isLoadingTips ? (
                    <LoadingView t={t} />
                ) : (
                    <div className="tips-content" dangerouslySetInnerHTML={{ __html: tips.replace(/\*/g, '').replace(/\n/g, '<br />') }} />
                )}
            </div>
        </div>
    );
};

const StaticPages: React.FC & {
    AboutUsScreen: typeof AboutUsScreen;
    TermsScreen: typeof TermsScreen;
    PrivacyScreen: typeof PrivacyScreen;
    ParentDashboardView: typeof ParentDashboardView;
} = () => null;

StaticPages.AboutUsScreen = AboutUsScreen;
StaticPages.TermsScreen = TermsScreen;
StaticPages.PrivacyScreen = PrivacyScreen;
StaticPages.ParentDashboardView = ParentDashboardView;

export default StaticPages;