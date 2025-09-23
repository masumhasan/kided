import React, { useState } from 'react';
import { CardControls } from '../CardControls/CardControls';
import { AgentIcon } from '../Icons/Icons';
import '../QuizGate/QuizGate.css';
import './RoundtableGate.css';

type RoundtableGateProps = {
  onStart: (question: string) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const RoundtableGate = ({ onStart, onMinimize, onClose, t }: RoundtableGateProps) => {
    const [question, setQuestion] = useState('');

    const handleSubmit = () => {
        if (question.trim()) {
            onStart(question.trim());
        }
    };

    return (
        <div className="roundtable-gate-view">
            <div className="card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <AgentIcon />
                <h2>{t('roundtable.title')}</h2>
                <p>{t('roundtable.prompt')}</p>
                
                <div className="custom-input-group" style={{marginTop: '1.5rem'}}>
                    <textarea 
                        className="custom-input" 
                        placeholder={t('roundtable.placeholder')}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={3}
                    />
                    <button 
                        className="btn" 
                        onClick={handleSubmit} 
                        disabled={!question.trim()}
                    >
                        {t('roundtable.start')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoundtableGate;
