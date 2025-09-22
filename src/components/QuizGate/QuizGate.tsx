import React, { useState } from 'react';
import { CardControls } from '../CardControls/CardControls';
import { AgentSelector } from '../AgentSelector/AgentSelector';
import { AGENT_PROFILES } from '../../lib/agents';
import { AgentProfile } from '../../lib/types';
import './QuizGate.css';

type QuizGateProps = {
  onStartQuiz: (agent: AgentProfile) => void;
  onStartCustomQuiz: (agent: AgentProfile, topic: string) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const QuizGate = ({ onStartQuiz, onStartCustomQuiz, onMinimize, onClose, t }: QuizGateProps) => {
    const [customTopic, setCustomTopic] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
    const availableAgents = Object.values(AGENT_PROFILES);

    const handleCustomQuizSubmit = () => {
        if (customTopic.trim()) {
            onStartCustomQuiz(selectedAgent, customTopic.trim());
        }
    };

    return (
        <div className="quiz-gate-view">
            <div className="card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <h2>{t('quiz.ready')}</h2>
                <p>{t('quiz.generalQuizPrompt')}</p>
                
                <AgentSelector agents={availableAgents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} t={t} />

                <div className="age-options">
                    <button className="btn" onClick={() => onStartQuiz(selectedAgent)}>
                        {t('quiz.startGeneralQuiz')}
                    </button>
                </div>

                <div className="divider"><span>{t('quiz.or')}</span></div>

                <div className="custom-input-group">
                    <h3>{t('quiz.customQuizTitle')}</h3>
                    <p>{t('quiz.customQuizPrompt')}</p>
                    <input 
                        type="text" 
                        className="custom-input" 
                        placeholder={t('quiz.customQuizPlaceholder')}
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleCustomQuizSubmit()}}
                    />
                    <button 
                        className="btn" 
                        onClick={handleCustomQuizSubmit} 
                        disabled={!customTopic.trim()}
                    >
                        {t('quiz.startCustomQuiz')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizGate;