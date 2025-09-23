import React, { useState, useEffect, useRef } from 'react';
import { RoundtableResponse, RoundtableTurn, RoundtableAgentName } from '../../lib/types';
import './RoundtableView.css';

type RoundtableViewProps = {
  response: RoundtableResponse | null;
  onHome: () => void;
  speak: (text: string, onEndCallback: () => void) => void;
  t: (key: string) => string;
};

const agentColors: Record<RoundtableAgentName, string> = {
    Adam: '#FBB03B',
    Eva: '#D4145A',
    MarkRober: '#009688',
};

const AgentAvatar = ({ agentName }: { agentName: RoundtableAgentName }) => (
    <div className="rt-avatar" style={{ backgroundColor: agentColors[agentName] || '#ccc' }}>
        {agentName.charAt(0)}
    </div>
);

const RoundtableView = ({ response, onHome, speak, t }: RoundtableViewProps) => {
    const [displayedTurns, setDisplayedTurns] = useState<RoundtableTurn[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasStartedSpeakingRef = useRef(false);

    useEffect(() => {
        if (response && !hasStartedSpeakingRef.current) {
            hasStartedSpeakingRef.current = true;

            const speakNextTurn = (turnIndex: number) => {
                // Base case: All turns have been spoken
                if (turnIndex >= response.discussion.length) {
                    setIsComplete(true);
                    if (response.finalAnswer) {
                        speak(t('roundtable.finalAnswer') + '. ' + response.finalAnswer, () => {});
                    }
                    return;
                }

                // Recursive step: Display and speak the current turn
                const nextTurn = response.discussion[turnIndex];
                setDisplayedTurns(prev => [...prev, nextTurn]);

                // When speech finishes, call the next turn after a short pause
                speak(nextTurn.dialogue, () => {
                    setTimeout(() => speakNextTurn(turnIndex + 1), 1500); // 1.5s pause
                });
            };

            // Start the conversation chain
            speakNextTurn(0);
        }
    }, [response, speak, t]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [displayedTurns, isComplete]);

    if (!response) {
        return null; // Or a loading state
    }

    return (
        <div className="roundtable-view">
            <div className="rt-header">
                <h3>{t('roundtable.discussionTitle')}</h3>
            </div>
            <div className="rt-messages-container">
                {displayedTurns.map((turn, index) => (
                    <div key={index} className="rt-chat-bubble-wrapper">
                        <AgentAvatar agentName={turn.agentName} />
                        <div className="rt-chat-bubble">
                            <strong>{turn.agentName}</strong>
                            <p>{turn.dialogue}</p>
                        </div>
                    </div>
                ))}
                {!isComplete && displayedTurns.length < response.discussion.length && (
                    <div className="rt-chat-bubble-wrapper typing">
                        <div className="rt-chat-bubble typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>

            {isComplete && (
                <div className="rt-final-answer-card">
                    <h4>{t('roundtable.finalAnswer')}</h4>
                    <p>{response.finalAnswer}</p>
                    <button className="btn" onClick={onHome} style={{marginTop: '1rem'}}>
                        {t('quizSummary.goHome')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoundtableView;