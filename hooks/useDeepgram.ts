import { useState, useEffect, useRef, useCallback } from 'react';

// NOTE: In a production app, this key should be temporary and generated on a server.
const DEEPGRAM_API_SECRET = '7e920ac02549917ea7eabfb128f58e71a45eab14';

type UseDeepgramArgs = {
  onResult: (transcript: string) => void;
  language: 'en' | 'bn';
  mediaStream: MediaStream | null;
};

export const useDeepgram = ({ onResult, language, mediaStream }: UseDeepgramArgs) => {
  const [isListening, setIsListening] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isConnectingRef = useRef(false);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsListening(false);
    isConnectingRef.current = false;
  }, []);

  const startListening = useCallback(() => {
    if (isConnectingRef.current || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }
    isConnectingRef.current = true;
    
    const langCode = language === 'bn' ? 'bn' : 'en-US';
    const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?language=${langCode}&model=nova-2&interim_results=false&endpointing=100`, [
      'token',
      DEEPGRAM_API_SECRET,
    ]);

    socket.onopen = () => {
      if (!mediaStream) {
        console.error("Deepgram: Media stream is not available.");
        isConnectingRef.current = false;
        return;
      }
      const recorder = new MediaRecorder(mediaStream);
      recorder.ondataavailable = event => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250); // Send data every 250ms
      setIsListening(true);
      isConnectingRef.current = false;
    };

    socket.onmessage = message => {
      const data = JSON.parse(message.data);
      if (data.channel?.alternatives[0].transcript && data.is_final) {
        const finalTranscript = data.channel.alternatives[0].transcript.trim();
        if (finalTranscript) {
          onResultRef.current(finalTranscript);
        }
      }
    };

    socket.onclose = () => {
      isConnectingRef.current = false;
      stopListening();
    };

    socket.onerror = error => {
      console.error('Deepgram WebSocket error:', error);
      isConnectingRef.current = false;
      stopListening();
    };

    socketRef.current = socket;
  }, [language, mediaStream, stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { isListening, startListening, stopListening };
};
