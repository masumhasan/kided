import React from 'react';
import { CardControls } from '../CardControls/CardControls';
import './LearningCampGate.css';

type LearningCampGateProps = {
  onStart: (duration: number) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const LearningCampGate = ({ onStart, onMinimize, onClose, t }: LearningCampGateProps) => {
  return (
    <div className="learning-camp-gate-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <div className="host-info">
            <h3>{t('learningCamp.hostedBy')}</h3>
            <h2>{t('voiceAssistant.MarkRober')}</h2>
        </div>
        <p>{t('learningCamp.welcome')}</p>
        <div className="camp-duration-options">
            <button className="btn" onClick={() => onStart(1)}>
                {t('learningCamp.oneDay')}
            </button>
            <button className="btn btn-secondary" onClick={() => onStart(3)}>
                {t('learningCamp.threeDay')}
            </button>
            <button className="btn btn-secondary" onClick={() => onStart(7)}>
                {t('learningCamp.sevenDay')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LearningCampGate;