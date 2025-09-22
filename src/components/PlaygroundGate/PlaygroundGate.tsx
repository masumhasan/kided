import React, { useState } from 'react';
import { CardControls } from '../CardControls/CardControls';
import { AgentSelector } from '../AgentSelector/AgentSelector';
import { EyeIcon } from '../Icons/Icons';
import { AGENT_PROFILES } from '../../lib/agents';
import { AgentProfile } from '../../lib/types';
import './PlaygroundGate.css';

type PlaygroundGateProps = {
  onStart: (agent: AgentProfile) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const PlaygroundGate = ({ onStart, onMinimize, onClose, t }: PlaygroundGateProps) => {
    const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
    const availableAgents = Object.values(AGENT_PROFILES);

    return (
        <div className="playground-gate-view">
            <div className="card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <EyeIcon />
                <h2>{t('header.playground')}</h2>
                <p>{t('playground.prompt')}</p>
                <AgentSelector agents={availableAgents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} t={t} />
                <div className="start-button-wrapper">
                    <button className="btn" onClick={() => onStart(selectedAgent)}>
                        {t('playground.start')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaygroundGate;