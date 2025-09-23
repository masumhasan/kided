
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  signOut,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
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
    LearningCamp, CampProgress, ActivityLog, ActivityType
} from './lib/types';
import { AGENT_PROFILES } from './lib/agents';
import { translations } from './lib/i18n';
import { Header } from './components/Header/Header';
import { BottomNav } from './components/BottomNav/BottomNav';
import { Sidebar } from './components/Sidebar/Sidebar';
import { LoadingView } from './components/LoadingView/LoadingView';
import { LanguageSelector } from './components/LanguageSelector/LanguageSelector';
import { TreasureHuntProgress } from './components/TreasureHuntProgress/TreasureHuntProgress';
// FIX: Changed lazy import to regular import to fix component resolution and type errors.
import StaticPages from './components/StaticPages/StaticPages';


import './App.css';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDUochJbbhabti4rQuosUjG0c1XyAmJ4Kc",
  authDomain: "eduplay-471808.firebaseapp.com",
  databaseURL: "https://eduplay-471808-default-rtdb.firebaseio.com",
  projectId: "eduplay-471808",
  storageBucket: "eduplay-471808.appspot.com",
  messagingSenderId: "204691510626",
  appId: "1:204691510626:web:90697bf70106f95c0e083b",
  measurementId: "G-JF0DEC1XYV"
};

// Initialize Firebase (Modular SDK)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


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
  const [isScanningForHomework, setIsScanningForHomework] = useState(false);
  
  // Treasure Hunt State
  const [treasureHunt, setTreasureHunt] = useState<TreasureHunt | null>(null);
  const [isScanningForTreasure, setIsScanningForTreasure] = useState(false);
  const [treasureHuntFeedback, setTreasureHuntFeedback] = useState<string | null>(null);
  const [treasureHuntProgressUpdate, setTreasureHuntProgressUpdate] = useState<{ current: number; total: number } | null>(null);
  
  // Learning Camp State
  const [learningCamp, setLearningCamp] = useState<LearningCamp | null>(null);
  const [campProgress, setCampProgress] = useState<CampProgress | null>(null);
  const [isCampLoading, setIsCampLoading] = useState(false);
  const [isScanningForCamp, setIsScanningForCamp] = useState(false);

  // Parent Dashboard State
  const [parentTips, setParentTips] = useState('');
  const [isParentTipsLoading, setIsParentTipsLoading] = useState(false);


  // TTS State
  const [isTtsOn, setIsTtsOn] = useState(true);
  
  const handleToggleTts = () => {
    const newTtsState = !isTtsOn;
    setIsTtsOn(newTtsState);
    if (!newTtsState && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsAgentSpeaking(false);
    }
  };

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // --- Effects ---
   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setIsGuest(false);
            setFirebaseUser(user);
            const userRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
                setScreen("home");
            } else {
                setScreen("profile"); // New user, create profile
            }
        } else {
            setFirebaseUser(null);
            setUserProfile(null);
            setScreen("welcome");
        }
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    document.body.className = `${screen}-bg ${isDarkMode ? "dark-mode" : ""} ${language === 'bn' ? 'lang-bn' : ''}`;
    if (screen === 'story' && story?.backgroundImage) {
        document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${story.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    } else {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
    }
  }, [screen, isDarkMode, language, story]);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("API key is missing. Please set it up to use the app.");
    }
  }, []);
  
  // --- Camera Effect for Voice Assistant ---
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

    return () => {
        stopStream();
    }
  }, [screen]);

  useEffect(() => {
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => {
            track.enabled = isCameraEnabled;
        });
    }
  }, [isCameraEnabled]);
  
   // --- Playground Narration Effect ---
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
          }, 3000); // Every 3 seconds
      }
      return () => {
          if (intervalId) clearInterval(intervalId);
      };
  }, [screen, language, userProfile, activeAgent]);

    // --- Auth Handlers ---
  const handleSignIn = () => {
    signInWithRedirect(auth, googleProvider).catch(error => {
      console.error("Google Sign-In Error:", error);
      setError("Failed to sign in with Google. Please try again.");
    });
  };

  const handleSignOut = () => {
    signOut(auth);
    setIsGuest(false);
  };
  
  const handleTryWithoutLogin = () => {
    setIsGuest(true);
    const guestProfile: UserProfile = {
        uid: 'guest',
        id: 'guest_profile',
        name: 'Explorer', // A friendly guest name
        dob: '2018-01-01', // A default DOB for age calculation
        familyMembers: [],
        progress: {
            stars: 0,
            quizzesCompleted: 0,
            objectsDiscovered: 0,
            learningStreak: 0,
            quizLevel: 1,
            xp: 0,
        },
        activityLog: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    setUserProfile(guestProfile);
    setScreen("home");
  };


  // --- Profile & Progress Management ---
  const calculateAge = (dob: string): number => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age > 0 ? age : 0;
  };

  const updateUserProgress = useCallback((updater: (prevProgress: UserProgress) => UserProgress, newLogEntry?: ActivityLog) => {
    if (!firebaseUser && !isGuest) return;
      setUserProfile(currentProfile => {
          if (!currentProfile) return null;

          const newProgress = updater(currentProfile.progress);
          const updatedProfile = {
              ...currentProfile,
              progress: newProgress,
              updatedAt: new Date().toISOString(),
              activityLog: newLogEntry ? [newLogEntry, ...(currentProfile.activityLog || [])].slice(0, 50) : currentProfile.activityLog,
          };

          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile);
          }
          return updatedProfile;
      });
  }, [firebaseUser, isGuest]);

   const logActivity = useCallback((type: ActivityType, description: string, xpEarned: number) => {
        const newLog: ActivityLog = {
            id: `log_${Date.now()}`,
            type,
            description,
            xpEarned,
            timestamp: new Date().toISOString(),
        };
        updateUserProgress(prev => ({
            ...prev,
            xp: prev.xp + xpEarned,
        }), newLog);
    }, [updateUserProgress]);

// FIX: Updated signature to Omit uid and activityLog, as they are derived from component state and not passed from ProfileView.
  const handleSaveProfile = (profileData: Omit<UserProfile, 'uid' | 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'activityLog'>) => {
      if (isGuest) {
          setUserProfile(currentProfile => {
              if (!currentProfile) return null;
              return { ...currentProfile, ...profileData, updatedAt: new Date().toISOString() };
          });
          setScreen("home");
          setActiveTab("Home");
          return;
      }
      
      if (!firebaseUser) return;
      const now = new Date().toISOString();
      const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          id: userProfile?.id || `user_${Date.now()}`,
          ...profileData,
          createdAt: userProfile?.createdAt || now,
          updatedAt: now,
          progress: userProfile?.progress || {
              stars: 0,
              quizzesCompleted: 0,
              objectsDiscovered: 0,
              learningStreak: 0,
              quizLevel: 1,
              xp: 0,
          },
          activityLog: userProfile?.activityLog || [],
      };
      
      setDoc(doc(db, 'users', firebaseUser.uid), newProfile).then(() => {
         setUserProfile(newProfile);
         setScreen("home");
         setActiveTab("Home");
      });
  };

  const handleClearData = () => {
    if (firebaseUser) {
        deleteDoc(doc(db, 'users', firebaseUser.uid)).then(() => {
            handleSignOut(); // Sign out after deleting data
            window.location.reload();
        });
    }
  };

  const requireProfile = useCallback(() => {
    if (!userProfile) {
        setPreviousScreen(screen);
        setScreen('profile');
        return true;
    }
    return false;
  }, [userProfile, screen]);
  
  const handleStartLearningCamp = async (duration: number) => {
    if (requireProfile()) return;
    setIsCampLoading(true);
    setScreen('learning-camp-view');
    setActiveTab('Learning Camp');
    try {
        const langName = language === 'bn' ? 'Bengali' : 'English';
        const age = userProfile ? calculateAge(userProfile.dob) : 6;
        const agent = AGENT_PROFILES.MarkRober;

        const prompt = `Generate a learning camp adventure for a ${age}-year-old child. The camp must last for ${duration} day(s). The language must be ${langName}. Each day must have a unique, fun theme (e.g., Space, Jungle, Ocean, Engineering) and follow a strict structure of exactly 4 activities in this order:
1.  An 'trail' activity: An exploration challenge like a quiz, riddle, or puzzle.
2.  An 'experiment' activity: A simple, hands-on experiment or build using common household items.
3.  A 'story' activity: An interactive, choose-your-own-path story adventure related to the day's theme.
4.  A 'wrap-up' activity: A summary of the day's learnings that awards a unique, creative badge and shares one cool fun fact.
Ensure all content is fun, educational, safe, and age-appropriate. The dialogue must be in the persona of Mark Rober.`;
        
        const learningCampSchema = {
            type: Type.OBJECT,
            properties: {
                duration: { type: Type.INTEGER },
                days: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            activities: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        dialogue: { type: Type.STRING },
                                        inputType: { type: Type.STRING },
                                        question: { type: Type.STRING, nullable: true },
                                        options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                                        correctAnswerIndex: { type: Type.INTEGER, nullable: true },
                                        materials: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                                        steps: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                                        explanation: { type: Type.STRING, nullable: true },
                                        badgeName: { type: Type.STRING, nullable: true },
                                        funFact: { type: Type.STRING, nullable: true },
                                    },
                                    required: ['title', 'type', 'dialogue', 'inputType']
                                }
                            }
                        },
                        required: ['activities']
                    }
                }
            },
            required: ['duration', 'days']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: agent.systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: learningCampSchema,
            },
        });

        const campData = JSON.parse(response.text);
        setLearningCamp(campData);
        setCampProgress({ currentDay: 1, currentActivityIndex: 0 });
    } catch (e) {
        console.error("Learning Camp generation error:", e);
        setError("Sorry, I couldn't create the camp adventure right now. Please try again!");
        goHome();
    } finally {
        setIsCampLoading(false);
    }
  };
  
  const handleAdvanceCamp = async (userInput?: { type: 'text' | 'image'; data: string }) => {
    if (!learningCamp || !campProgress) return;

    let nextActivityIndex = campProgress.currentActivityIndex + 1;
    let nextDay = campProgress.currentDay;

    if (nextActivityIndex >= (learningCamp.days[nextDay - 1]?.activities.length || 0)) {
        nextActivityIndex = 0;
        nextDay += 1;
        if(nextDay <= learningCamp.duration) {
          logActivity('learning-camp', `Completed Day ${nextDay-1} of Learning Camp`, 100);
        } else {
          logActivity('learning-camp', `Graduated from a ${learningCamp.duration}-day Learning Camp!`, 250);
        }
    }
    
    setCampProgress({ currentDay: nextDay, currentActivityIndex: nextActivityIndex });
};

  const handleFetchParentTips = useCallback(async () => {
    if (!userProfile || !userProfile.activityLog || userProfile.activityLog.length === 0) {
        setParentTips(t('parentDashboard.emptyTimeline'));
        return;
    }
    setIsParentTipsLoading(true);
    try {
        const activitySummary = userProfile.activityLog
            .slice(0, 10) // Use last 10 activities for brevity
            .map(log => `- ${log.description} (XP: ${log.xpEarned})`)
            .join('\n');
            
        const prompt = `Based on this child's recent activity log, provide 3-4 actionable, positive, and personalized tips for their parents. The goal is to help the parent engage with their child's learning. Frame the tips as encouraging suggestions. The child's name is ${userProfile.name}.

Recent Activities:
${activitySummary}

Respond in the user's language: ${language === 'bn' ? 'Bengali' : 'English'}. Format the response as a bulleted list.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        setParentTips(response.text);

    } catch(e) {
        console.error("Error generating parent tips:", e);
        setParentTips("Could not generate tips at this time. Please try again later.");
    } finally {
        setIsParentTipsLoading(false);
    }
  }, [userProfile, language, t, ai.models]);

  useEffect(() => {
    if (screen === 'parent-dashboard') {
        handleFetchParentTips();
    }
  }, [screen, handleFetchParentTips]);

  // --- Core Handlers ---
  const goHome = useCallback(() => {
    setScreen("home");
    setActiveTab("Home");
  }, []);

  const handleCloseFeature = useCallback(() => {
    setQuizAnswered(false);
    setLastAnswerCorrect(false);
    setCurrentQuizSession([]);
    setCurrentQuestionIndex(0);
    setIsInQuizSession(false);
    setStory(null);
    setHomeworkMode(null);
    setHomeworkChatHistory([]);
    setHomeworkChat(null);
    setTreasureHunt(null);
    setLearningCamp(null);
    setCampProgress(null);
    goHome();
  }, [goHome]);

  const handleNav = (tab: ActiveTab) => {
    if (tab === "Menu") {
        setIsSidebarOpen(true);
        return;
    }
    setActiveTab(tab);
    switch (tab) {
      case "Home": setScreen("home"); break;
      case "Object Scan": setScreen("object-detector-gate"); break;
      case "Voice Assistant": setScreen("voice-assistant-gate"); break;
      case "Playground": setScreen("playground-gate"); break;
      case "Treasure Hunt": setScreen("treasure-hunt-gate"); break;
      case "Learning Camp": setScreen("learning-camp-gate"); break;
      case "Quiz": setScreen(isInQuizSession ? "result" : "quiz"); break;
      case "Rewards": setScreen("rewards"); break;
      case "Story": setScreen("story"); break;
      case "Homework": setScreen("homework"); break;
      case "Parent Dashboard": setScreen("parent-dashboard"); break;
    }
    setIsSidebarOpen(false);
  };

  const handleSidebarNav = (newScreen: Screen) => {
    if (newScreen === 'profile' || newScreen === 'about' || newScreen === 'terms' || newScreen === 'privacy' || newScreen === 'parent-dashboard') {
        setScreen(newScreen);
    }
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
        const base64Data = dataUrl.split(",")[1];
        return { inlineData: { data: base64Data, mimeType: "image/jpeg" } };
    };

    const handleGenerateHomeworkSolution = async (input: { text?: string; image?: { data: string; mimeType: string; }}) => {
        setIsHomeworkLoading(true);
        try {
            const langName = language === 'bn' ? 'Bengali' : 'English';
            const age = userProfile ? calculateAge(userProfile.dob) : 6;
            
            let contentParts: Part[] = [];
            let promptText = `Help a ${age}-year-old child with their ${homeworkMode} homework. Explain the solution in a simple, step-by-step, and encouraging way. The language must be ${langName}.`;

            if (input.text) {
                promptText += `\n\nHere is their question: "${input.text}"`;
            }
            contentParts.push({ text: promptText });
            
            if (input.image) {
                contentParts.push({ inlineData: { data: input.image.data, mimeType: input.image.mimeType }});
            }

            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `${activeAgent.systemInstruction} You are now a homework helper.`
                }
            });
            setHomeworkChat(newChat);
            
            // FIX: The `sendMessage` API expects the parts array directly under the `message` property.
            const response = await newChat.sendMessage({ message: contentParts });
            
            setHomeworkChatHistory([{ sender: 'buddy', text: response.text }]);
        } catch (e) {
            console.error("Homework generation error:", e);
            setError("Sorry, I couldn't generate a solution. Please try again.");
        } finally {
            setIsHomeworkLoading(false);
        }
    };
    
     const handleSendHomeworkFollowup = async (message: string) => {
        if (!homeworkChat) return;

        setHomeworkChatHistory(prev => [...prev, { sender: 'user', text: message }]);
        setIsHomeworkLoading(true);

        try {
            const response = await homeworkChat.sendMessage({ message });
            setHomeworkChatHistory(prev => [...prev, { sender: 'buddy', text: response.text }]);
        } catch (e) {
            console.error("Followup error:", e);
            setHomeworkChatHistory(prev => [...prev, { sender: 'buddy', text: "Oops, something went wrong. Can you ask that again?" }]);
        } finally {
            setIsHomeworkLoading(false);
        }
    };

  // --- Rendering Logic ---
  const renderScreen = () => {
    if (isAuthLoading) return <LoadingView t={t} />;

    switch (screen) {
      case "loading": return <LoadingView t={t} />;
      case "welcome": return <WelcomeScreen onSignIn={handleSignIn} onTryWithoutLogin={handleTryWithoutLogin} t={t} />;
      case "home": return <HomeView userProfile={userProfile} onNavigate={handleNav} t={t} />;
      case "object-detector-gate": return <ObjectDetectorGate onStart={(agent) => { setActiveAgent(agent); setScreen("media"); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "media": return <MediaView onCapture={(base64, mime) => { /* Logic here */ }} videoRef={videoRef} t={t} />;
      case "result": return <ResultView response={learningBuddyResponse} media={media} onAnswer={(i) => {}} answered={quizAnswered} correct={lastAnswerCorrect} onNext={() => {}} isInQuizSession={isInQuizSession} isLastQuestion={currentQuestionIndex === currentQuizSession.length - 1} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "quiz": return <QuizGate onStartQuiz={(agent) => { /* Logic here */ }} onStartCustomQuiz={(agent, topic) => { /* Logic here */ }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "quizSummary": return <QuizSummaryView correctAnswers={quizSessionCorrectAnswers} totalQuestions={currentQuizSession.length} level={userProfile?.progress.quizLevel || 1} onContinue={() => {}} onGoHome={goHome} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "story": return <StoryView story={story} onStart={(agent, context) => {}} onChoice={(choice) => {}} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "rewards": return <RewardsView progress={userProfile?.progress!} stickers={discoveredObjects} t={t} />;
      case "homework": return <HomeworkGate onSelectMode={(agent, mode) => { setActiveAgent(agent); setHomeworkMode(mode); setScreen('homework-solver'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "homework-solver": return <HomeworkSolverView mode={homeworkMode!} onGenerateSolution={handleGenerateHomeworkSolution} onScanRequest={() => { setIsScanningForHomework(true); setScreen('media'); }} chatHistory={homeworkChatHistory} onSendFollowup={handleSendHomeworkFollowup} isLoading={isHomeworkLoading} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "voice-assistant-gate": return <VoiceAssistantGate onAgentSelect={(agent) => { setSelectedAgent(agent); setScreen('voice-assistant'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "voice-assistant": return selectedAgent && <VoiceAssistantView agent={selectedAgent} history={voiceAssistantHistory} avatarState={agentAvatarState} isCameraEnabled={isCameraEnabled} setIsCameraEnabled={setIsCameraEnabled} localVideoEl={localVideoEl} onSendMessage={(msg) => {}} onBack={goHome} t={t} inputText={voiceAssistantInputText} setInputText={setVoiceAssistantInputText} />;
      case "playground-gate": return <PlaygroundGate onStart={(agent) => { setActiveAgent(agent); setScreen('playground-live'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "playground-live": return <PlaygroundLiveView videoRef={videoRef} narrationText={narrationText} onVideoReady={() => {}} t={t} />;
      case "profile": return <ProfileView profile={userProfile} onSave={handleSaveProfile} onClearData={handleClearData} onMinimize={goHome} onClose={goHome} t={t} />;
      case "treasure-hunt-gate": return <TreasureHuntGate onStart={(agent) => {}} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "treasure-hunt-active": return <TreasureHuntView hunt={treasureHunt} onScanRequest={() => { setIsScanningForTreasure(true); setScreen('media'); }} feedback={treasureHuntFeedback} onPlayAgain={() => {}} onGoHome={goHome} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "learning-camp-gate": return <LearningCampGate onStart={handleStartLearningCamp} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "learning-camp-view": return <LearningCampView camp={learningCamp} progress={campProgress} onAdvance={handleAdvanceCamp} isLoading={isCampLoading} onScanRequest={() => { setIsScanningForCamp(true); setScreen('media'); }} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "about": return <StaticPages.AboutUsScreen t={t} />;
      case "terms": return <StaticPages.TermsScreen t={t} />;
      case "privacy": return <StaticPages.PrivacyScreen t={t} />;
      case "parent-dashboard": return <StaticPages.ParentDashboardView profile={userProfile} tips={parentTips} isLoadingTips={isParentTipsLoading} t={t} />;
      default: return <HomeView userProfile={userProfile} onNavigate={handleNav} t={t} />;
    }
  };
  
  const showHeader = !['welcome', 'loading', 'voice-assistant', 'playground-live'].includes(screen);
  const showBottomNav = ['home'].includes(screen);
  const showBackButton = !['welcome', 'loading', 'home', 'voice-assistant', 'playground-live'].includes(screen);
  
  const headerTitleMapping: { [key: string]: string[] } = {
    home: ['home'],
    objectDetector: ['media', 'result', 'object-detector-gate'],
    funQuiz: ['quiz', 'quizSummary'],
    stickerBook: ['rewards'],
    storyTime: ['story'],
    homework: ['homework', 'homework-solver'],
    voiceAssistant: ['voice-assistant-gate'],
    playground: ['playground-gate'],
    profile: ['profile'],
    treasureHunt: ['treasure-hunt-gate', 'treasure-hunt-active'],
    learningCamp: ['learning-camp-gate', 'learning-camp-view'],
    about: ['about'],
    terms: ['terms'],
    privacy: ['privacy'],
    parentDashboard: ['parent-dashboard'],
  };
  const headerTitleKey = `header.${Object.keys(headerTitleMapping).find(key => headerTitleMapping[key].includes(screen)) || 'home'}`;


  return (
    <div className={`app-layout screen-${screen}`}>
      {isLangSelectorOpen && <LanguageSelector onSelect={setLanguage} onClose={() => setIsLangSelectorOpen(false)} t={t} />}
      {isSidebarOpen && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={handleSidebarNav} onFeatureNav={handleNav} t={t} isAuthenticated={!!firebaseUser} onSignIn={handleSignIn} onSignOut={handleSignOut} />}
       {treasureHuntProgressUpdate && <TreasureHuntProgress current={treasureHuntProgressUpdate.current} total={treasureHuntProgressUpdate.total} t={t} />}
      
      {showHeader && (
        <Header
          title={t(headerTitleKey)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isTtsOn={isTtsOn}
          onToggleTts={handleToggleTts}
          showBackButton={showBackButton}
          onBack={handleCloseFeature}
          onLanguageClick={() => setIsLangSelectorOpen(true)}
        />
      )}
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