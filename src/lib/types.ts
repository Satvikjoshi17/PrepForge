import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  topic?: string; // For analytics (strength/weakness)
  explanation?: string; // Why the answer is correct
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  description: string;
  questions: Question[];
  image: string;
  imageHint: string;
}

export interface QuizResponse {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selected: string; correct: string; isCorrect: boolean; topic?: string }[];
  completedAt: Timestamp;
  customParams?: {
    topic: string;
    difficulty: string;
    count: number;
    time: number;
  };
  quizCategory?: string;
}

export interface Interview {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  imageHint: string;
}

export interface InterviewResponse {
  id: string;
  userId: string;
  interviewId: string;
  interviewTitle: string;
  score: number;
  feedback: string;
  completedAt: Timestamp;
}

export type AvailableResource = {
  resourceId: string;
  title: string;
  category: string;
  type: 'quiz' | 'article' | 'studyMaterial';
  url: string;
  description: string;
};
