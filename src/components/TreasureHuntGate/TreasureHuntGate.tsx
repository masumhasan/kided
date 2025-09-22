import React, { useState } from 'react';
import { AgentProfile } from '../../lib/types';
import { TreasureHuntIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import { AgentSelector } from '../AgentSelector/AgentSelector';
import { AGENT_PROFILES } from '../../lib/agents';
import './TreasureHuntGate.css';

type TreasureHuntGateProps = {
  onStart: (agent: AgentProfile) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const TreasureHuntGate = ({ onStart, onMinimize, onClose, t }: TreasureHuntGateProps) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
  const availableAgents = Object.values(AGENT_PROFILES);

  return (
    <div className="quiz-gate-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <TreasureHuntIcon />
        <h2>{t('treasureHunt.title')}</h2>
        <p>{t('treasureHunt.prompt')}</p>
        <AgentSelector agents={availableAgents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} t={t} />
        <button className="btn" onClick={() => onStart(selectedAgent)}>
          {t('treasureHunt.startButton')}
        </button>
      </div>
    </div>
  );
};

export default TreasureHuntGate;