import React, { useState } from 'react';
import { AgentProfile, HomeworkMode } from '../../lib/types';
import { QuizIcon, ObjectsIcon, StoryIcon, LightbulbIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import { AgentSelector } from '../AgentSelector/AgentSelector';
import { AGENT_PROFILES } from '../../lib/agents';
import './HomeworkGate.css';

type HomeworkGateProps = {
  onSelectMode: (agent: AgentProfile, mode: HomeworkMode) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const HomeworkGate = ({ onSelectMode, onMinimize, onClose, t }: HomeworkGateProps) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
  const availableAgents = Object.values(AGENT_PROFILES).filter(agent => agent.name !== 'MrBeast');
  
  const modes: { mode: HomeworkMode; icon: JSX.Element; label: string }[] = [
    { mode: 'math', icon: <QuizIcon />, label: t('homework.math') },
    { mode: 'science', icon: <ObjectsIcon />, label: t('homework.science') },
    { mode: 'essay', icon: <StoryIcon />, label: t('homework.essay') },
    { mode: 'general', icon: <LightbulbIcon />, label: t('homework.general') },
  ];

  return (
    <div className="homework-gate-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <h2>{t('homework.title')}</h2>
        <p>{t('homework.prompt')}</p>
        
        <AgentSelector agents={availableAgents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} t={t} />

        <div className="homework-modes-grid">
          {modes.map(({ mode, icon, label }) => (
            <div
              key={mode}
              className="homework-mode-card"
              onClick={() => onSelectMode(selectedAgent, mode)}
            >
              {icon}
              <h3>{label}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeworkGate;
