import React from 'react';
import { AgentProfile } from '../../lib/types';
import { AGENT_PROFILES } from '../../lib/agents';
import './VoiceAssistantGate.css';

type VoiceAssistantGateProps = {
    onAgentSelect: (agent: AgentProfile) => void;
    onMinimize: () => void;
    onClose: () => void;
    t: (key: string) => string;
};

const VoiceAssistantGate = ({ onAgentSelect, onMinimize, onClose, t }: VoiceAssistantGateProps) => (
    <div className="voice-assistant-gate-view">
        <ul className="agent-list">
            {Object.values(AGENT_PROFILES).map(agent => (
                <li key={agent.name} className="agent-list-item" onClick={() => onAgentSelect(agent)}>
                    <div className="agent-list-info">
                        <h3>{t(`voiceAssistant.${agent.name}`)}</h3>
                        <p>{t(`voiceAssistant.${agent.descriptionKey}`)}</p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

export default VoiceAssistantGate;