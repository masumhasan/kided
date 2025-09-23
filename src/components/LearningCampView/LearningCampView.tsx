import React, { useState } from 'react';
import type { LearningCamp, CampProgress, CampActivity } from '../../lib/types';
import { LoadingView } from '../LoadingView/LoadingView';
import { CardControls } from '../CardControls/CardControls';
import './LearningCampView.css';

// FIX: Import types to load global JSX definitions for the 'lottie-player' custom element.
import {} from '../../lib/types';


type LearningCampViewProps = {
  camp: LearningCamp | null;
  progress: CampProgress | null;
  onAdvance: (userInput?: { type: 'text' | 'image'; data: string }) => void;
  isLoading: boolean;
  onScanRequest: () => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const LearningCampView = ({ camp, progress, onAdvance, isLoading, onScanRequest, onMinimize, onClose, t }: LearningCampViewProps) => {
    const [answered, setAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [textInput, setTextInput] = useState('');

    if (isLoading && (!camp || !progress)) {
        return <LoadingView t={t} />;
    }
    
    if (!camp || !progress) {
        return <LoadingView t={t} />;
    }
    
    const isCampFinished = progress.currentDay > camp.duration;

    if (isCampFinished) {
        return (
             <div className="camp-final-screen">
                <h2>🎉 {t('learningCamp.graduationTitle')} 🎉</h2>
                <p>{t('learningCamp.graduationMessage')}</p>
                <button className="btn" onClick={onClose}>{t('quizSummary.goHome')}</button>
            </div>
        );
    }
    
    const currentDayData = camp.days?.[progress.currentDay - 1];
    const currentActivity = currentDayData?.activities?.[progress.currentActivityIndex];

    if (!currentActivity) {
        // This can happen briefly when advancing a day or if data is malformed
        return <LoadingView t={t} />;
    }

    const handleAnswer = (selectedIndex: number) => {
        if (answered) return;
        setAnswered(true);
        if (selectedIndex === currentActivity.correctAnswerIndex) {
            setIsCorrect(true);
        }
    };

    const handleStoryChoice = (choice: string) => {
        onAdvance({ type: 'text', data: choice });
    };
    
    const handleSubmitText = () => {
        if (textInput.trim()) {
            onAdvance({ type: 'text', data: textInput });
            setTextInput('');
        }
    };

    const handleSimpleContinue = () => {
        setAnswered(false);
        setIsCorrect(false);
        onAdvance();
    };
    
    const totalActivitiesPerDay = currentDayData?.activities.length || 4;
    const activitiesCompletedToday = progress.currentActivityIndex;
    const progressPercent = (activitiesCompletedToday / totalActivitiesPerDay) * 100;

    const renderActivityBody = (activity: CampActivity) => {
        switch (activity.type) {
            case 'trail':
                return (
                    <div className="activity-trail">
                        <p className="quiz-question">{activity.question}</p>
                        <div className="quiz-options">
                            {activity.options?.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    disabled={answered}
                                    className={`quiz-option ${answered && i === activity.correctAnswerIndex ? 'correct' : ''} ${answered && !isCorrect && i !== activity.correctAnswerIndex ? 'incorrect' : ''}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'experiment':
                return (
                    <div className="activity-experiment">
                        <h4>{t('learningCamp.materials')}</h4>
                        <ul>{activity.materials?.map((m, i) => <li key={i}>{m}</li>)}</ul>
                        <h4>{t('learningCamp.steps')}</h4>
                        <ul>{activity.steps?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        <div className="explanation"><strong>{t('learningCamp.howItWorks')}</strong> {activity.explanation}</div>
                    </div>
                );
            case 'story':
                return null; // Dialogue is the body, choices are the input controls
            case 'wrap-up':
                 return (
                    <div className="activity-wrap-up">
                        <p>{t('learningCamp.badgeEarned')}</p>
                        <h3 className="badge">🏅 {activity.badgeName} 🏅</h3>
                        <p className="fun-fact"><strong>{t('learningCamp.funFact')}</strong> {activity.funFact}</p>
                    </div>
                );
            default:
                return <p>A new adventure is loading...</p>;
        }
    };
    
    const renderInputControls = (activity: CampActivity) => {
        if (isLoading) return <LoadingView t={t} />;

        // For quiz-style trails, the continue button is in the feedback overlay
        if (activity.type === 'trail' && !answered) {
            return null;
        }

        switch (activity.inputType) {
            case 'camera':
                return <button className="btn" onClick={onScanRequest}>{t('homework.scan')}</button>;
            case 'text':
                return (
                    <div className="camp-text-input-area">
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Type your creative idea here..."
                        />
                        <button className="btn" onClick={handleSubmitText} disabled={!textInput.trim()}>
                            {t('homework.getHelp')}
                        </button>
                    </div>
                );
            case 'choice': // This is now specifically for story choices
                 return (
                    <div className="activity-story quiz-options">
                        {activity.options?.map((choice, i) => (
                            <button key={i} className="btn" onClick={() => handleStoryChoice(choice)}>
                                {choice}
                            </button>
                        ))}
                    </div>
                );
            default: // This covers 'experiment' and 'wrap-up' which just need a continue button
                return <button className="btn" onClick={handleSimpleContinue}>{t('quizSummary.continue')}</button>;
        }
    };

    return (
        <div className="learning-camp-view">
            <div className="camp-card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <div className="camp-header">
                    <h2>{currentActivity.title}</h2>
                     <p>Day {progress.currentDay} of {camp.duration}</p>
                </div>
                
                <div className="camp-progress-bar">
                    <div className="camp-progress-bar-inner" style={{width: `${progressPercent}%`}}></div>
                </div>

                <div className="camp-activity-content">
                    <p className="dialogue">{currentActivity.dialogue}</p>
                    {isLoading ? <LoadingView t={t} /> : renderActivityBody(currentActivity)}
                </div>

                {!isLoading && renderInputControls(currentActivity)}

                {answered && currentActivity.type === 'trail' && (
                    <div className="camp-feedback-overlay">
                        <div className="camp-feedback-card">
                            {isCorrect && (
                                <div className="lottie-container">
                                    <lottie-player
                                        src="https://assets10.lottiefiles.com/packages/lf20_u4yrau.json"
                                        background="transparent"
                                        speed="1"
                                        autoPlay
                                    ></lottie-player>
                                </div>
                            )}
                            <h2>{isCorrect ? t('result.correct') : t('result.incorrect')}</h2>
                            <p>{currentActivity.explanation}</p>
                            <button className="btn" onClick={handleSimpleContinue}>
                                {t('quizSummary.continue')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningCampView;