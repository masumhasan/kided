import React, { useState } from 'react';
import { AgentProfile } from '../../lib/types';
import { ObjectsIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import { AgentSelector } from '../AgentSelector/AgentSelector';
import { AGENT_PROFILES } from '../../lib/agents';
import './ObjectDetectorGate.css';

type ObjectDetectorGateProps = {
  onStart: (agent: AgentProfile) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const ObjectDetectorGate = ({ onStart, onMinimize, onClose, t }: ObjectDetectorGateProps) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
  const availableAgents = Object.values(AGENT_PROFILES);

  return (
    <div className="quiz-gate-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <ObjectsIcon />
        <h2>{t('media.gateTitle')}</h2>
        <p>{t('media.gatePrompt')}</p>
        <AgentSelector agents={availableAgents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} t={t} />
        <button className="btn" onClick={() => onStart(selectedAgent)}>
          {t('media.scanButton')}
        </button>
      </div>
    </div>
  );
};

export default ObjectDetectorGate;