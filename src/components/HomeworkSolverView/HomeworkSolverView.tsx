import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, HomeworkMode } from '../../lib/types';
import { LoadingView } from '../LoadingView/LoadingView';
import { ObjectsIcon, SendIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import './HomeworkSolverView.css';

type HomeworkSolverViewProps = {
  mode: HomeworkMode;
  onGenerateSolution: (input: { text?: string; image?: { data: string; mimeType: string } }) => void;
  onScanRequest: () => void;
  chatHistory: ChatMessage[];
  onSendFollowup: (message: string) => void;
  isLoading: boolean;
  onMinimize: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const HomeworkSolverView = ({
  mode,
  onGenerateSolution,
  onScanRequest,
  chatHistory,
  onSendFollowup,
  isLoading,
  onMinimize,
  onClose,
  t,
}: HomeworkSolverViewProps) => {
  const [inputText, setInputText] = useState('');
  const [followupText, setFollowupText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const parseAndRenderText = (text: string) => {
      const formattedText = text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br />');
      return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onGenerateSolution({ image: { data: base64String, mimeType: file.type } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (inputText.trim()) {
      onGenerateSolution({ text: inputText });
    }
  };
  
  const handleSendFollowup = () => {
    if (followupText.trim()) {
      onSendFollowup(followupText);
      setFollowupText('');
    }
  };

  return (
    <div className="homework-solver-view">
      <div className="card">
        <CardControls onMinimize={onMinimize} onClose={onClose} />
        
        {chatHistory.length === 0 && !isLoading && (
          <div className="homework-input-area">
            <textarea
              placeholder={t('homework.textPlaceholder')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="homework-input-options">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
              />
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('homework.upload')}
              </button>
              <button className="btn btn-secondary" onClick={onScanRequest}>
                <ObjectsIcon /> {t('homework.scan')}
              </button>
            </div>
            <button className="btn" onClick={handleSubmit} disabled={!inputText.trim()}>
              {t('homework.getHelp')}
            </button>
          </div>
        )}

        {isLoading && chatHistory.length === 0 && <LoadingView t={t} />}

        {chatHistory.length > 0 && (
          <div className="homework-solution-area">
            <h3>{t('homework.solutionTitle')}</h3>
            <div className="homework-chat-container">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`hw-chat-bubble-wrapper ${msg.sender}`}>
                  <div className="hw-chat-bubble">
                    {parseAndRenderText(msg.text)}
                  </div>
                </div>
              ))}
              {isLoading && chatHistory[chatHistory.length - 1]?.sender === 'user' && (
                <div className="hw-chat-bubble-wrapper buddy">
                  <div className="hw-chat-bubble typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="followup-input-area">
              <input
                type="text"
                className="followup-input"
                placeholder={t('homework.followupPlaceholder')}
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') handleSendFollowup(); }}
                disabled={isLoading}
              />
              <button onClick={handleSendFollowup} className="btn-send-followup" disabled={!followupText.trim() || isLoading}>
                 <SendIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkSolverView;