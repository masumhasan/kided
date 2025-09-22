import React from 'react';
import { CardControls } from '../CardControls/CardControls';
import './QuizSummaryView.css';

type QuizSummaryViewProps = {
  correctAnswers: number;
  totalQuestions: number;
  level: number;
  onContinue: () => void;
  onGoHome: () => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const QuizSummaryView = ({
  correctAnswers,
  totalQuestions,
  level,
  onContinue,
  onGoHome,
  onMinimize,
  onClose,
  t
}: QuizSummaryViewProps) => (
  <div className="quiz-results-view">
    <div className="card">
      <CardControls onMinimize={onMinimize} onClose={onClose} />
      <h2>{t('quizSummary.levelComplete').replace('{level}', String(level - 1))}</h2>
      <p>
        {t('quizSummary.summary').replace('{correct}', String(correctAnswers)).replace('{total}', String(totalQuestions))}
      </p>
      <h3>{t('quizSummary.levelUp').replace('{level}', String(level))}</h3>
      <div className="action-buttons">
        <button className="btn" onClick={onContinue}>
          {t('quizSummary.continue')}
        </button>
        <button className="btn btn-secondary" onClick={onGoHome}>
          {t('quizSummary.goHome')}
        </button>
      </div>
    </div>
  </div>
);

export default QuizSummaryView;