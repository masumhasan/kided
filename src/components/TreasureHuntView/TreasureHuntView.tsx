import React from 'react';
import { TreasureHunt } from '../../lib/types';
import { LoadingView } from '../LoadingView/LoadingView';
import { CardControls } from '../CardControls/CardControls';
import './TreasureHuntView.css';

type TreasureHuntViewProps = {
  hunt: TreasureHunt | null;
  onScanRequest: () => void;
  feedback: string | null;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const TreasureHuntView = ({ hunt, onScanRequest, feedback, onPlayAgain, onGoHome, onMinimize, onClose, t }: TreasureHuntViewProps) => {
  if (!hunt) {
    return <LoadingView t={t} />;
  }

  if (hunt.isComplete) {
    return (
        <div className="quiz-results-view">
            <div className="card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <h2>{t('treasureHunt.completeTitle')}</h2>
                <p>{t('treasureHunt.completeMessage')}</p>
                <div className="action-buttons">
                    <button className="btn" onClick={onPlayAgain}>{t('treasureHunt.playAgain')}</button>
                    <button className="btn btn-secondary" onClick={onGoHome}>{t('treasureHunt.goHome')}</button>
                </div>
            </div>
        </div>
    );
  }

  const currentClue = hunt.clues[hunt.currentClueIndex];

  return (
    <div className="result-view">
        <div className="response-card">
            <CardControls onMinimize={onMinimize} onClose={onClose} />
            <h2>{t('treasureHunt.clue').replace('{current}', String(hunt.currentClueIndex + 1)).replace('{total}', String(hunt.clues.length))}</h2>
            <p className="quiz-question">{currentClue.clueText}</p>
            
            {feedback && (
                <div className="sound-suggestion">
                    {feedback}
                </div>
            )}

            <button className="btn" onClick={onScanRequest}>
                {t('treasureHunt.foundItButton')}
            </button>
        </div>
    </div>
  );
};

export default TreasureHuntView;