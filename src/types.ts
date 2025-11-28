export enum EducationLevel {
  PRIMARY = 'Primary',
  MIDDLE = 'Middle School',
  HIGH = 'High School',
  UNIVERSITY = 'University'
}

export enum Language {
  AR = 'ar',
  EN = 'en',
  FR = 'fr',
  ES = 'es'
}

export type ChatMode = 'normal' | 'thinking' | 'research' | 'search' | 'study';

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'matching' | 'table';
  options?: string[];
  correctAnswer?: string; // For standard questions
  matchingPairs?: MatchingPair[]; // For matching questions
  // For table questions
  tableHeaders?: string[];
  tableRows?: string[][]; // The full correct table rows
  explanation?: string;
}

export interface QuizResult {
  id?: string;
  title: string;
  questions: QuizQuestion[];
  createdAt?: number;
}

export interface SummaryResult {
  id?: string;
  topic: string;
  content: string;
  level: EducationLevel;
  createdAt: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachment?: {
    data: string;
    mimeType: string;
    name?: string;
  };
}

// Gamification Types
export interface Badge {
  id: string;
  icon: string; // Lucide icon name or emoji
  name: Record<string, string>; // Localized name
  description: Record<string, string>; // Localized description
  condition: string;
  unlockedAt?: number;
}

export interface UserProfile {
  xp: number;
  level: number;
  badges: Badge[];
  streak: number;
  lastActive: number;
}

// Planner Types
export interface StudySession {
  time: string;
  subject: string;
  activity: string;
  notes?: string;
}

export interface DailyPlan {
  day: string;
  sessions: StudySession[];
}

export interface StudyPlan {
  id: string;
  title: string;
  schedule: DailyPlan[];
  createdAt: number;
  }
