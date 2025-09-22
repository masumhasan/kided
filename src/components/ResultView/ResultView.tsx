import React from 'react';
import { LearningBuddyResponse, MediaType } from '../../lib/types';
import { CardControls } from '../CardControls/CardControls';
import './ResultView.css';

type ResultViewProps = {
  response: LearningBuddyResponse | null;
  media: { type: MediaType; data: string };
  onAnswer: (index: number) => void;
  answered: boolean;
  correct: boolean;
  onNext: () => void;
  isInQuizSession: boolean;
  isLastQuestion: boolean;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const ResultView = ({
  response,
  media,
  onAnswer,
  answered,
  correct,
  onNext,
  isInQuizSession,
  isLastQuestion,
  onMinimize,
  onClose,
  t
}: ResultViewProps) => {
  if (!response) return null;
  const {
    identification,
    funFacts,
    soundSuggestion,
    quiz,
    encouragement,
  } = response;
  return (
    <div className="result-view">
      <div className="response-card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        {!isInQuizSession && media.data && media.type === "image" && (
          <img
            src={`data:image/jpeg;base64,${media.data}`}
            alt={identification}
            className="result-image"
          />
        )}

        <h2>{identification}</h2>

        {funFacts.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h3>{t('result.funFacts')}</h3>
            </div>
            <ul>
              {funFacts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
          </div>
        )}

        {soundSuggestion && (
          <p className="sound-suggestion">
            {t('result.soundSuggestion')} <strong>{soundSuggestion}</strong>
          </p>
        )}

        <div className="section">
          <div className="section-header">
            <h3>{t('result.quickQuiz')}</h3>
          </div>
          <p className="quiz-question">{quiz.question}</p>
          <div className="quiz-options">
            {quiz.options.map((option, i) => (
              <button
                key={i}
                onClick={() => onAnswer(i)}
                disabled={answered}
                className={`quiz-option ${
                  answered && i === quiz.correctAnswerIndex ? "correct" : ""
                } ${
                  answered && !correct && i !== quiz.correctAnswerIndex
                    ? "incorrect"
                    : ""
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {answered && (
            <div className="quiz-feedback">
              <h3>
                {correct ? t('result.correct') : t('result.incorrect')}
                <img
                  src={
                    correct
                      ? "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif"
                      : "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif"
                  }
                  alt={correct ? "celebrating emoji" : "hugging emoji"}
                  width="40"
                  height="40"
                />
              </h3>
            </div>
          )}
        </div>
        {answered && (
          <button onClick={onNext} className="btn">
            {isInQuizSession
              ? isLastQuestion
                ? t('result.finishQuiz')
                : t('result.nextQuestion')
              : t('result.nextAdventure')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultView;