import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Part } from "@google/genai";
import { AgentProfile, AgentName, AgentAvatarState, ChatMessage } from '../../lib/types';
import { AGENT_PROFILES } from '../../lib/agents';
import { useLiveKit } from '../../../hooks/useLiveKit';
import { useDeepgram } from '../../../hooks/useDeepgram';
import { MicOnIcon, MicOffIcon, SettingsIcon, HangUpIcon } from '../Icons/Icons';
import './VoiceRoomView.css';

type VoiceRoomViewProps = {
  ai: GoogleGenAI;
  userProfile: any;
  language: 'en' | 'bn';
  speak: (text: string, voiceId: string, onEnd: () => void) => void;
  onClose: () => void;
  t: (key: string) => string;
};

const VoiceRoomView = ({ ai, userProfile, language, speak, onClose, t }: VoiceRoomViewProps) => {
  const [activeAgent, setActiveAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);
  const [agentState, setAgentState] = useState<AgentAvatarState>('listening');
  const [transcription, setTranscription] = useState<ChatMessage[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const roomName='kided';
  const participantName = userProfile?.name || `user-${Date.now()}`;

  const { isConnected, mediaStream, room } = useLiveKit(roomName, participantName);

  const handleSpeechResult = useCallback((transcript: string) => {
    if (agentState !== 'listening' && agentState !== 'idle') return;

    setTranscription(prev => [...prev, { sender: 'user', text: transcript }]);
    setAgentState('thinking');
    
    captureFrame(videoRef).then(framePart => {
      processAiTurn(transcript, framePart);
    });
  }, [agentState]);

  const { isListening, startListening, stopListening } = useDeepgram({
    onResult: handleSpeechResult,
    language,
    mediaStream,
  });

  const processAiTurn = async (text: string, imagePart: Part | null) => {
    try {
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const age = userProfile ? new Date().getFullYear() - new Date(userProfile.dob).getFullYear() : 6;
      
      const prompt = `You are observing a scene through a camera and listening to a user. The user is a ${age}-year-old child. They said: "${text}". Based on both the image and what they said, provide a short, engaging response in ${langName}. Be curious and conversational.`;
      
      const contents: { parts: Part[] } = { parts: [{ text: prompt }] };
      if (imagePart) contents.parts.push(imagePart);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction: activeAgent.systemInstruction },
      });

      const aiResponseText = response.text;
      setTranscription(prev => [...prev, { sender: 'buddy', text: aiResponseText }]);
      setAgentState('speaking');
      speak(aiResponseText, activeAgent.voiceId, () => {
        setAgentState('listening');
      });

    } catch (error) {
      console.error("AI processing error:", error);
      const errorText = "I'm not sure what to say, can you try again?";
      setTranscription(prev => [...prev, { sender: 'buddy', text: errorText }]);
      setAgentState('speaking');
      speak(errorText, activeAgent.voiceId, () => {
        setAgentState('listening');
      });
    }
  };

  useEffect(() => {
    if (isConnected && mediaStream && !isListening) {
      startListening();
      if (videoRef.current) {
        const videoStream = new MediaStream(mediaStream.getVideoTracks());
        videoRef.current.srcObject = videoStream;
      }
    }
  }, [isConnected, mediaStream, isListening, startListening]);
  
  const captureFrame = async (videoRef: React.RefObject<HTMLVideoElement>): Promise<Part | null> => {
    if (!videoRef.current || videoRef.current.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return { inlineData: { data: dataUrl.split(",")[1], mimeType: "image/jpeg" } };
  };

  const handleMuteToggle = () => {
    if (room) {
        const isMuted = room.localParticipant.isMicrophoneEnabled;
        room.localParticipant.setMicrophoneEnabled(!isMuted);
        if (isMuted) stopListening();
        else startListening();
    }
  };

  const agentDescriptions: Record<AgentName, string> = { Adam: t('voiceRoom.defaultAgent'), MrBeast: t('voiceRoom.adventure'), MarkRober: t('voiceRoom.science'), Eva: t('voiceRoom.motherly') };
  const agentStatusText: Record<AgentAvatarState, string> = { listening: t('voiceRoom.listening'), thinking: t('voiceRoom.thinking'), speaking: t('voiceRoom.speaking'), idle: '' };

  return (
    <div className="voice-room-view">
      <div className="vr-agent-selector">
        {Object.values(AGENT_PROFILES).map(agent => (
          <div key={agent.name} className={`vr-agent-card ${activeAgent.name === agent.name ? 'selected' : ''}`} onClick={() => setActiveAgent(agent)}>
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
          <div className="vr-sidebar-section"><h4>{t('voiceRoom.agentConfiguration')}</h4>
            <div className="vr-config-item"><span>SPEECH-TO-TEXT</span><span className="value">DEEPGRAM</span></div>
            <div className="vr-config-item"><span>LLM</span><span className="value">GEMINI-2.5-FLASH</span></div>
            <div className="vr-config-item"><span>TEXT-TO-SPEECH</span><span className="value">CARTESIA</span></div>
          </div>
          <div className="vr-sidebar-section"><h4>{t('voiceRoom.enhancements')}</h4>
            <div className="vr-config-item"><span>TURN DETECTION</span><span className="value">TRUE</span></div>
            <div className="vr-config-item"><span>NOISE CANCELLATION</span><span className="value">TRUE</span></div>
          </div>
          <div className="vr-sidebar-section vr-transcription">
            <h4>{t('voiceRoom.transcription')}</h4>
            {transcription.map((msg, i) => (
              <p key={i}><strong>{msg.sender === 'user' ? 'YOU: ' : 'AGENT: '}</strong>{msg.text}</p>
            ))}
          </div>
        </aside>
      </main>
      <div className="vr-controls">
        <button className="vr-control-btn" onClick={handleMuteToggle} aria-label="Mute/Unmute Mic">
          {room?.localParticipant.isMicrophoneEnabled ? <MicOnIcon size={28} /> : <MicOffIcon size={28} />}
        </button>
        <button className="vr-control-btn" aria-label="Settings"><SettingsIcon size={28} /></button>
        <button className="vr-control-btn hangup" onClick={onClose} aria-label="End Call"><HangUpIcon size={28} /></button>
      </div>
    </div>
  );
};

export default VoiceRoomView;
