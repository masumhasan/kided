
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Part } from "@google/genai";
import { AgentProfile, AgentName, AgentAvatarState, ChatMessage } from '../../lib/types';
import { AGENT_PROFILES } from '../../lib/agents';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { MicOnIcon, MicOffIcon, SettingsIcon, HangUpIcon, SendIcon } from '../Icons/Icons';
import './VoiceRoomView.css';

type VoiceRoomViewProps = {
  ai: GoogleGenAI;
  userProfile: any;
  language: 'en' | 'bn';
  speak: (text: string, lang: 'en' | 'bn', onEnd: () => void) => void;
  onClose: () => void;
  t: (key: string) => string;
};

const VoiceRoomView = ({ ai, userProfile, language, speak, onClose, t }: VoiceRoomViewProps) => {
  const [activeAgent, setActiveAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
  const [agentState, setAgentState] = useState<AgentAvatarState>('listening');
  const [transcription, setTranscription] = useState<ChatMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const handleSpeechResult = useCallback((transcript: string) => {
    if (agentState !== 'listening') return;

    setTranscription(prev => [...prev, { sender: 'user', text: transcript }]);
    setAgentState('thinking');
    
    // Capture a frame and send to AI
    captureFrame(videoRef).then(framePart => {
      processAiTurn(transcript, framePart);
    });
  }, [agentState]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    language,
  });

  const processAiTurn = async (text: string, imagePart: Part | null) => {
    try {
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const age = userProfile ? new Date().getFullYear() - new Date(userProfile.dob).getFullYear() : 6;
      
      const prompt = `You are observing a scene through a camera and listening to a user. The user is a ${age}-year-old child. They said: "${text}". Based on both the image and what they said, provide a short, engaging response in ${langName}. Be curious and conversational.`;
      
      const contents: { parts: Part[] } = { parts: [{ text: prompt }] };
      if (imagePart) {
        contents.parts.push(imagePart);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction: activeAgent.systemInstruction },
      });

      const aiResponseText = response.text;
      setTranscription(prev => [...prev, { sender: 'buddy', text: aiResponseText }]);
      setAgentState('speaking');
      speak(aiResponseText, language, () => {
        setAgentState('listening');
      });

    } catch (error) {
      console.error("AI processing error:", error);
      const errorText = "I'm not sure what to say, can you try again?";
      setTranscription(prev => [...prev, { sender: 'buddy', text: errorText }]);
      setAgentState('speaking');
      speak(errorText, language, () => {
        setAgentState('listening');
      });
    }
  };

  const handleSendTextMessage = () => {
    if (!inputText.trim() || agentState !== 'listening') return;

    const userMessage = inputText.trim();
    setInputText('');
    setTranscription(prev => [...prev, { sender: 'user', text: userMessage }]);
    setAgentState('thinking');
    
    captureFrame(videoRef).then(framePart => {
      processAiTurn(userMessage, framePart);
    });
  };

  useEffect(() => {
    const startMedia = async () => {
        let stream: MediaStream | null = null;
        try {
            // Try getting both video and audio first
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (err: any) {
            console.warn("Could not get both video and audio:", err.name, err.message);
            // If we couldn't get both, try audio only. This handles cases where a user has no camera.
            if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError" || err.name === "NotReadableError") {
                try {
                    console.log("Trying to get audio only...");
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                } catch (audioErr: any) {
                    console.error("Error accessing audio device.", audioErr);
                    alert("A microphone is required for the VoiceRoom.");
                    onClose();
                    return;
                }
            } else {
                 // Handle other critical errors like PermissionDeniedError
                 console.error("Error accessing media devices.", err);
                 alert("Camera and microphone access are needed for the VoiceRoom.");
                 onClose();
                 return;
            }
        }

        if (stream) {
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                // This will only show video if the stream has a video track
                videoRef.current.srcObject = stream;
            }
            startListening();
        }
    };
    startMedia();

    return () => {
      stopListening();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startListening, stopListening, onClose]);
  
  const captureFrame = async (videoRef: React.RefObject<HTMLVideoElement>): Promise<Part | null> => {
    // Only capture a frame if there's an active video track
    if (!videoRef.current || videoRef.current.readyState < 2 || !mediaStreamRef.current?.getVideoTracks().find(t => t.enabled && t.readyState === 'live')) {
        return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64Data = dataUrl.split(",")[1];
    return { inlineData: { data: base64Data, mimeType: "image/jpeg" } };
  };

  const handleMuteToggle = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
        if(track.enabled) {
          startListening();
        } else {
          stopListening();
        }
      });
    }
  };

  const agentDescriptions: Record<AgentName, string> = {
    Adam: t('voiceRoom.defaultAgent'),
    MrBeast: t('voiceRoom.adventure'),
    MarkRober: t('voiceRoom.science'),
    Eva: t('voiceRoom.motherly'),
  }

  const agentStatusText: Record<AgentAvatarState, string> = {
      listening: t('voiceRoom.listening'),
      thinking: t('voiceRoom.thinking'),
      speaking: t('voiceRoom.speaking'),
      idle: ''
  };

  return (
    <div className="voice-room-view">
      <div className="vr-agent-selector">
        {Object.values(AGENT_PROFILES).map(agent => (
          <div
            key={agent.name}
            className={`vr-agent-card ${activeAgent.name === agent.name ? 'selected' : ''}`}
            onClick={() => setActiveAgent(agent)}
          >
            <h3>{t(`voiceAssistant.${agent.name}`)}</h3>
            <p>{agentDescriptions[agent.name]}</p>
          </div>
        ))}
      </div>

      <main className="vr-main">
        <div className="vr-video-container">
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="vr-orb-container">
            <div className={`vr-orb ${agentState}`}></div>
            <span className="vr-status-text">{agentStatusText[agentState]}</span>
          </div>
        </div>

        <aside className="vr-sidebar">
          <div className="vr-sidebar-section">
            <h4>{t('voiceRoom.agentConfiguration')}</h4>
            <div className="vr-config-item"><span>SPEECH-TO-TEXT</span><span className="value">DEEPGRAM</span></div>
            <div className="vr-config-item"><span>LLM</span><span className="value">GPT-4O-MINI</span></div>
            <div className="vr-config-item"><span>TEXT-TO-SPEECH</span><span className="value">ELEVENLABS</span></div>
          </div>
          <div className="vr-sidebar-section">
            <h4>{t('voiceRoom.enhancements')}</h4>
            <div className="vr-config-item"><span>TURN DETECTION</span><span className="value">TRUE</span></div>
            <div className="vr-config-item"><span>NOISE CANCELLATION</span><span className="value">TRUE</span></div>
          </div>
          <div className="vr-sidebar-section">
            <h4>{t('voiceRoom.latency')}</h4>
             <div className="vr-config-item"><span>END OF TURN</span><span className="value">652MS</span></div>
             <div className="vr-config-item"><span>TEXT-TO-SPEECH</span><span className="value">168MS</span></div>
             <div className="vr-config-item"><span>{t('voiceRoom.overall')}</span><span className="value">820MS</span></div>
          </div>
          <div className="vr-sidebar-section vr-transcription">
            <h4>{t('voiceRoom.transcription')}</h4>
            {transcription.map((msg, i) => (
              <p key={i}>
                <strong>{msg.sender === 'user' ? 'YOU: ' : 'AGENT: '}</strong>
                {msg.text}
              </p>
            ))}
          </div>
           <div className="vr-chat-input-area">
              <input
                type="text"
                className="vr-chat-input"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') { handleSendTextMessage(); } }}
                disabled={agentState !== 'listening'}
              />
              <button
                className="vr-chat-send-btn"
                onClick={handleSendTextMessage}
                disabled={!inputText.trim() || agentState !== 'listening'}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
        </aside>
      </main>

      <div className="vr-controls">
        <button className="vr-control-btn" onClick={handleMuteToggle} aria-label="Mute/Unmute Mic">
          {isMuted ? <MicOffIcon size={28} /> : <MicOnIcon size={28} />}
        </button>
        <button className="vr-control-btn" aria-label="Settings">
          <SettingsIcon size={28} />
        </button>
        <button className="vr-control-btn hangup" onClick={onClose} aria-label="End Call">
          <HangUpIcon size={28} />
        </button>
      </div>
    </div>
  );
};

export default VoiceRoomView;
