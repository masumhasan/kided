import { useState, useRef, useEffect, useCallback } from 'react';


// FIX: Add missing SpeechRecognition types for browsers that support it.
// A proper solution would be adding a global .d.ts file.
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: any) => void;
    onstart: () => void;
    onend: () => void;
    onerror: (event: any) => void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

type UseSpeechRecognitionArgs = {
  onResult: (transcript: string) => void;
  language: string;
};

export const useSpeechRecognition = ({ onResult, language }: UseSpeechRecognitionArgs) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stoppedIntentionallyRef = useRef(true);

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        stoppedIntentionallyRef.current = false;
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition could not start (might be already active):", e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        stoppedIntentionallyRef.current = true;
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Could not stop speech recognition:", e);
      }
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'bn' ? 'bn-IN' : 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResultRef.current(finalTranscript.trim());
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // This is the key fix: auto-restart recognition if it stops unexpectedly.
      if (!stoppedIntentionallyRef.current) {
        setTimeout(() => startListening(), 100);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      // Allow restarting for non-critical errors.
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
          stoppedIntentionallyRef.current = false;
      } else {
          stoppedIntentionallyRef.current = true;
      }
    };
    
    recognitionRef.current = recognition;

    // Cleanup function to stop recognition when the component unmounts or language changes
    return () => {
      stoppedIntentionallyRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart on unmount
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, [language, startListening]);

  return { isListening, startListening, stopListening };
};