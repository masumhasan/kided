import React, { useEffect, useRef } from 'react';
import { AgentProfile, AgentAvatarState, ChatMessage } from '../../lib/types';
import { BackIcon, VideoOnIcon, VideoOffIcon, SendIcon } from '../Icons/Icons';
import './VoiceAssistantView.css';

type ChatHeaderProps = {
    agent: AgentProfile;
    onBack: () => void;
    isCameraEnabled: boolean;
    setIsCameraEnabled: (enabled: boolean) => void;
    t: (key: string) => string;
}

const ChatHeader = ({ agent, onBack, isCameraEnabled, setIsCameraEnabled, t }: ChatHeaderProps) => (
    <header className="va-header">
        <button onClick={onBack} className="va-back-btn" aria-label="Go back">
            <BackIcon />
        </button>
        <div className="va-header-info">
            <h2>{t(`voiceAssistant.${agent.name}`)}</h2>
        </div>
        <div className="va-header-controls">
            <button className="va-header-btn" onClick={() => setIsCameraEnabled(!isCameraEnabled)}>
                {isCameraEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
            </button>
        </div>
    </header>
);


type VoiceAssistantViewProps = {
    agent: AgentProfile;
    history: ChatMessage[];
    avatarState: AgentAvatarState;
    isCameraEnabled: boolean;
    setIsCameraEnabled: (enabled: boolean) => void;
    localVideoEl: React.RefObject<HTMLVideoElement>;
    onSendMessage: (message: string) => void;
    onBack: () => void;
    t: (key: string) => string;
    inputText: string;
    setInputText: (text: string) => void;
};

const VoiceAssistantView = ({
    agent,
    history,
    avatarState,
    isCameraEnabled,
    setIsCameraEnabled,
    localVideoEl,
    onSendMessage,
    onBack,
    t,
    inputText,
    setInputText,
}: VoiceAssistantViewProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);
    
    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText.trim());
            setInputText('');
        }
    };
    
    return (
        <div className="voice-assistant-view">
            <ChatHeader 
                agent={agent} 
                onBack={onBack}
                isCameraEnabled={isCameraEnabled}
                setIsCameraEnabled={setIsCameraEnabled}
                t={t}
            />
            
            <div className="va-messages-container">
                {history.map((msg, i) => (
                    <div key={i} className={`va-chat-bubble-wrapper ${msg.sender}`}>
                        <div className="va-chat-bubble">{msg.text}</div>
                    </div>
                ))}
                 {avatarState === 'thinking' && (
                     <div className="va-chat-bubble-wrapper buddy">
                         <div className="va-chat-bubble typing-indicator">
                             <span></span><span></span><span></span>
                         </div>
                     </div>
                 )}
                <div ref={messagesEndRef} />
            </div>

            <div className="va-input-area">
                <input
                    type="text"
                    className="va-text-input"
                    placeholder={t('chat.placeholder')}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => { if (e.key === "Enter") handleSend(); }}
                />
                <button 
                    onClick={handleSend} 
                    className="va-send-btn" 
                    aria-label="Send message"
                    disabled={!inputText.trim()}
                >
                    <SendIcon />
                </button>
            </div>

            {/* Hidden video element for frame capture */}
            <video 
                ref={localVideoEl} 
                muted 
                playsInline 
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default VoiceAssistantView;