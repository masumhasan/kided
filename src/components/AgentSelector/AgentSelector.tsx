import React from 'react';
import { AgentProfile } from '../../lib/types';
import './AgentSelector.css';

type AgentSelectorProps = {
    agents: AgentProfile[];
    selectedAgent: AgentProfile;
    onSelectAgent: (agent: AgentProfile) => void;
    t: (key: string) => string;
};

export const AgentSelector = ({ agents, selectedAgent, onSelectAgent, t }: AgentSelectorProps) => {
    return (
        <div className="agent-selector">
            <h4>{t('agentSelector.title')}</h4>
            <div className="agent-options">
                {agents.map(agent => (
                    <div
                        key={agent.name}
                        className={`agent-option ${selectedAgent.name === agent.name ? 'selected' : ''}`}
                        onClick={() => onSelectAgent(agent)}
                        role="button"
                        aria-pressed={selectedAgent.name === agent.name}
                        tabIndex={0}
                        onKeyPress={(e) => { if (e.key === 'Enter') onSelectAgent(agent)}}
                    >
                        <span>{t(`voiceAssistant.${agent.name}`)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};