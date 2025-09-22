import React, { useState } from 'react';
import { AgentProfile, StorySegment } from '../../lib/types';
import { StoryIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import { AgentSelector } from '../AgentSelector/AgentSelector';
import { AGENT_PROFILES } from '../../lib/agents';
import './StoryView.css';

type StoryViewProps = {
  story: StorySegment | null;
  onStart: (agent: AgentProfile, context?: string) => void;
  onChoice: (choice: string) => void;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const StoryView = ({ story, onStart, onChoice, onMinimize, onClose, t }: StoryViewProps) => {
  const [customContext, setCustomContext] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
  const availableAgents = Object.values(AGENT_PROFILES);

  const handleCustomStorySubmit = () => {
    if (customContext.trim()) {
        onStart(selectedAgent, customContext.trim());
    }
  };

  if (!story) {
    return (
      <div className="story-gate-view">
        <div className="card">
          <CardControls onMinimize={onMinimize} onClose={onClose} />
          <StoryIcon />
          <h2>{t('story.ready')}</h2>
          <p>{t('story.prompt')}</p>
          
          <AgentSelector agents={availableAgents} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} t={t} />

          <button className="btn" onClick={() => onStart(selectedAgent)} style={{width: '100%', marginTop: '1.5rem'}}>
            {t('story.start')}
          </button>

          <div className="divider"><span>{t('story.or')}</span></div>

          <div className="custom-input-group">
              <h3>{t('story.customStoryTitle')}</h3>
              <p>{t('story.customStoryPrompt')}</p>
              <input 
                  type="text" 
                  className="custom-input" 
                  placeholder={t('story.customStoryPlaceholder')}
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleCustomStorySubmit()}}
              />
              <button 
                  className="btn" 
                  onClick={handleCustomStorySubmit} 
                  disabled={!customContext.trim()}
              >
                  {t('story.startCustomStory')}
              </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="story-view">
      <div className="story-card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        <p className="story-text">{story.storyText}</p>
        <div className="story-choices">
          {story.choices.map((choice, i) => (
            <button
              key={i}
              className="btn choice-btn"
              onClick={() => onChoice(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryView;