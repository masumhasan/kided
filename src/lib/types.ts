import type React from 'react';

// FIX: Updated the global JSX type definition for the 'lottie-player' custom element to resolve unrecognized element errors.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        background?: string;
        speed?: string;
        loop?: boolean;
        autoplay?: boolean;
      };
    }
  }
}

// Screens and Navigation
export type Screen =
  | "welcome"
  | "home"
  | "media"
  | "loading"
  | "result"
  | "quiz"
  | "rewards"
  | "story"
  | "quizSummary"
  | "homework"
  | "homework-solver"
  | "voice-assistant-gate"
  | "voice-assistant"
  | "playground-gate"
  | "playground-live"
  | "profile"
  | "treasure-hunt-gate"
  | "treasure-hunt-active"
  | "learning-camp-gate"
  | "learning-camp-view"
  | "object-detector-gate"
  | "about"
  | "terms"
  | "privacy";
  
export type ActiveTab = "Home" | "Object Scan" | "Story" | "Quiz" | "Rewards" | "Menu" | "Homework" | "Voice Assistant" | "Playground" | "Treasure Hunt" | "Learning Camp";
export type MediaType = 'image' | 'video' | 'audio';

// Language
export type Language = 'en' | 'bn';

// AI & Learning Content
export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
};

export type LearningBuddyResponse = {
  identification: string;
  funFacts: string[];
  soundSuggestion?: string;
  quiz: QuizQuestion;
  encouragement: string;
};

export type StorySegment = {
  storyText: string;
  choices: string[];
  backgroundImage: string;
};

export type ChatMessage = {
  sender: 'user' | 'buddy';
  text: string;
};

// User Profile & Progress
export type DiscoveredObject = {
  name: string;
  stickerUrl: string;
};

export type UserProgress = {
    stars: number;
    quizzesCompleted: number;
    objectsDiscovered: number;
    learningStreak: number;
    quizLevel: number;
    xp: number;
};

export type FamilyMember = {
    id: string;
    name: string;
    relationship: string;
};

export type UserProfile = {
    id: string;
    name: string;
    dob: string;
    familyMembers: FamilyMember[];
    progress: UserProgress;
    createdAt: string;
    updatedAt: string;
};

// Feature-specific types
export type HomeworkMode = 'math' | 'science' | 'essay' | 'general';
export type AgentAvatarState = 'idle' | 'thinking' | 'speaking';

export type AgentName = "Adam" | "MarkRober" | "MrBeast" | "Eva";

export type AgentProfile = {
    name: AgentName;
    descriptionKey: string;
    voiceId: string;
    systemInstruction: string;
};

export type TreasureHuntClue = {
    clueText: string;
    targetDescription: string;
    found: boolean;
};

export type TreasureHunt = {
    id: string;
    title: string;
    clues: TreasureHuntClue[];
    currentClueIndex: number;
    isComplete: boolean;
};

// Learning Camp Types
export type CampActivityType = 'trail' | 'experiment' | 'story' | 'wrap-up';

export interface CampActivity {
  title: string;
  type: CampActivityType;
  dialogue: string;
  inputType: 'choice' | 'text' | 'camera' | 'none';
  question?: string;
  options?: string[];
  correctAnswerIndex?: number;
  materials?: string[];
  steps?: string[];
  explanation?: string;
  badgeName?: string;
  funFact?: string;
}

export interface CampDay {
  activities: CampActivity[];
}

export interface LearningCamp {
  duration: number;
  days: CampDay[];
}

export interface CampProgress {
  currentDay: number;
  currentActivityIndex: number;
}