import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
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
    LearningCamp, CampProgress
} from './lib/types';
import { AGENT_PROFILES } from './lib/agents';
import { translations } from './lib/i18n';
import { Header } from './components/Header/Header';
import { BottomNav } from './components/BottomNav/BottomNav';
import { Sidebar } from './components/Sidebar/Sidebar';
import { LoadingView } from './components/LoadingView/LoadingView';
import { LanguageSelector } from './components/LanguageSelector/LanguageSelector';
import { TreasureHuntProgress } from './components/TreasureHuntProgress/TreasureHuntProgress';

import './App.css';
import StaticPages from './components/StaticPages/StaticPages';

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
    try {
        const savedProfileJson = localStorage.getItem('kided-user-profile');
        if (savedProfileJson) {
            setUserProfile(JSON.parse(savedProfileJson));
            setScreen("home");
        } else {
            setScreen("welcome");
        }
    } catch (e) {
        console.error("Failed to load user profile:", e);
        localStorage.removeItem('kided-user-profile');
        setScreen("welcome");
    }
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

  const updateUserProgress = useCallback((updater: (prevProgress: UserProgress) => UserProgress) => {
      setUserProfile(currentProfile => {
          if (!currentProfile) {
              console.warn("Attempted to update progress without a profile.");
              return null;
          }
          const newProgress = updater(currentProfile.progress);
          const updatedProfile = {
              ...currentProfile,
              progress: newProgress,
              updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('kided-user-profile', JSON.stringify(updatedProfile));
          return updatedProfile;
      });
  }, []);

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => {
      const now = new Date().toISOString();
      const newProfile: UserProfile = {
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
      };
      setUserProfile(newProfile);
      localStorage.setItem('kided-user-profile', JSON.stringify(newProfile));
      setScreen("home");
      setActiveTab("Home");
  };

  const handleClearData = () => {
      localStorage.removeItem('kided-user-profile');
      window.location.reload();
  };

  const requireProfile = useCallback(() => {
    if (!userProfile) {
        setPreviousScreen(screen);
        setScreen('profile');
        return true;
    }
    return false;
  }, [userProfile, screen]);
  

  // --- Core Handlers ---
  const handleStart = () => {
      if (!userProfile) {
          setScreen("profile");
      } else {
          setScreen("home");
      }
  }

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
      case "Home":
        setScreen("home");
        break;
      case "Object Scan":
        setScreen("object-detector-gate");
        break;
      case "Voice Assistant":
        setScreen("voice-assistant-gate");
        break;
      case "Playground":
        setScreen("playground-gate");
        break;
       case "Treasure Hunt":
        setScreen("treasure-hunt-gate");
        break;
       case "Learning Camp":
        setScreen("learning-camp-gate");
        break;
      case "Quiz":
        if (isInQuizSession) {
          setScreen("result");
        } else {
          setScreen("quiz");
        }
        break;
      case "Rewards":
        setScreen("rewards");
        break;
      case "Story":
        setScreen("story");
        break;
      case "Homework":
        setScreen("homework");
        break;
    }
    setIsSidebarOpen(false);
  };

  const handleSidebarNav = (newScreen: Screen) => {
      setPreviousScreen(screen);
      setScreen(newScreen);
      setIsSidebarOpen(false);
  }

  const handleBack = () => {
      if(screen === 'voice-assistant'){
          setScreen('voice-assistant-gate');
          setChat(null);
          setVoiceAssistantHistory([]);
          setSelectedAgent(null);
      } else if (screen === 'playground-live') {
          setScreen('playground-gate');
          setNarrationText('');
      } else if (screen === 'profile' || screen === 'treasure-hunt-active' || screen === 'learning-camp-view') {
          setScreen('home');
      }
      else {
        setScreen(previousScreen);
      }
  }

  const handleScanCapture = (base64Data: string, mimeType: string) => {
    setMedia({
      type: mimeType.startsWith("video") ? "video" : "image",
      data: base64Data,
    });
    generateContentForMedia(base64Data, mimeType, activeAgent);
  };
  
  const handleStartObjectDetector = (agent: AgentProfile) => {
    setActiveAgent(agent);
    setScreen('media');
  };

  const handleAnswerQuiz = (selectedIndex: number) => {
    if (!learningBuddyResponse || quizAnswered) return;
    setQuizAnswered(true);
    const correct =
      selectedIndex === learningBuddyResponse.quiz.correctAnswerIndex;
    setLastAnswerCorrect(correct);
    if (correct) {
      if (isInQuizSession) {
        setQuizSessionCorrectAnswers((prev) => prev + 1);
      }
      updateUserProgress((prev) => ({
        ...prev,
        stars: prev.stars + 1,
        xp: prev.xp + 5,
      }));
      speak(t('result.correct'));
    } else {
      speak(
        t('result.incorrect') +
          learningBuddyResponse.quiz.options[
            learningBuddyResponse.quiz.correctAnswerIndex
          ]
      );
    }
  };

  const handleNext = () => {
    if (isInQuizSession) {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < currentQuizSession.length) {
        setCurrentQuestionIndex(nextIndex);
        setLearningBuddyResponse((prev) => ({
          ...prev!,
          quiz: currentQuizSession[nextIndex],
        }));
        setQuizAnswered(false);
        setLastAnswerCorrect(false);
        speak(currentQuizSession[nextIndex].question);
      } else {
        updateUserProgress((prev) => ({
          ...prev,
          quizzesCompleted: prev.quizzesCompleted + currentQuizSession.length,
          quizLevel: prev.quizLevel + 1,
        }));
        setIsInQuizSession(false);
        setScreen("quizSummary");
      }
    } else {
      setLearningBuddyResponse(null);
      setMedia({ type: "image", data: "" });
      setQuizAnswered(false);
      setScreen("object-detector-gate");
    }
  };

  // --- AI & Generation ---
  
  const captureFrame = async (videoElementRef: React.RefObject<HTMLVideoElement>): Promise<Part | null> => {
    if (!isCameraEnabled || !videoElementRef.current || videoElementRef.current.videoWidth === 0) {
        return null;
    }
    try {
        const canvas = document.createElement("canvas");
        canvas.width = videoElementRef.current.videoWidth;
        canvas.height = videoElementRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
        const base64Data = dataUrl.split(",")[1];
        return { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
    } catch (err) {
        console.error("Could not capture frame:", err);
        return null;
    }
  };
  
  const generateContentForMedia = async (
    base64Data: string,
    mimeType: string,
    agent: AgentProfile
  ) => {
    if (requireProfile()) return;
    setScreen("loading");
    try {
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const age = userProfile ? calculateAge(userProfile.dob) : 6;
      const prompt =
        `${agent.systemInstruction} The child is ${age} years old. Identify the main object, animal, or scene in this media. Provide one or two very short, exciting fun facts about it. Suggest a sound it makes. Create one simple multiple-choice quiz question. Finally, give a short, positive encouragement. Format as a JSON object. IMPORTANT: Respond entirely in the ${langName} language.`;
      const contentPart: Part = {
        inlineData: { mimeType: mimeType, data: base64Data },
      };
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }, contentPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
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
              },
              encouragement: { type: Type.STRING },
            },
          },
        },
      });
      const buddyResponse = JSON.parse(response.text) as LearningBuddyResponse;

      // Generate a sticker for the discovered object
      const stickerPrompt = `A cute, joyful cartoon sticker of a ${buddyResponse.identification}, with a thick white border, vibrant colors, and a glossy finish.`;
      const imageResponse = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: stickerPrompt,
        config: { numberOfImages: 1, outputMimeType: "image/png" },
      });
      const stickerBase64 = imageResponse.generatedImages[0].image.imageBytes;
      const stickerUrl = `data:image/png;base64,${stickerBase64}`;

      setDiscoveredObjects((prev) => [
        ...prev,
        { name: buddyResponse.identification, stickerUrl: stickerUrl },
      ]);
      setLearningBuddyResponse(buddyResponse);
      updateUserProgress((p) => ({
        ...p,
        objectsDiscovered: p.objectsDiscovered + 1,
        xp: p.xp + 10,
      }));
      setScreen("result");
      speak(
        `${language === 'bn' ? 'ওয়াও, এটা একটা' : 'Wow, it\'s a'} ${buddyResponse.identification}! ${language === 'bn' ? 'এখানে কিছু মজার তথ্য দেওয়া হলো।' : 'Here are some fun facts.'}`
      );
    } catch (err) {
      console.error(err);
      setError(
        "Oops! I had a little trouble understanding that. Let's try something else!"
      );
      setScreen("media");
    }
  };

  const startNewQuizSession = async (agent: AgentProfile, topic?: string) => {
    if (requireProfile()) return;
    setActiveAgent(agent);
    setScreen("loading");
    try {
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const previousQuestions = quizHistory.slice(-50).join("; ");
      const numQuestions = topic ? 10 : 3;
      const quizLevel = userProfile?.progress.quizLevel || 1;
      const age = userProfile ? calculateAge(userProfile.dob) : 6;
      
      const topicInstruction = topic 
          ? `The questions MUST be about the following topic: "${topic}".`
          : "The questions should be about general knowledge topics like animals, science, or geography.";

      const prompt = `${agent.systemInstruction} You are now a quiz master. Generate a set of ${numQuestions} fun, multiple-choice quiz questions suitable for a ${age} year old child. ${topicInstruction}
The difficulty MUST be based on this level: ${quizLevel}. A level of 1 is for a preschooler (very easy). A level of 10 is for a 1st grader. A level of 100 is for a middle schooler. A level of 600+ is for a high school genius (super hard). Adjust the question's complexity, vocabulary, and subject matter accordingly.
IMPORTANT: Do not repeat any of these previous questions: [${previousQuestions}]. Generate completely new questions.
Ensure the options are clear and there's only one correct answer. Format the output as a JSON object with a single key "questions", which is an array of question objects. Each object should have keys: "question", "options" (an array of 4 strings), and "correctAnswerIndex" (a number from 0-3).
IMPORTANT: The entire response, including all text in the JSON, MUST be in the ${langName} language.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswerIndex: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      });

      const { questions } = JSON.parse(response.text) as {
        questions: QuizQuestion[];
      };
      if (questions && questions.length > 0) {
        setQuizHistory((prev) => [
          ...prev,
          ...questions.map((q) => q.question),
        ]);
        setCurrentQuizSession(questions);
        setCurrentQuestionIndex(0);
        setQuizSessionCorrectAnswers(0);
        setIsInQuizSession(true);
        setLearningBuddyResponse({
          identification: topic || `${t('header.quizTime')}! ${language === 'bn' ? 'স্তর' : 'Level'} ${quizLevel}`,
          funFacts: [],
          quiz: questions[0],
          encouragement: "Let's see what you know!",
        });
        setScreen("result");
        speak(questions[0].question);
      } else {
        throw new Error("Generated quiz has no questions.");
      }
    } catch (err) {
      console.error(err);
      setError(
        "I couldn't come up with a quiz right now. Let's try again!"
      );
      setIsInQuizSession(false);
      setScreen("quiz");
    }
  };

  const generateStory = async (agent: AgentProfile, choiceOrContext?: string) => {
    if (requireProfile()) return;
    setActiveAgent(agent);
    setScreen("loading");
    try {
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const isNewStory = !story;
      const age = userProfile ? calculateAge(userProfile.dob) : 6;

      let storyPromptPart = "";
      if (isNewStory) {
          if (choiceOrContext) { // This is a new story with custom context
              storyPromptPart = `Start a new interactive story about: ${choiceOrContext}.`;
          } else { // New story, no context, use discovered objects
              const heroes =
                  discoveredObjects.length > 0
                  ? discoveredObjects.map((o) => o.name).join(", ")
                  : language === 'bn' ? 'একটি সাহসী ছোট রোবট' : "a brave little robot";
              storyPromptPart = `The hero/heroes of the story can be: ${heroes}. Pick one and start a new story.`;
          }
      } else { // Continuing an existing story
          storyPromptPart = `The story so far: ${story.storyText}. The child chose: ${choiceOrContext}. Continue the story.`;
      }

      const prompt = `${agent.systemInstruction} You are now a storyteller for a child who is ${age} years old. ${storyPromptPart}
Write the next short paragraph of the story. Keep it simple, exciting, and friendly.
Then, give the child two clear choices for what to do next.
Format the output as a JSON object. IMPORTANT: The entire response must be in the ${langName} language.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              storyText: { type: Type.STRING },
              choices: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });
      
      const newSegmentData = JSON.parse(response.text) as Omit<StorySegment, 'backgroundImage'>;

      const imagePrompt = `Children's storybook illustration, simple and colorful, of: ${newSegmentData.storyText.substring(0, 150)}. Wide aspect ratio.`;
      const imageResponse = await ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: imagePrompt,
          config: { numberOfImages: 1, outputMimeType: 'image/png' }
      });

      const bgImageBase64 = imageResponse.generatedImages[0].image.imageBytes;
      const bgImageUrl = `data:image/png;base64,${bgImageBase64}`;

      const newSegment: StorySegment = {
        ...newSegmentData,
        backgroundImage: bgImageUrl,
      };

      setStory(newSegment);
      setScreen("story");
      speak(newSegment.storyText);
    } catch (err) {
      console.error(err);
      setError("Oh no! My storybook got stuck. Let's try again.");
      setScreen("story");
    }
  };
  
  const handleStartStory = (agent: AgentProfile, context?: string) => {
    generateStory(agent, context);
  }
  
  const handleStoryChoice = (choice: string) => {
    generateStory(activeAgent, choice);
  }

  // --- Homework Helper ---
  const handleStartHomework = (agent: AgentProfile, mode: HomeworkMode) => {
    setActiveAgent(agent);
    setHomeworkMode(mode);
    setHomeworkChatHistory([]);
    setHomeworkChat(null);
    setScreen("homework-solver");
  };

  const handleHomeworkScanCapture = (base64Data: string, mimeType: string) => {
    setIsScanningForHomework(false);
    generateHomeworkHelp({ image: { data: base64Data, mimeType } });
  };

  const generateHomeworkHelp = async (input: {
    text?: string;
    image?: { data: string; mimeType: string };
  }) => {
    if (!homeworkMode || (!input.text && !input.image)) return;
    setIsHomeworkLoading(true);
    setHomeworkChatHistory([]);
    setHomeworkChat(null);
    setScreen("homework-solver");

    try {
      const langName = language === 'bn' ? 'Bengali' : 'English';
      const prompts: Record<HomeworkMode, string> = {
        math: `You are a friendly math tutor. Explain the solution to this problem step-by-step. Keep the language simple and encouraging. Problem:`,
        science: `You are an exciting science teacher. Explain this science concept or answer this question in a simple, fun, and clear way. Question:`,
        essay: `You are a helpful writing assistant. Review this essay. Provide positive feedback and 3 simple suggestions for improvement on grammar, spelling, or clarity. Do not rewrite the essay. Essay:`,
        general: `You are a knowledgeable and friendly helper. Answer this question clearly and simply. Question:`,
      };
      
      const promptText = `${activeAgent.systemInstruction} IMPORTANT: Respond entirely in the ${langName} language. ${prompts[homeworkMode]} ${input.text || ""}`;
      const parts: Part[] = [{ text: promptText }];

      if (input.image) {
        parts.push({
          inlineData: {
            mimeType: input.image.mimeType,
            data: input.image.data,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
      });

      setHomeworkChatHistory([{ sender: 'buddy', text: response.text }]);
      speak(response.text);

      const followupSystemInstruction = `${activeAgent.systemInstruction} You are a helpful assistant continuing a conversation about a homework problem. The user's original query was about: ${input.text || "the attached image"}. You have already provided the first answer. Now, continue the conversation by answering their follow-up questions clearly and simply. IMPORTANT: Respond entirely in the ${langName} language.`;

      const newChat = ai.chats.create({
          model: "gemini-2.5-flash",
          config: { systemInstruction: followupSystemInstruction },
          history: [
              { role: "user", parts },
              { role: "model", parts: [{ text: response.text }] }
          ]
      });
      setHomeworkChat(newChat);

    } catch (err) {
      console.error("Homework Help Error:", err);
      const errorMsg = "I had a little trouble with that question. Could we try another one?";
      setHomeworkChatHistory([{ sender: 'buddy', text: errorMsg }]);
      speak(errorMsg);
    } finally {
      setIsHomeworkLoading(false);
    }
  };
  
  const handleSendHomeworkFollowup = async (message: string) => {
    if (!homeworkChat || !message.trim()) return;

    const userMessage: ChatMessage = { sender: 'user', text: message };
    setHomeworkChatHistory(prev => [...prev, userMessage]);
    setIsHomeworkLoading(true);

    try {
        // FIX: The sendMessage method expects an object with a `message` property, not a plain string.
        const response = await homeworkChat.sendMessage({ message });
        const buddyMessage: ChatMessage = { sender: 'buddy', text: response.text };
        setHomeworkChatHistory(prev => [...prev, buddyMessage]);
        speak(response.text);
    } catch (err) {
        console.error("Homework Follow-up Error:", err);
        const errorMessage: ChatMessage = { sender: 'buddy', text: "I'm not sure how to answer that. Can you ask another way?" };
        setHomeworkChatHistory(prev => [...prev, errorMessage]);
        speak(errorMessage.text);
    } finally {
        setIsHomeworkLoading(false);
    }
  };

  // --- Treasure Hunt ---
  const startTreasureHunt = async (agent: AgentProfile) => {
    if (requireProfile()) return;
    setActiveAgent(agent);
    setScreen('loading');
    setTreasureHunt(null);

    try {
        const langName = language === 'bn' ? 'Bengali' : 'English';
        const age = userProfile ? calculateAge(userProfile.dob) : 6;
        const prompt = `${agent.systemInstruction} Create a 3-step treasure hunt for a ${age}-year-old child inside a house. For each step, provide a simple 'clueText' (e.g., 'Find something you use to write or draw') and a 'targetDescription' for AI validation (e.g., 'a pen, pencil, or crayon'). Respond ONLY with a JSON object. IMPORTANT: The entire response, including all text in the JSON, MUST be in the ${langName} language.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
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
                            },
                        },
                    },
                },
            },
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
        setScreen('treasure-hunt-active');
    } catch (err) {
        console.error("Treasure Hunt generation error:", err);
        setError("I couldn't think of a treasure hunt right now. Let's try again later!");
        setScreen('treasure-hunt-gate');
    }
  };
  
  const handleTreasureScanCapture = (base64Data: string, mimeType: string) => {
    setIsScanningForTreasure(false);
    validateTreasureItem(base64Data, mimeType);
  };
  
  const validateTreasureItem = async (base64Data: string, mimeType: string) => {
      if (!treasureHunt) return;
      setScreen('loading');
      setTreasureHuntFeedback(null);
      
      const currentClue = treasureHunt.clues[treasureHunt.currentClueIndex];

      try {
          const langName = language === 'bn' ? 'Bengali' : 'English';
          const prompt = `${activeAgent.systemInstruction} The user is looking for: '${currentClue.targetDescription}'. Does this image contain such an object? Respond ONLY with a JSON object. The 'match' field should be a boolean. The 'reason' field should be a short, encouraging sentence for a child explaining why it does or doesn't match, or identifying the object if it's wrong. IMPORTANT: The response must be in ${langName}.`;
          const contentPart: Part = { inlineData: { mimeType: mimeType, data: base64Data } };

          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: { parts: [{ text: prompt }, contentPart] },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          match: { type: Type.BOOLEAN },
                          reason: { type: Type.STRING },
                      },
                  },
              },
          });
          
          const { match, reason } = JSON.parse(response.text);
          setTreasureHuntFeedback(reason);
          speak(reason);
          
          if (match) {
              updateUserProgress(p => ({ ...p, stars: p.stars + 5, xp: p.xp + 20 }));
              const newClues = [...treasureHunt.clues];
              newClues[treasureHunt.currentClueIndex].found = true;
              const nextIndex = treasureHunt.currentClueIndex + 1;

              setTreasureHuntProgressUpdate({ current: nextIndex, total: newClues.length });
              setScreen('treasure-hunt-active');

              setTimeout(() => {
                  setTreasureHuntProgressUpdate(null);
                  setTreasureHunt(prevHunt => {
                      if (!prevHunt) return null;
                      if (nextIndex >= newClues.length) {
                          updateUserProgress(p => ({ ...p, stars: p.stars + 10, xp: p.xp + 50 }));
                          return { ...prevHunt, clues: newClues, isComplete: true };
                      }
                      return { ...prevHunt, clues: newClues, currentClueIndex: nextIndex };
                  });
              }, 3000); // Display card for 3 seconds
          } else {
            setScreen('treasure-hunt-active');
          }

      } catch (err) {
          console.error("Treasure Hunt validation error:", err);
          setTreasureHuntFeedback("I'm having a little trouble seeing. Let's try scanning again!");
          setScreen('treasure-hunt-active');
      }
  };


  // --- Voice Assistant ---
    const handleAgentSelect = async (agent: AgentProfile) => {
        setSelectedAgent(agent);
        setActiveAgent(agent); // For consistency
        const langName = language === 'bn' ? 'Bengali' : 'English';
        
        // Setup Gemini Chat
        const newChat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: `${agent.systemInstruction} IMPORTANT: Your entire response must be in the ${langName} language.`
            }
        });
        setChat(newChat);
        
        // Add welcome message
        const welcomeMessage = { sender: 'buddy' as const, text: t('voiceAssistant.welcome') };
        setVoiceAssistantHistory([welcomeMessage]);
        
        setScreen('voice-assistant');
    };

    const handleSendMessage = async (userInput: string) => {
        if (!userInput.trim() || !chat || !selectedAgent) return;
        
        const userMessage: ChatMessage = { sender: "user", text: userInput };
        setVoiceAssistantHistory(prev => [...prev, userMessage]);
        setAgentAvatarState('thinking');

        const imagePart = await captureFrame(localVideoEl);
        const textPart: Part = { text: userInput };
        const parts = imagePart ? [imagePart, textPart] : [textPart];
        
        try {
            const responseStream = await chat.sendMessageStream({ message: parts });
            let streamedText = '';
            let firstChunkReceived = false;
            
            for await (const chunk of responseStream) {
                if (!firstChunkReceived) {
                    setAgentAvatarState('speaking');
                    firstChunkReceived = true;
                }
                streamedText += chunk.text;
                setVoiceAssistantHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.sender === 'buddy') {
                        lastMessage.text = streamedText;
                        return [...prev.slice(0, -1), lastMessage];
                    } else {
                         return [...prev, { sender: 'buddy', text: streamedText }];
                    }
                });
                speak(chunk.text);
            }

        } catch(err) {
            console.error("Gemini stream error:", err);
            const errorMessage: ChatMessage = { sender: "buddy", text: "Oops, I got a little stuck. Can you say that again?" };
            setVoiceAssistantHistory(prev => [...prev, errorMessage]);
            speak(errorMessage.text);
        } finally {
            setAgentAvatarState('idle');
        }
    };
    
      // --- Learning Camp ---
    const generateNextCampActivity = async (
        day: number, 
        activityIndex: number, 
        totalDuration: number,
        userInput?: { type: 'text' | 'image'; data: string }
    ) => {
        setIsCampLoading(true);
        if (activityIndex === 0 && day === 1) {
            setScreen('loading');
        }
        
        try {
            const langName = language === 'bn' ? 'Bengali' : 'English';
            const activityTypes = ['trail', 'experiment', 'story', 'wrap-up'];
            const currentActivityType = activityTypes[activityIndex % 4];
            const age = userProfile ? calculateAge(userProfile.dob) : 6;
            
            let userInputPromptPart = '';
            if (userInput) {
                if (userInput.type === 'text') {
                    userInputPromptPart = `The child's previous text input was: "${userInput.data}". React to this in your dialogue.`;
                } else {
                     userInputPromptPart = `The child has just submitted an image. In your dialogue, react to what you see in the image provided. For example, if they submitted their balloon rocket, say something like "Whoa, that looks amazing! Great job!". If it's a 'Vision Quest' and they submitted a picture of a lamp, explain the science of light bulbs.`;
                }
            }

            const exampleScript = `
Here is a perfect example of a Day 1 script. Follow this style, tone, and structure.
--- EXAMPLE START ---
- Activity 1 (trail):
  - Title: "The Bridge of Numbers"
  - Dialogue: "Okay, so our first mission is to cross this wobbly bridge 🪵. But here’s the twist — the planks only appear if you solve the puzzle. Don’t worry, I’ll give you a hint… imagine you’ve got 2 apples, and I give you 3 more. How many snack-ready apples do you have now?"
  - Question: "2 + 3 = ?"
  - Options: ["4", "5", "6", "3"]
  - CorrectAnswerIndex: 1
  - Explanation: "Boom! Nailed it. That’s the exact same math engineers use when figuring out how much weight a bridge can hold."
- Activity 2 (experiment):
  - Title: "Kitchen Rocket Lab"
  - Dialogue: "Now we’re heading to our secret camp lab. Today’s experiment: making a rocket… out of stuff in your kitchen. 🚀 You’ll need a balloon, a straw, and some tape. Got it? Awesome."
  - Materials: ["Balloon", "Straw", "Tape", "String"]
  - Steps: ["1. Thread the string through the straw.", "2. Tape the straw to a blown-up balloon.", "3. Let go of the balloon and watch it zoom!"]
  - Explanation: "When you let the balloon go, the air rushes out and pushes it forward. That’s Newton’s Third Law: for every action, there’s an equal and opposite reaction. Same rule rockets use to blast astronauts into space!"
- Activity 3 (story):
  - Title: "Story Valley Adventure"
  - Dialogue: "Before we call it a night, let’s go on a mini story quest. You’re exploring a jungle when — uh oh — a river blocks your path. What do you do?"
  - Options: ["Build a raft", "Swing on a vine"]
- Activity 4 (wrap-up):
  - Title: "Day 1 Wrap-Up!"
  - Dialogue: "Campers, you crushed it today. You solved puzzles, built a rocket, and even survived the jungle. That’s what I call a solid Day 1 at Learning Camp! Remember — science isn’t about being the smartest person in the room. It’s about being curious and trying stuff out."
  - BadgeName: "Junior Inventor – Day 1"
  - FunFact: "Did you know a single bolt of lightning is hotter than the surface of the sun?"
--- EXAMPLE END ---
`;

            const prompt = `You are Mark Rober, hosting a ${totalDuration}-day STEM camp for a ${age} year old child. Your persona is enthusiastic, curious, inspiring, and fun.
            ${exampleScript}
            
            Now, generate the content for Day ${day}, Activity ${activityIndex + 1}. The activity type is: "${currentActivityType}".
            ${userInputPromptPart}

            - For 'trail': Create a simple, themed multiple-choice math or science puzzle. 'inputType' must be 'choice'. You must include 'question', 'options', 'correctAnswerIndex', and 'explanation'.
            - For 'experiment': Create a simple, hands-on experiment. 'inputType' must be 'camera' to ask them to show you their result. You must include 'materials', 'steps', and 'explanation'.
            - For 'story': Write the next part of a science-themed story and provide two choices. 'inputType' must be 'choice'. You must include 'options'.
            - For 'wrap-up': Write a short, encouraging summary and award a badge. If this is the final day (Day ${totalDuration}), make it a "Graduation Ceremony" speech. 'inputType' must be 'none'. You must include 'badgeName' and 'funFact'.
            - For creative challenges (if you want to make one instead of a standard type): Ask an open-ended question (e.g., "Design a new animal for Mars"). 'inputType' must be 'text'.

            IMPORTANT: The entire response must be in ${langName}. Respond ONLY with a JSON object.`;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    type: { type: Type.STRING, description: "Should be one of: trail, experiment, story, wrap-up" },
                    dialogue: { type: Type.STRING, description: "Mark Rober's introductory text for the activity." },
                    inputType: { type: Type.STRING, description: "Must be one of: choice, text, camera, or none" },
                    question: { type: Type.STRING, description: "For 'trail' type" },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For 'trail' and 'story' types" },
                    correctAnswerIndex: { type: Type.INTEGER, description: "For 'trail' type" },
                    materials: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For 'experiment' type" },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For 'experiment' type" },
                    explanation: { type: Type.STRING, description: "For 'experiment' and 'trail' types" },
                    badgeName: { type: Type.STRING, description: "For 'wrap-up' type" },
                    funFact: { type: Type.STRING, description: "For 'wrap-up' type" },
                },
            };
            
            const contentParts: Part[] = [{ text: prompt }];
            if (userInput?.type === 'image') {
                contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: userInput.data } });
            }

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: contentParts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            const activityData = JSON.parse(response.text);
            
            setLearningCamp(prevCamp => {
                if (!prevCamp) return null;
                const newDays = [...prevCamp.days];
                while (newDays.length < day) {
                    newDays.push({ activities: [] });
                }
                newDays[day - 1].activities.push(activityData);
                return { ...prevCamp, days: newDays };
            });

            setScreen('learning-camp-view');

        } catch (err) {
            console.error("Learning Camp generation error:", err);
            setError("Oops! My camp planner got stuck. Let's try again!");
            setScreen('learning-camp-gate');
        } finally {
            setIsCampLoading(false);
        }
    };
    
    const handleStartLearningCamp = async (duration: number) => {
        if (requireProfile()) return;
        
        setActiveAgent(AGENT_PROFILES.MarkRober);
        setLearningCamp({ duration, days: [] });
        setCampProgress({ currentDay: 1, currentActivityIndex: 0 });
        
        await generateNextCampActivity(1, 0, duration);
    };

    const handleAdvanceCamp = async (userInput?: { type: 'text' | 'image'; data: string }) => {
        if (!learningCamp || !campProgress) return;

        const currentDayData = learningCamp.days[campProgress.currentDay - 1];
        const nextActivityIndex = campProgress.currentActivityIndex + 1;
        
        const totalActivitiesPerDay = 4;
        if (nextActivityIndex < totalActivitiesPerDay) {
            setCampProgress({ ...campProgress, currentActivityIndex: nextActivityIndex });
            await generateNextCampActivity(campProgress.currentDay, nextActivityIndex, learningCamp.duration, userInput);
        } else {
            const nextDay = campProgress.currentDay + 1;
            if (nextDay <= learningCamp.duration) {
                setCampProgress({ currentDay: nextDay, currentActivityIndex: 0 });
                await generateNextCampActivity(nextDay, 0, learningCamp.duration, userInput);
            } else {
                setCampProgress({ ...campProgress, currentDay: nextDay }); // Mark camp as finished
            }
        }
    };
    
    const handleCampScanCapture = (base64Data: string, mimeType: string) => {
        setIsScanningForCamp(false);
        handleAdvanceCamp({ type: 'image', data: base64Data });
    };


  // --- Speech Synthesis ---
  const speak = (text: string) => {
    if (!isTtsOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const targetLang = language === 'bn' ? 'bn-BD' : 'en-US';
    utterance.lang = targetLang;
        
    utterance.onstart = () => setIsAgentSpeaking(true);
    utterance.onend = () => setIsAgentSpeaking(false);
    utterance.onerror = () => setIsAgentSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  
  const handleStartPlayground = (agent: AgentProfile) => {
    setActiveAgent(agent);
    setScreen('playground-live');
  };


  // --- UI Components ---
  const isStaticPage = ['about', 'terms', 'privacy'].includes(screen);
  const userProgress = userProfile?.progress || { stars: 0, quizzesCompleted: 0, objectsDiscovered: 0, learningStreak: 0, quizLevel: 1, xp: 0 };
  
  const getHeaderTitle = () => {
    if (isStaticPage) {
        switch(screen) {
            case 'about': return t('header.about');
            case 'terms': return t('header.terms');
            case 'privacy': return t('header.privacy');
        }
    }
    if (screen === 'profile') return t('header.profile');
    if (isInQuizSession && screen === "result") {
      const questionText = language === 'bn' ? 'প্রশ্ন' : 'Question';
      return `${questionText} ${currentQuestionIndex + 1} / ${currentQuizSession.length}`;
    }
    if (screen === "loading") return t('header.thinking');
    if (screen === "quiz" && learningBuddyResponse) return t('header.quizTime');
    if (screen === "homework-solver" && homeworkMode) return t(`homework.${homeworkMode}`);
    if (screen === 'voice-assistant-gate') return t('header.chats');
    if (screen === 'playground-gate' || screen === 'playground-live' || screen === 'object-detector-gate') return t('header.playground');
    if (screen === 'treasure-hunt-gate' || screen === 'treasure-hunt-active') return t('header.treasureHunt');
    if (screen === 'learning-camp-gate' || screen === 'learning-camp-view') return t('header.learningCamp');

    switch (activeTab) {
      case "Home": return t('header.home');
      case "Object Scan": return t('header.objectDetector');
      case "Quiz": return t('header.funQuiz');
      case "Rewards": return t('header.stickerBook');
      case "Story": return t('header.storyTime');
      case "Homework": return t('header.homework');
      case "Playground": return t('header.playground');
      case "Treasure Hunt": return t('header.treasureHunt');
      case "Learning Camp": return t('header.learningCamp');
      default: return "KidEd";
    }
  };

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  if (isScanningForHomework) {
      return <MediaView onCapture={handleHomeworkScanCapture} videoRef={videoRef} t={t} />;
  }
  
  if (isScanningForTreasure) {
      return <MediaView onCapture={handleTreasureScanCapture} videoRef={videoRef} t={t} />;
  }
  
  if (isScanningForCamp) {
      return <MediaView onCapture={handleCampScanCapture} videoRef={videoRef} t={t} />;
  }

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return <WelcomeScreen onStart={handleStart} t={t} />;
      case "home":
        return <HomeView userProfile={userProfile} onNavigate={(tab) => handleNav(tab)} t={t} />;
      case "object-detector-gate":
        return <ObjectDetectorGate onStart={handleStartObjectDetector} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "media":
        return <MediaView onCapture={handleScanCapture} videoRef={videoRef} t={t} />;
      case "loading":
        return <LoadingView t={t} />;
      case "result":
        return (
          <ResultView
            response={learningBuddyResponse}
            media={media}
            onAnswer={handleAnswerQuiz}
            answered={quizAnswered}
            correct={lastAnswerCorrect}
            onNext={handleNext}
            isInQuizSession={isInQuizSession}
            isLastQuestion={
              currentQuestionIndex === currentQuizSession.length - 1
            }
            onMinimize={goHome}
            onClose={handleCloseFeature}
            t={t}
          />
        );
      case "voice-assistant-gate":
        return <VoiceAssistantGate onAgentSelect={handleAgentSelect} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "voice-assistant":
        if (!selectedAgent) {
          return <VoiceAssistantGate onAgentSelect={handleAgentSelect} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
        }
        return (
            <VoiceAssistantView
                agent={selectedAgent}
                history={voiceAssistantHistory}
                avatarState={agentAvatarState}
                isCameraEnabled={isCameraEnabled}
                setIsCameraEnabled={setIsCameraEnabled}
                localVideoEl={localVideoEl}
                onSendMessage={handleSendMessage}
                onBack={handleBack}
                t={t}
                inputText={voiceAssistantInputText}
                setInputText={setVoiceAssistantInputText}
            />
        );
      case "playground-gate":
        return <PlaygroundGate onStart={handleStartPlayground} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "playground-live":
        return <PlaygroundLiveView videoRef={videoRef} narrationText={narrationText} onVideoReady={() => {}} t={t} />;
      case "quiz":
        return <QuizGate onStartQuiz={startNewQuizSession} onStartCustomQuiz={startNewQuizSession} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "rewards":
        return <RewardsView progress={userProgress} stickers={discoveredObjects} t={t} />;
      case "story":
        return <StoryView story={story} onStart={handleStartStory} onChoice={handleStoryChoice} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "quizSummary":
        return (
          <QuizSummaryView
            correctAnswers={quizSessionCorrectAnswers}
            totalQuestions={currentQuizSession.length}
            level={userProgress.quizLevel}
            onContinue={() => startNewQuizSession(activeAgent)}
            onGoHome={() => handleNav("Home")}
            onMinimize={goHome}
            onClose={handleCloseFeature}
            t={t}
          />
        );
       case "homework":
        return <HomeworkGate onSelectMode={handleStartHomework} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
       case "homework-solver":
        return (
          <HomeworkSolverView
            mode={homeworkMode!}
            onGenerateSolution={generateHomeworkHelp}
            onScanRequest={() => setIsScanningForHomework(true)}
            chatHistory={homeworkChatHistory}
            onSendFollowup={handleSendHomeworkFollowup}
            isLoading={isHomeworkLoading}
            onMinimize={goHome}
            onClose={handleCloseFeature}
            t={t}
          />
        );
       case "treasure-hunt-gate":
            return <TreasureHuntGate onStart={startTreasureHunt} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
       case "treasure-hunt-active":
            return <TreasureHuntView hunt={treasureHunt} onScanRequest={() => setIsScanningForTreasure(true)} feedback={treasureHuntFeedback} onPlayAgain={() => startTreasureHunt(activeAgent)} onGoHome={() => handleNav("Home")} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
       case "learning-camp-gate":
            return <LearningCampGate onStart={handleStartLearningCamp} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
       case "learning-camp-view":
            return <LearningCampView camp={learningCamp} progress={campProgress} onAdvance={handleAdvanceCamp} isLoading={isCampLoading} onScanRequest={() => setIsScanningForCamp(true)} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "profile":
        return <ProfileView profile={userProfile} onSave={handleSaveProfile} onClearData={handleClearData} onMinimize={goHome} onClose={handleCloseFeature} t={t} />;
      case "about": return <StaticPages.AboutUsScreen t={t} />;
      case "terms": return <StaticPages.TermsScreen t={t} />;
      case "privacy": return <StaticPages.PrivacyScreen t={t} />;
      default:
        return <LoadingView t={t} />;
    }
  };

  const showHeader = screen !== "welcome" && !['voice-assistant', 'playground-live'].includes(screen);

  return (
    <div className={`app-layout screen-${screen}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={handleSidebarNav} 
        onFeatureNav={handleNav}
        t={t} 
      />
      {isLangSelectorOpen && <LanguageSelector onSelect={setLanguage} onClose={() => setIsLangSelectorOpen(false)} t={t} />}
      {treasureHuntProgressUpdate && (
        <TreasureHuntProgress
          current={treasureHuntProgressUpdate.current}
          total={treasureHuntProgressUpdate.total}
          t={t}
        />
      )}
      {showHeader && (
        <Header
          title={getHeaderTitle()}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isTtsOn={isTtsOn}
          onToggleTts={handleToggleTts}
          showBackButton={isStaticPage || screen === 'homework-solver' || screen === 'profile' || screen === 'treasure-hunt-active' || screen === 'learning-camp-view'}
          onBack={handleBack}
          onLanguageClick={() => setIsLangSelectorOpen(true)}
        />
      )}
      <main>
        <Suspense fallback={<LoadingView t={t} />}>
            {renderScreen()}
        </Suspense>
      </main>
      {screen !== "welcome" && !isStaticPage && !['voice-assistant', 'playground-live'].includes(screen) && (
        <BottomNav activeTab={activeTab} onNav={handleNav} t={t} />
      )}
    </div>
  );
};

export default App;