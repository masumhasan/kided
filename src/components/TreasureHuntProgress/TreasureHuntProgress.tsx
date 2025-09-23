import React from 'react';
import { __FORCE_MODULE_EVALUATION } from '../../lib/types';
import './TreasureHuntProgress.css';

// This line ensures the import is not tree-shaken, making JSX types available.
if (false) console.log(__FORCE_MODULE_EVALUATION);

type TreasureHuntProgressProps = {
    current: number;
    total: number;
    t: (key: string) => string;
};

export const TreasureHuntProgress = ({ current, total, t }: TreasureHuntProgressProps) => {
    const isComplete = current === total;

    return (
        <div className="treasure-hunt-progress-overlay">
            <div className={`treasure-hunt-progress-card ${isComplete ? 'complete' : ''}`}>
                {isComplete && (
                     <lottie-player
                        src="https://assets10.lottiefiles.com/packages/lf20_u4yrau.json"
                        background="transparent"
                        speed="1"
                        autoPlay
                    ></lottie-player>
                )}
                <h2>{isComplete ? t('treasureHunt.objectiveComplete') : t('treasureHunt.objectiveFound')}</h2>
                <p className="progress-text">{current} / {total}</p>
                <p className="progress-label">{t('treasureHunt.found')}</p>
            </div>
        </div>
    );
};