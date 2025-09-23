import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
// FIX: Changed Firebase imports to use the v8 compat library to fix the `initializeApp` export error.
// This assumes the project is set up with the compat version of Firebase.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { User } from "firebase/auth";

import {
  GoogleGenAI,
  Type,
  Chat,
  Part,
} from "@google/genai";
import { 
    Screen, ActiveTab, Language, LearningBuddyResponse, UserProgress,
    DiscoveredObject, StorySegment, ChatMessage, QuizQuestion, HomeworkMode,
    AgentProfile, AgentAvatarState, UserProfile, TreasureHunt,
    LearningCamp, CampProgress, ActivityLog, ActivityType, Badge
} from './lib/types';
import { AGENT_PROFILES } from './lib/agents';
import { translations } from './lib/i18n';
import { Header } from './components/Header/Header';
import { BottomNav } from './components/BottomNav/BottomNav';
import { Sidebar } from './components/Sidebar/Sidebar';
import { LoadingView } from './components/LoadingView/LoadingView';
import { LanguageSelector } from './components/LanguageSelector/LanguageSelector';
import { TreasureHuntProgress } from './components/TreasureHuntProgress/TreasureHuntProgress';
import StaticPages from './components/StaticPages/StaticPages';


import './App.css';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDUochJbbhabti4rQuosUjG0c1XyAmJ4Kc",
  authDomain: "ekided.firebaseapp.com",
  databaseURL: "https://eduplay-471808-default-rtdb.firebaseio.com",
  projectId: "eduplay-471808",
  storageBucket: "eduplay-471808.appspot.com",
  messagingSenderId: "204691510626",
  appId: "1:204691510626:web:90697bf70106f95c0e083b",
  measurementId: "G-JF0DEC1XYV"
};

// FIX: Initialize Firebase using the compat SDK.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// --- API Keys (for development) ---
const CARTESIA_API_KEY = 'sk_car_8wCTpQdsAjSjUxbxEt3Yy9';


// --- Lazy-loaded Screen/View Components ---
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen/WelcomeScreen'));
const HomeView = lazy(() => import('./components/HomeView/HomeView'));
const ObjectDetectorGate = lazy(() => import('./components/ObjectDetectorGate/ObjectDetectorGate'));
const MediaView = lazy(() => import('./components/MediaView/MediaView'));
const ResultView = lazy(() => import('./components/ResultView/ResultView'));
const QuizGate = lazy(() => import('./components/QuizGate/QuizGate'));
const QuizSummaryView = lazy(() => import('./components/QuizSummaryView/QuizSummaryView'));
const StoryView = lazy(() => import('./components/StoryView/StoryView'));
const RewardsView = lazy(() => import('./components/RewardsView/RewardsView'));
const HomeworkGate = lazy(() => import('./components/HomeworkGate/HomeworkGate'));
const HomeworkSolverView = lazy(() => import('./components/HomeworkSolverView/HomeworkSolverView'));
const PlaygroundGate = lazy(() => import('./components/PlaygroundGate/PlaygroundGate'));
const PlaygroundLiveView = lazy(() => import('./components/PlaygroundLiveView/PlaygroundLiveView'));
const ProfileView = lazy(() => import('./components/ProfileView/ProfileView'));
const TreasureHuntGate = lazy(() => import('./components/TreasureHuntGate/TreasureHuntGate'));
const TreasureHuntView = lazy(() => import('./components/TreasureHuntView/TreasureHuntView'));
const VoiceAssistantGate = lazy(() => import('./components/VoiceAssistantGate/VoiceAssistantGate'));
const VoiceAssistantView = lazy(() => import('./components/VoiceAssistantView/VoiceAssistantView'));
const LearningCampGate = lazy(() => import('./components/LearningCampGate/LearningCampGate'));
const LearningCampView = lazy(() => import('./components/LearningCampView/LearningCampView'));
const VoiceRoomView = lazy(() => import('./components/VoiceRoomView/VoiceRoomView'));


// --- Main App Component ---
const App = () => {
  // --- State Management ---
  const [screen, setScreen] = useState<Screen>("loading");
  const [previousScreen, setPreviousScreen] = useState<Screen>("home");
  const [activeTab, setActiveTab] = useState<ActiveTab>("Home");
  const [learningBuddyResponse, setLearningBuddyResponse] =
    useState<LearningBuddyResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<{
    type: 'image' | 'video' | 'audio';
    data: string;
    file?: File;
  }>({ type: "image", data: "" });
  const [discoveredObjects, setDiscoveredObjects] = useState<
    DiscoveredObject[]
  >([]);
  const [story, setStory] = useState<StorySegment | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scanContext, setScanContext] = useState<'object-detector' | 'homework' | 'treasure-hunt' | 'learning-camp' | null>(null);

  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Language State
  const [language, setLanguage] = useState<Language>('en');
  const [isLangSelectorOpen, setIsLangSelectorOpen] = useState(false);

  // Quiz State
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [quizHistory, setQuizHistory] = useState<string[]>([]);
  const [currentQuizSession, setCurrentQuizSession] = useState<QuizQuestion[]>(
    []
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizSessionCorrectAnswers, setQuizSessionCorrectAnswers] =
    useState(0);
  const [isInQuizSession, setIsInQuizSession] = useState(false);

  // Homework State
  const [homeworkMode, setHomeworkMode] = useState<HomeworkMode | null>(null);
  const [homeworkChatHistory, setHomeworkChatHistory] = useState<ChatMessage[]>([]);
  const [homeworkChat, setHomeworkChat] = useState<Chat | null>(null);
  const [isHomeworkLoading, setIsHomeworkLoading] = useState(false);
  
  // Treasure Hunt State
  const [treasureHunt, setTreasureHunt] = useState<TreasureHunt | null>(null);
  const [treasureHuntFeedback, setTreasureHuntFeedback] = useState<string | null>(null);
  const [treasureHuntProgressUpdate, setTreasureHuntProgressUpdate] = useState<{ current: number; total: number } | null>(null);
  
  // Learning Camp State
  const [learningCamp, setLearningCamp] = useState<LearningCamp | null>(null);
  const [campProgress, setCampProgress] = useState<CampProgress | null>(null);
  const [isCampLoading, setIsCampLoading] = useState(false);

  // Parent Dashboard State
  const [parentTips, setParentTips] = useState('');
  const [isParentTipsLoading, setIsParentTipsLoading] = useState(false);

  // TTS State
  const [isTtsOn, setIsTtsOn] = useState(true);
  
  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- Agent State ---
  const [activeAgent, setActiveAgent] = useState<AgentProfile>(AGENT_PROFILES.Adam);

  // --- Voice Assistant State ---
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [agentAvatarState, setAgentAvatarState] = useState<AgentAvatarState>('idle');
  const [voiceAssistantHistory, setVoiceAssistantHistory] = useState<ChatMessage[]>([]);
  const [voiceAssistantInputText, setVoiceAssistantInputText] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const localVideoEl = useRef<HTMLVideoElement>(null);
  
  // --- Playground State ---
  const [narrationText, setNarrationText] = useState('');
  const isProcessingNarrationFrame = useRef(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const campDialogueSpokenRef = useRef('');
  
  const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let result: any = translations[language];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) return key;
        }
        return result || key;
    }, [language]);

  // --- Gemini AI Setup ---
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  // --- Helper Functions ---
  const speak = useCallback(async (text: string, voiceId: string, onEndCallback: () => void) => {
    if (!isTtsOn || !text.trim() || !voiceId) {
        if (onEndCallback) onEndCallback();
        return;
    }

    setIsAgentSpeaking(true);
    try {
        const response = await fetch('https://api.cartesia.ai/v1/tts/bytes', {
            method: 'POST',
            headers: {
                'X-API-Key': CARTESIA_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                voice_id: voiceId,
                output_format: "mp3",
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => {
            setIsAgentSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            if (onEndCallback) onEndCallback();
        };
        audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            setIsAgentSpeaking(false);
            if (onEndCallback) onEndCallback();
        }

    } catch (error) {
        console.error("Cartesia API error:", error);
        setIsAgentSpeaking(false);
        if (onEndCallback) onEndCallback();
    }
  }, [isTtsOn]);

  const handleToggleTts = () => {
    const newTtsState = !isTtsOn;
    setIsTtsOn(newTtsState);
    if (!newTtsState) {
      // Logic to stop any playing audio from Cartesia if needed
      // For now, we'll just prevent new audio from starting.
      setIsAgentSpeaking(false);
    }
  };

  // --- Effects ---
   useEffect(() => {
    // FIX: Use compat `onAuthStateChanged`.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            setIsGuest(false);
            setFirebaseUser(user);
            // FIX: Use compat `doc` and `getDoc`.
            const userRef = db.collection('users').doc(user.uid);
            const docSnap = await userRef.get();
            if (docSnap.exists) {
                const profileData = docSnap.data() as UserProfile;
                setUserProfile(profileData);
                setScreen("home");
            } else {
                setScreen("profile");
            }
        } else {
            setFirebaseUser(null);
            setUserProfile(null);
            if (!isGuest) {
              setDiscoveredObjects([]);
              setStory(null);
              setQuizHistory([]);
              setCurrentQuizSession([]);
              setHomeworkChatHistory([]);
              setHomeworkChat(null);
              setTreasureHunt(null);
              setLearningCamp(null);
              setCampProgress(null);
              setVoiceAssistantHistory([]);
              setChat(null);
              setScreen("welcome");
            }
        }
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [isGuest]);
  
  useEffect(() => {
    document.body.className = `${screen}-bg ${isDarkMode ? "dark-mode" : ""} ${language === 'bn' ? 'lang-bn' : ''}`;
    if (screen === 'story' && story?.backgroundImage) {
        document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${story.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    } else {
        document.body.style.backgroundImage = '';
    }
  }, [screen, isDarkMode, language, story]);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("API key is missing. Please set it up to use the app.");
    }
  }, []);
  
  useEffect(() => {
    const startStream = async () => {
        if (mediaStreamRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            mediaStreamRef.current = stream;
            if (localVideoEl.current) {
                localVideoEl.current.srcObject = stream;
            }
            stream.getVideoTracks().forEach(track => track.enabled = isCameraEnabled);
        } catch (err) {
            console.error("Camera access error:", err);
            setIsCameraEnabled(false);
        }
    };
    const stopStream = () => {
         if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
             if (localVideoEl.current) {
                localVideoEl.current.srcObject = null;
            }
        }
    };
    if (screen === 'voice-assistant') {
        startStream();
    } else {
        stopStream();
    }
    return () => stopStream();
  }, [screen]);

  useEffect(() => {
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => {
            track.enabled = isCameraEnabled;
        });
    }
  }, [isCameraEnabled]);
  
   useEffect(() => {
      let intervalId: number | null = null;
      if (screen === 'playground-live') {
          intervalId = window.setInterval(async () => {
              if (isProcessingNarrationFrame.current) return;
              isProcessingNarrationFrame.current = true;
              try {
                  const framePart = await captureFrame(videoRef);
                  if (framePart) {
                      const langName = language === 'bn' ? 'Bengali' : 'English';
                      const age = userProfile ? calculateAge(userProfile.dob) : 6;
                      const prompt = `${activeAgent.systemInstruction} You are narrating a live scene for a child (${age} years old). Describe what is happening in this image in one short, engaging sentence. Be playful and curious. The language must be ${langName}.`;
                      const response = await ai.models.generateContent({
                          model: "gemini-2.5-flash",
                          contents: { parts: [{ text: prompt }, framePart] },
                      });
                      setNarrationText(response.text);
                  }
              } catch (err) {
                  console.error("Narration error:", err);
                  setNarrationText("I'm having a little trouble seeing right now!");
              } finally {
                  isProcessingNarrationFrame.current = false;
              }
          }, 3000);
      }
      return () => {
          if (intervalId) clearInterval(intervalId);
      };
  }, [screen, language, userProfile, activeAgent, ai.models]);

  useEffect(() => {
    if (screen === 'playground-live' && narrationText) {
        speak(narrationText, activeAgent.voiceId, () => {});
    }
  }, [narrationText, screen, speak, activeAgent.voiceId]);

  useEffect(() => {
      if (screen === 'learning-camp-view' && learningCamp && campProgress) {
          const markRoberVoiceId = AGENT_PROFILES.MarkRober.voiceId;
          if (campProgress.currentDay > learningCamp.duration) {
              if (campDialogueSpokenRef.current !== 'graduation') {
                  speak(t('learningCamp.graduationMessage'), markRoberVoiceId, () => {});
                  campDialogueSpokenRef.current = 'graduation';
              }
              return;
          }
          const currentActivity = learningCamp.days[campProgress.currentDay - 1]?.activities[campProgress.currentActivityIndex];
          if (currentActivity && currentActivity.dialogue && campDialogueSpokenRef.current !== currentActivity.dialogue) {
              speak(currentActivity.dialogue, markRoberVoiceId, () => {});
              campDialogueSpokenRef.current = currentActivity.dialogue;
          }
      }
  }, [campProgress, learningCamp, screen, speak, t]);

  // FIX: Use compat `signInWithRedirect` and `signOut`.
  const handleSignIn = () => auth.signInWithRedirect(googleProvider);
  const handleSignOut = () => { auth.signOut(); setIsGuest(false); };
  const handleTryWithoutLogin = () => { setIsGuest(true); setUserProfile(null); setScreen("profile"); };

  const calculateAge = (dob: string): number => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age > 0 ? age : 0;
  };

  const updateUserProgress = useCallback((updater: (prevProgress: UserProgress) => UserProgress, newLogEntry?: ActivityLog) => {
    if (!firebaseUser && !isGuest) return;
      setUserProfile(currentProfile => {
          if (!currentProfile) return null;
          const newProgress = updater(currentProfile.progress);
          const updatedProfile = {
              ...currentProfile, progress: newProgress, updatedAt: new Date().toISOString(),
              activityLog: newLogEntry ? [newLogEntry, ...(currentProfile.activityLog || [])].slice(0, 50) : currentProfile.activityLog,
          };
          // FIX: Use compat `setDoc`.
          if (firebaseUser) db.collection('users').doc(firebaseUser.uid).set(updatedProfile, { merge: true });
          return updatedProfile;
      });
  }, [firebaseUser, isGuest]);
  
  const awardBadge = useCallback((badgeName: string, badgeId: string) => {
    const newBadge: Badge = { id: badgeId, name: badgeName, earnedOn: new Date().toISOString() };
    setUserProfile(currentProfile => {
        if (!currentProfile || currentProfile.badges?.some(b => b.id === newBadge.id)) return currentProfile;
        const updatedProfile = { ...currentProfile, badges: [...(currentProfile.badges || []), newBadge], updatedAt: new Date().toISOString() };
        // FIX: Use compat `setDoc`.
        if (firebaseUser && !isGuest) db.collection('users').doc(firebaseUser.uid).set(updatedProfile, { merge: true });
        return updatedProfile;
    });
  }, [firebaseUser, isGuest]);

   const logActivity = useCallback((type: ActivityType, description: string, xpEarned: number) => {
        const newLog: ActivityLog = { id: `log_${Date.now()}`, type, description, xpEarned, timestamp: new Date().toISOString() };
        updateUserProgress(prev => ({ ...prev, xp: prev.xp + xpEarned }), newLog);
    }, [updateUserProgress]);

  const handleSaveProfile = (profileData: Omit<UserProfile, 'uid' | 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'activityLog' | 'badges'>) => {
      const now = new Date().toISOString();
      const baseProfile = {
          ...profileData, updatedAt: now,
          progress: { stars: 0, quizzesCompleted: 0, objectsDiscovered: 0, learningStreak: 0, quizLevel: 1, xp: 0 },
          activityLog: [], badges: [],
      };
      if (isGuest) {
          setUserProfile({ uid: 'guest', id: `guest_${Date.now()}`, createdAt: now, ...baseProfile });
          setScreen("home");
          setActiveTab("Home");
          return;
      }
      if (!firebaseUser) return;
      const newProfile: UserProfile = { uid: firebaseUser.uid, id: userProfile?.id || `user_${Date.now()}`, createdAt: userProfile?.createdAt || now, ...baseProfile };
      // FIX: Use compat `setDoc`.
      db.collection('users').doc(firebaseUser.uid).set(newProfile).then(() => {
         setUserProfile(newProfile);
         setScreen("home");
         setActiveTab("Home");
      });
  };

  const handleClearData = () => {
    // FIX: Use compat `deleteDoc`.
    if (firebaseUser) db.collection('users').doc(firebaseUser.uid).delete().then(() => { handleSignOut(); window.location.reload(); });
  };

  const requireProfile = useCallback(() => {
    if (!userProfile?.dob) { setPreviousScreen(screen); setScreen('profile'); return true; }
    return false;
  }, [userProfile, screen]);

  const goHome = useCallback(() => { setScreen("home"); setActiveTab("Home"); }, []);

  const handleCloseFeature = useCallback(() => {
    setQuizAnswered(false); setLastAnswerCorrect(false); setCurrentQuizSession([]);
    setCurrentQuestionIndex(0); setIsInQuizSession(false); setStory(null);
    setHomeworkMode(null); setHomeworkChatHistory([]); setHomeworkChat(null);
    setTreasureHunt(null); setLearningCamp(null); setCampProgress(null);
    goHome();
  }, [goHome]);

  const handleNav = (tab: ActiveTab) => {
    if (tab === "Menu") { setIsSidebarOpen(true); return; }
    setActiveTab(tab);
    switch (tab) {
      case "Home": setScreen("home"); break;
      case "Object Scan": setScreen("object-detector-gate"); break;
      case "Voice Assistant": setScreen("voice-assistant-gate"); break;
      case "Playground": setScreen("playground-gate"); break;
      case "Treasure Hunt": setScreen("treasure-hunt-gate"); break;
      case "Learning Camp": setScreen("learning-camp-gate"); break;
      case "Quiz": setScreen("quiz"); break;
      case "Rewards": setScreen("rewards"); break;
      case "Story": setScreen("story"); break;
      case "Homework": setScreen("homework"); break;
      case "Parent Dashboard": setScreen("parent-dashboard"); break;
      case "VoiceRoom": setScreen("voice-room"); break;
    }
    setIsSidebarOpen(false);
  };

  const handleSidebarNav = (newScreen: Screen) => {
    if (['profile', 'about', 'terms', 'privacy', 'parent-dashboard'].includes(newScreen)) setScreen(newScreen);
    setIsSidebarOpen(false);
  };
  
  const captureFrame = async (videoRef: React.RefObject<HTMLVideoElement>): Promise<Part | null> => {
      if (!videoRef.current || videoRef.current.readyState < 2) return null;
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      return { inlineData: { data: dataUrl.split(",")[1], mimeType: "image/jpeg" } };
  };

  const handleCapture = (base64: string, mime: string) => {
    setMedia({ type: 'image', data: base64 });
    setScreen('loading');
    switch (scanContext) {
      case 'object-detector': handleIdentifyObject(base64, mime); break;
      case 'homework': handleGenerateHomeworkSolution({ image: { data: base64, mimeType: mime } }); setScreen('homework-solver'); break;
      case 'treasure-hunt': handleCheckTreasure(base64, mime); break;
      case 'learning-camp': handleAdvanceCamp({ type: 'image', data: base64 }); setScreen('learning-camp-view'); break;
      default: setError("Unknown scan context."); goHome();
    }
    setScanContext(null);
  };
  
  const handleIdentifyObject = async (base64: string, mime: string) => {
    try {
      const age = userProfile ? calculateAge(userProfile.dob) : 6;
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const imagePart = { inlineData: { data: base64, mimeType: mime } };
      
      const prompt = `Identify the main object in this image. Generate a response for a ${age}-year-old child in ${langName}. The response must be a JSON object with keys: "identification" (string, object name), "funFacts" (array of 3 short strings), "soundSuggestion" (string, a sound it might make), "quiz" (object with "question", "options" array of 4 strings, "correctAnswerIndex"), and "encouragement" (string).`;
      const responseSchema = {
          type: Type.OBJECT,
          properties: {
              identification: { type: Type.STRING },
              funFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
              soundSuggestion: { type: Type.STRING },
              quiz: {
                  type: Type.OBJECT,
                  properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswerIndex: { type: Type.INTEGER },
                  },
                  required: ['question', 'options', 'correctAnswerIndex']
              },
              encouragement: { type: Type.STRING },
          },
          required: ['identification', 'funFacts', 'quiz', 'encouragement']
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: { systemInstruction: activeAgent.systemInstruction, responseMimeType: 'application/json', responseSchema: responseSchema }
      });
      const buddyResponse: LearningBuddyResponse = JSON.parse(response.text);
      setLearningBuddyResponse(buddyResponse);

      speak(`${buddyResponse.identification}. ${buddyResponse.funFacts.join('. ')}`, activeAgent.voiceId, () => {});

      const stickerResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001', prompt: `A cute, friendly cartoon sticker of a ${buddyResponse.identification}, simple, with a thick white border, vibrant colors.`,
        config: { numberOfImages: 1, outputMimeType: 'image/png' }
      });
      const stickerUrl = `data:image/png;base64,${stickerResponse.generatedImages[0].image.imageBytes}`;
      
      setDiscoveredObjects(prev => [...prev, { name: buddyResponse.identification, stickerUrl }]);
      logActivity('object-scan', `Discovered a ${buddyResponse.identification}`, 20);
      updateUserProgress(prev => ({ ...prev, objectsDiscovered: prev.objectsDiscovered + 1, stars: prev.stars + 5 }));
      setScreen('result');
    } catch (e) {
      console.error("Object identification error:", e);
      setError("I had trouble identifying that object. Let's try another one!");
      goHome();
    }
  };

  const handleStartQuiz = async (agent: AgentProfile, topic?: string) => {
    if (requireProfile()) return;
    setActiveAgent(agent); setScreen('loading'); setActiveTab('Quiz');
    try {
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const age = userProfile ? calculateAge(userProfile.dob) : 6;
      const quizLevel = userProfile?.progress.quizLevel || 1;
      const difficulty = quizLevel <= 2 ? 'very easy' : 'easy';
      let prompt = `Generate a fun, ${difficulty} 5-question quiz for a ${age}-year-old child in ${langName}. Avoid these questions: [${quizHistory.join(', ')}].`;
      if (topic) prompt += ` The quiz must be about: "${topic}".`;

      const responseSchema = {
          type: Type.ARRAY,
          items: {
              type: Type.OBJECT,
              properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.INTEGER },
              },
              required: ['question', 'options', 'correctAnswerIndex']
          }
      };

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema } });
      const quizData: QuizQuestion[] = JSON.parse(response.text);
      
      setCurrentQuizSession(quizData); setCurrentQuestionIndex(0); setQuizSessionCorrectAnswers(0);
      setIsInQuizSession(true); setLearningBuddyResponse({ identification: topic || t('header.quizTime'), funFacts: [], quiz: quizData[0], encouragement: '' });
      speak(`${topic ? `${t('quiz.customQuizTitle')} ${topic}` : t('quiz.ready')}. ${quizData[0].question}`, agent.voiceId, () => {});
      setScreen('result'); setMedia({ type: 'image', data: '' });
    } catch (e) { console.error("Quiz error:", e); setError("Quiz creation failed."); goHome(); }
  };

  const handleAnswerQuiz = (selectedIndex: number) => {
    if (quizAnswered) return;
    const isCorrect = selectedIndex === currentQuizSession[currentQuestionIndex].correctAnswerIndex;
    setLastAnswerCorrect(isCorrect); setQuizAnswered(true);
    speak(isCorrect ? t('result.correct') : t('result.incorrect'), activeAgent.voiceId, () => {});
    if (isCorrect) { setQuizSessionCorrectAnswers(p => p + 1); updateUserProgress(p => ({...p, stars: p.stars + 2})); }
  };

  const handleNextQuizQuestion = () => {
    setQuizAnswered(false); setLastAnswerCorrect(false);
    const newIndex = currentQuestionIndex + 1;
    if (newIndex < currentQuizSession.length) {
      setCurrentQuestionIndex(newIndex);
      setLearningBuddyResponse(p => p ? { ...p, quiz: currentQuizSession[newIndex] } : null);
      speak(currentQuizSession[newIndex].question, activeAgent.voiceId, () => {});
    } else {
      setIsInQuizSession(false);
      const level = userProfile?.progress.quizLevel || 1;
      speak(`${t('quizSummary.levelComplete').replace('{level}', String(level))}`, activeAgent.voiceId, () => {});
      updateUserProgress(p => ({ ...p, quizzesCompleted: p.quizzesCompleted + 1, quizLevel: p.quizLevel + 1 }));
      logActivity('quiz', `Completed quiz: ${quizSessionCorrectAnswers}/${currentQuizSession.length}`, 75);
      setQuizHistory(p => [...p, ...currentQuizSession.map(q => q.question)].slice(-50));
      setScreen('quizSummary');
    }
  };

  const handleStartStory = async (agent: AgentProfile, context?: string) => {
      if (requireProfile()) return;
      setActiveAgent(agent); setScreen('loading'); setActiveTab('Story');
      try {
          const langName = language === 'bn' ? 'Bengali' : 'English';
          const age = userProfile ? calculateAge(userProfile.dob) : 6;
          const discoveredObjectNames = discoveredObjects.map(o => o.name).join(', ') || 'a friendly cat';
          let prompt = `Start a short, adventurous story for a ${age}-year-old child in ${langName}. The story should end with a question and two choices for what to do next. The response must be a valid JSON object with keys: "storyText" (string, 2-3 sentences), "choices" (array of 2 short strings), and "backgroundImagePrompt" (string, a simple description for an image generator, e.g., 'A magical forest, cartoon style').`;
          if (context) {
              prompt += ` The story must be about: "${context}".`;
          } else {
              prompt += ` The story should involve one of these things: ${discoveredObjectNames}.`;
          }
          
          const responseSchema = {
              type: Type.OBJECT,
              properties: {
                  storyText: { type: Type.STRING },
                  choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                  backgroundImagePrompt: { type: Type.STRING },
              },
              required: ['storyText', 'choices', 'backgroundImagePrompt']
          };

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  systemInstruction: agent.systemInstruction,
                  responseMimeType: 'application/json',
                  responseSchema
              }
          });
          const storyData = JSON.parse(response.text);
          
          const imageResponse = await ai.models.generateImages({
              model: 'imagen-4.0-generate-001',
              prompt: `${storyData.backgroundImagePrompt}, beautiful, fantasy, for kids`,
              config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' }
          });
          const imageBase64 = imageResponse.generatedImages[0].image.imageBytes;
          const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

          setStory({ ...storyData, backgroundImage: imageUrl });
          speak(storyData.storyText, agent.voiceId, () => {});
          
          const newChat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: agent.systemInstruction } });
          setChat(newChat);
          
          setScreen('story');
      } catch (e) { 
          console.error("Story start error:", e);
          setError("I couldn't think of a story right now. Let's try later!");
          goHome();
       }
  };

  const handleContinueStory = async (choice: string) => {
      if (!chat || !story) return;
      setScreen('loading');
      try {
          const prompt = `The user chose: "${choice}". Continue the story for one more paragraph (2-3 sentences), then give two new choices. The response must be a valid JSON object with keys: "storyText", "choices", and "backgroundImagePrompt". If this is the end of the story, make the choices "Play Again" and "Go Home".`;
          // FIX: The sendMessage method takes a string or Part array directly.
          const response = await chat.sendMessage(prompt);
          
          const storyData = JSON.parse(response.text);
          const imageResponse = await ai.models.generateImages({
              model: 'imagen-4.0-generate-001',
              prompt: `${storyData.backgroundImagePrompt}, beautiful, fantasy, for kids`,
              config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' }
          });
          const imageBase64 = imageResponse.generatedImages[0].image.imageBytes;
          const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

          setStory({ ...storyData, backgroundImage: imageUrl });
          speak(storyData.storyText, activeAgent.voiceId, () => {});
          logActivity('story', `Continued a story`, 15);
          setScreen('story');
      } catch (e) {
          console.error("Story continuation error:", e);
          setError("The story got lost! Let's start a new one.");
          goHome();
      }
  };

    const handleFinalStoryChoice = (choice: string) => {
        if (choice === 'Play Again') handleStartStory(activeAgent); else handleCloseFeature();
    };

    const handleGenerateHomeworkSolution = async (input: { text?: string; image?: { data: string; mimeType: string; }}) => {
        setIsHomeworkLoading(true);
        try {
            let currentChat = homeworkChat;
            if (!currentChat) {
                const age = userProfile ? calculateAge(userProfile.dob) : 6;
                const langName = language === 'bn' ? 'Bengali' : 'English';
                const chatConfig = {
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: `${activeAgent.systemInstruction} You are a homework helper for a ${age}-year-old child. The homework is about ${homeworkMode}. Explain concepts simply and step-by-step. The response language must be ${langName}.`
                    }
                };
                currentChat = ai.chats.create(chatConfig);
                setHomeworkChat(currentChat);
            }
    
            const contentParts: Part[] = [];
            if (input.text) {
                contentParts.push({ text: input.text });
                setHomeworkChatHistory(prev => [...prev, { sender: 'user', text: input.text! }]);
            }
            if (input.image) {
                contentParts.push({ inlineData: { data: input.image.data, mimeType: input.image.mimeType } });
            }
            
            // FIX: The sendMessage method takes a string or Part array directly. The `parts` are not wrapped in a `message` or `parts` object.
            const response = await currentChat.sendMessage(contentParts);
            setHomeworkChatHistory(prev => [...prev, { sender: 'buddy', text: response.text }]);
            speak(response.text, activeAgent.voiceId, () => {});
            logActivity('homework' as any, `Got help with ${homeworkMode} homework`, 25);
        } catch (e) { 
            console.error("Homework solution error:", e);
            setError("I'm having trouble with that question. Could you ask it differently?");
        } 
        finally { setIsHomeworkLoading(false); }
    };
    
     const handleSendHomeworkFollowup = async (message: string) => {
        if (!homeworkChat) return;
        setIsHomeworkLoading(true);
        setHomeworkChatHistory(prev => [...prev, { sender: 'user', text: message }]);
        try {
            // FIX: The sendMessage method takes a string or Part array directly.
            const response = await homeworkChat.sendMessage(message);
            setHomeworkChatHistory(prev => [...prev, { sender: 'buddy', text: response.text }]);
            speak(response.text, activeAgent.voiceId, () => {});
        } catch (e) { 
            console.error("Homework followup error:", e);
            setError("I got a bit confused. Let's try that again.");
         }
        finally { setIsHomeworkLoading(false); }
    };

    const handleStartVoiceAssistant = (agent: AgentProfile) => {
        setSelectedAgent(agent);
        const age = userProfile ? calculateAge(userProfile.dob) : 6;
        const langName = language === 'bn' ? 'Bengali' : 'English';
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `${agent.systemInstruction} You are a voice assistant for a ${age}-year-old child. Keep responses very short and conversational. The language must be ${langName}.`
            }
        });
        setChat(newChat);
        setVoiceAssistantHistory([]);
        setScreen('voice-assistant');
    };

    const handleSendVoiceAssistantMessage = async (message: string) => {
        if (!chat) return;
        setVoiceAssistantHistory(prev => [...prev, { sender: 'user', text: message }]);
        setAgentAvatarState('thinking');
        try {
            // FIX: The sendMessage method takes a string or Part array directly.
            const response = await chat.sendMessage(message);
            setAgentAvatarState('speaking');
            speak(response.text, selectedAgent!.voiceId, () => setAgentAvatarState('idle'));
            setVoiceAssistantHistory(prev => [...prev, { sender: 'buddy', text: response.text }]);
        } catch (e) { 
            console.error("Voice assistant error:", e);
            setAgentAvatarState('idle');
            setError("I'm having trouble talking right now.");
         }
    };
    
    const handleStartTreasureHunt = async (agent: AgentProfile) => {
      if (requireProfile()) return;
      setActiveAgent(agent); setScreen('loading'); setActiveTab('Treasure Hunt');
      try {
        const age = userProfile ? calculateAge(userProfile.dob) : 6;
        const langName = language === 'bn' ? 'Bengali' : 'English';
        const prompt = `Create a fun, 3-step treasure hunt for a ${age}-year-old child to do indoors. The response must be a valid JSON object with keys: "title" (string) and "clues" (an array of 3 objects, each with "clueText" (a simple riddle) and "targetDescription" (a simple name of the object, e.g., 'a red book')). The language must be ${langName}.`;
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                clues: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            clueText: { type: Type.STRING },
                            targetDescription: { type: Type.STRING },
                        },
                        required: ['clueText', 'targetDescription']
                    }
                }
            },
            required: ['title', 'clues']
        };
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', contents: prompt,
            config: { systemInstruction: agent.systemInstruction, responseMimeType: 'application/json', responseSchema }
        });
        const huntData = JSON.parse(response.text);
        const newHunt: TreasureHunt = { 
            id: `hunt_${Date.now()}`,
            title: huntData.title,
            clues: huntData.clues.map((c: any) => ({ ...c, found: false })),
            currentClueIndex: 0,
            isComplete: false,
         };
        setTreasureHunt(newHunt);
        speak(newHunt.clues[0].clueText, agent.voiceId, () => {});
        setScreen('treasure-hunt-active');
      } catch (e) { 
          console.error("Treasure hunt error:", e);
          setError("I couldn't create a treasure hunt. Maybe later!");
          goHome();
      }
    };

    const handleCheckTreasure = async (base64: string, mime: string) => {
      if (!treasureHunt) return;
      setScreen('loading');
      try {
        const currentClue = treasureHunt.clues[treasureHunt.currentClueIndex];
        const imagePart = { inlineData: { data: base64, mimeType: mime } };
        const prompt = `Does the object in this image match the description: "${currentClue.targetDescription}"? The main object in the image is what I care about. Respond with a JSON object containing "isMatch" (boolean) and "identifiedObject" (string, the name of the object in the image).`;
        const responseSchema = {
            type: Type.OBJECT,
            properties: { isMatch: { type: Type.BOOLEAN }, identifiedObject: { type: Type.STRING } },
            required: ['isMatch', 'identifiedObject']
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: { parts: [{ text: prompt }, imagePart] },
            config: { systemInstruction: activeAgent.systemInstruction, responseMimeType: 'application/json', responseSchema }
        });
        const result = JSON.parse(response.text);
        const isMatch = result.isMatch;

        if (isMatch) {
          const feedback = t('treasureHunt.success');
          const newClueIndex = treasureHunt.currentClueIndex + 1;
          const isComplete = newClueIndex >= treasureHunt.clues.length;
          
          setTreasureHuntProgressUpdate({ current: newClueIndex, total: treasureHunt.clues.length });
          logActivity('treasure-hunt', `Found clue for ${currentClue.targetDescription}`, 30);
          updateUserProgress(p => ({ ...p, stars: p.stars + 10 }));

          const updatedHunt = { ...treasureHunt, clues: treasureHunt.clues.map((c, i) => i === treasureHunt.currentClueIndex ? { ...c, found: true } : c), currentClueIndex: isComplete ? treasureHunt.currentClueIndex : newClueIndex, isComplete: isComplete, };
          setTreasureHunt(updatedHunt);

          speak(feedback, activeAgent.voiceId, () => {
              setTimeout(() => {
                  if (isComplete) {
                      speak(t('treasureHunt.completeMessage'), activeAgent.voiceId, () => {});
                      logActivity('treasure-hunt', 'Completed a treasure hunt', 100);
                  } else {
                      speak(treasureHunt.clues[newClueIndex].clueText, activeAgent.voiceId, () => {});
                  }
                  setTreasureHuntProgressUpdate(null);
              }, 1500);
          });
        } else {
           const feedback = t('treasureHunt.failure').replace('{object}', result.identifiedObject);
           setTreasureHuntFeedback(feedback);
           speak(feedback, activeAgent.voiceId, () => {});
        }
      } catch (e) {
        console.error("Treasure check error:", e);
        setError("I'm not sure if that's right. Let's keep looking!");
      }
      finally { setScreen('treasure-hunt-active'); }
    };
  
    const handleStartLearningCamp = async (duration: number) => {
        if (requireProfile()) return;
        setIsCampLoading(true);
        setActiveAgent(AGENT_PROFILES.MarkRober);
        setScreen('learning-camp-view');
        setActiveTab('Learning Camp');
        try {
            const age = userProfile ? calculateAge(userProfile.dob) : 6;
            const langName = language === 'bn' ? 'Bengali' : 'English';
            const prompt = `Generate a ${duration}-day STEM learning camp curriculum for a ${age}-year-old child, hosted by Mark Rober. The response must be a valid JSON object following the LearningCamp interface: { "duration": ${duration}, "days": [...] }. Each day should have 4 activities of types 'trail', 'experiment', 'story', and 'wrap-up'. Keep all text very simple and engaging. The language must be ${langName}.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: AGENT_PROFILES.MarkRober.systemInstruction,
                    responseMimeType: 'application/json'
                }
            });

            const campData = JSON.parse(response.text);
            setLearningCamp(campData);
            setCampProgress({ currentDay: 1, currentActivityIndex: 0 });
            logActivity('learning-camp', `Started a ${duration}-day learning camp`, 50);
        } catch (e) { 
            console.error("Learning camp creation error:", e);
            setError("Could not set up the learning camp. Please try again later.");
            goHome();
        }
        finally { setIsCampLoading(false); }
    };
  
    const handleAdvanceCamp = async (userInput?: { type: 'text' | 'image'; data: string }) => {
        if (!learningCamp || !campProgress) return;
        
        const currentDayData = learningCamp.days[campProgress.currentDay - 1];
        const currentActivity = currentDayData?.activities[campProgress.currentActivityIndex];

        if (!currentActivity) return;
        
        // Award XP for completing an activity
        logActivity('learning-camp', `Completed activity: ${currentActivity.title}`, 25);
        
        let nextActivityIndex = campProgress.currentActivityIndex + 1;
        let nextDay = campProgress.currentDay;
        
        // If the current activity was a wrap-up, award the badge
        if (currentActivity.type === 'wrap-up' && currentActivity.badgeName) {
            awardBadge(currentActivity.badgeName, `camp_day_${campProgress.currentDay}`);
        }

        // Check if we've finished the day
        if (nextActivityIndex >= currentDayData.activities.length) {
            nextActivityIndex = 0;
            nextDay += 1;
        }

        setCampProgress({
            currentDay: nextDay,
            currentActivityIndex: nextActivityIndex,
        });

        // If the entire camp is finished
        if (nextDay > learningCamp.duration) {
            logActivity('learning-camp', `Graduated from the ${learningCamp.duration}-day camp!`, 200);
        }
    };

    const handleFetchParentTips = useCallback(async () => {
        if (!userProfile || parentTips) return;
        setIsParentTipsLoading(true);
        try {
            const langName = language === 'bn' ? 'Bengali' : 'English';
            const prompt = `Based on this learning activity log for a child named ${userProfile.name}, provide 3 short, actionable, and encouraging tips for their parents. The language must be ${langName}. Format the response as a simple list. Activity Log: ${JSON.stringify(userProfile.activityLog.slice(0, 10))}`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setParentTips(response.text);
        } catch (e) {
            console.error("Parent tips error:", e);
            setParentTips(t('parentDashboard.emptyTimeline'));
        }
        finally { setIsParentTipsLoading(false); }
    }, [userProfile, language, t, ai.models, parentTips]);

  useEffect(() => {
    if (screen === 'parent-dashboard') handleFetchParentTips();
  }, [screen, handleFetchParentTips]);
  
  const headerTitleMapping: { [key: string]: string[] } = {
      home: ['home'],
      objectDetector: ['object-detector-gate', 'media', 'result'],
      funQuiz: ['quiz', 'quizSummary'],
      stickerBook: ['rewards'],
      storyTime: ['story'],
      homework: ['homework', 'homework-solver'],
      voiceAssistant: ['voice-assistant-gate'],
      playground: ['playground-gate'],
      profile: ['profile'],
      treasureHunt: ['treasure-hunt-gate', 'treasure-hunt-active'],
      learningCamp: ['learning-camp-gate', 'learning-camp-view'],
      parentDashboard: ['parent-dashboard'],
      chats: [],
      voiceRoom: ['voice-room'],
      about: ['about'],
      terms: ['terms'],
      privacy: ['privacy'],
  };

  const renderScreen = () => {
    if (isAuthLoading) return <LoadingView t={t} />;
    switch (screen) {
      case "welcome": return <WelcomeScreen onSignIn={handleSignIn} onTryWithoutLogin={handleTryWithoutLogin} t={t} />;
      case "home": return <HomeView userProfile={userProfile} onNavigate={handleNav} t={t} />;
      case "object-detector-gate": return <ObjectDetectorGate onStart={(agent) => { setActiveAgent(agent); setScanContext('object-detector'); setScreen('media'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "media": return <MediaView onCapture={handleCapture} videoRef={videoRef} t={t} />;
      case "result": return <ResultView response={learningBuddyResponse} media={media} onAnswer={handleAnswerQuiz} answered={quizAnswered} correct={lastAnswerCorrect} onNext={handleNextQuizQuestion} isInQuizSession={isInQuizSession} isLastQuestion={currentQuestionIndex === currentQuizSession.length - 1} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "quiz": return <QuizGate onStartQuiz={handleStartQuiz} onStartCustomQuiz={handleStartQuiz} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "quizSummary": return <QuizSummaryView correctAnswers={quizSessionCorrectAnswers} totalQuestions={currentQuizSession.length} level={userProfile?.progress.quizLevel || 1} onContinue={() => handleStartQuiz(activeAgent)} onGoHome={handleCloseFeature} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "rewards": return <RewardsView progress={userProfile?.progress!} stickers={discoveredObjects} t={t} />;
      case "story": return <StoryView story={story} onStart={handleStartStory} onChoice={story?.choices.includes('Play Again') ? handleFinalStoryChoice : handleContinueStory} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "homework": return <HomeworkGate onSelectMode={(agent, mode) => { setActiveAgent(agent); setHomeworkMode(mode); setScreen('homework-solver'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "homework-solver": return <HomeworkSolverView mode={homeworkMode!} onGenerateSolution={handleGenerateHomeworkSolution} onScanRequest={() => { setScanContext('homework'); setScreen('media'); }} chatHistory={homeworkChatHistory} onSendFollowup={handleSendHomeworkFollowup} isLoading={isHomeworkLoading} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "voice-assistant-gate": return <VoiceAssistantGate onAgentSelect={handleStartVoiceAssistant} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "voice-assistant": return <VoiceAssistantView agent={selectedAgent!} history={voiceAssistantHistory} avatarState={agentAvatarState} isCameraEnabled={isCameraEnabled} setIsCameraEnabled={setIsCameraEnabled} localVideoEl={localVideoEl} onSendMessage={handleSendVoiceAssistantMessage} onBack={goHome} t={t} inputText={voiceAssistantInputText} setInputText={setVoiceAssistantInputText} />;
      case "playground-gate": return <PlaygroundGate onStart={(agent) => { setActiveAgent(agent); setScreen('playground-live'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "playground-live": return <PlaygroundLiveView videoRef={videoRef} narrationText={narrationText} onVideoReady={() => { /* can be used to show overlay */ }} t={t} />;
      case "profile": return <ProfileView profile={userProfile} onSave={handleSaveProfile} onClearData={handleClearData} onMinimize={goHome} onClose={previousScreen === 'home' ? goHome : () => setScreen(previousScreen)} t={t} />;
      case "treasure-hunt-gate": return <TreasureHuntGate onStart={handleStartTreasureHunt} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "treasure-hunt-active": return <TreasureHuntView hunt={treasureHunt} onScanRequest={() => { setScanContext('treasure-hunt'); setScreen('media'); }} feedback={treasureHuntFeedback} onPlayAgain={() => handleStartTreasureHunt(activeAgent)} onGoHome={handleCloseFeature} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "learning-camp-gate": return <LearningCampGate onStart={handleStartLearningCamp} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "learning-camp-view": return <LearningCampView camp={learningCamp} progress={campProgress} onAdvance={handleAdvanceCamp} isLoading={isCampLoading} onScanRequest={() => { setScanContext('learning-camp'); setScreen('media'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "parent-dashboard": return <StaticPages.ParentDashboardView profile={userProfile} tips={parentTips} isLoadingTips={isParentTipsLoading} t={t} />;
      case "about": return <StaticPages.AboutUsScreen t={t} />;
      case "terms": return <StaticPages.TermsScreen t={t} />;
      case "privacy": return <StaticPages.PrivacyScreen t={t} />;
      case "voice-room": return <VoiceRoomView ai={ai} userProfile={userProfile} language={language} speak={(text, voiceId, onEnd) => speak(text, voiceId, onEnd)} onClose={handleCloseFeature} t={t} />;
      default: return <HomeView userProfile={userProfile} onNavigate={handleNav} t={t} />;
    }
  };
  
  const showHeader = !['welcome', 'loading', 'voice-assistant', 'playground-live', 'voice-room'].includes(screen);
  const showBottomNav = ['home'].includes(screen);
  const showBackButton = !['welcome', 'loading', 'home', 'voice-assistant', 'playground-live'].includes(screen);
  const headerTitleKey = `header.${Object.keys(headerTitleMapping).find(key => headerTitleMapping[key].includes(screen)) || 'home'}`;

  return (
    <div className={`app-layout screen-${screen}`}>
      {isLangSelectorOpen && <LanguageSelector onSelect={setLanguage} onClose={() => setIsLangSelectorOpen(false)} t={t} />}
      {isSidebarOpen && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={handleSidebarNav} onFeatureNav={handleNav} t={t} isAuthenticated={!!firebaseUser} onSignIn={handleSignIn} onSignOut={handleSignOut} />}
      {treasureHuntProgressUpdate && <TreasureHuntProgress current={treasureHuntProgressUpdate.current} total={treasureHuntProgressUpdate.total} t={t} />}
      
      {showHeader && <Header title={t(headerTitleKey)} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} isTtsOn={isTtsOn} onToggleTts={handleToggleTts} showBackButton={showBackButton} onBack={handleCloseFeature} onLanguageClick={() => setIsLangSelectorOpen(true)} />}
      <main>
          <Suspense fallback={<LoadingView t={t} />}>
            {renderScreen()}
          </Suspense>
      </main>
      {showBottomNav && <BottomNav activeTab={activeTab} onNav={handleNav} t={t} />}
    </div>
  );
};

export default App;