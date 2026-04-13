export type SubjectStatus = 'Critical' | 'Weak' | 'Strong';

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'link' | 'video' | 'pdf' | 'other';
}

export interface Topic {
  id: string;
  title: string;
  mastery: number;
  image?: string;
  resources?: Resource[];
  // SRS Fields
  lastReviewed?: string; // ISO Date
  nextReview?: string;   // ISO Date
  interval?: number;     // Days
  easeFactor?: number;   // Default 2.5
  reviewCount?: number;
}

export interface WeeklyTask {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskFrequency = 'Daily' | 'Weekly' | 'Monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  frequency: TaskFrequency;
  completed: boolean;
  subjectId?: string;
  dueDate?: string;
  createdAt: string;
  impact: number; // 1-10 (Signal)
  effort: number; // 1-10 (Noise)
  lastReviewed?: string; // ISO Date for spaced repetition
  difficulty?: number; // 1-10 for practice tasks
}

export interface Subject {
  id: string;
  name: string;
  score: number;
  focus: number;
  weakCount: number;
  status: SubjectStatus;
  priorityScore: number;
  readiness: number;
  gradient: string;
  image?: string;
  topics: Topic[];
  examDate?: string;
  notes?: string;
  weeklyTasks?: WeeklyTask[];
}

export interface AIPlanTask {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  duration: number; // minutes
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface AIStudyPlan {
  id: string;
  date: string;
  tasks: AIPlanTask[];
  summary: string;
}

export interface StudyLog {
  id: string;
  subjectId: string;
  topicId?: string; // Optional for backward compatibility
  topicIds?: string[]; // Array of topics covered (useful for tuition)
  duration: number;
  focusLevel: number;
  notes: string;
  timestamp: string;
  resources?: string[];
  sessionType?: 'self-study' | 'tuition' | 'exam'; // Type of session
}

export interface Activity {
  id: string;
  time: string;
  description: string;
  type: 'study' | 'tuition' | 'break' | 'rest';
}

export type WeeklySchedule = {
  [key in 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday']: Activity[];
};

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  liked?: boolean;
  dismissed?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  type: 'mastery' | 'streak' | 'sessions' | 'time';
  requirement: number;
}

export interface ExamRecord {
  id: string;
  title: string;
  date: string;
  marks: {
    subjectId: string;
    score: number;
  }[];
  totalScore: number;
  averageScore: number;
  rank?: number;
  notes?: string;
}

export interface UserProfile {
  points: number;
  streak: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  lastStudyDate?: string;
  badges: Badge[];
  totalSessions: number;
  totalStudyTime: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
