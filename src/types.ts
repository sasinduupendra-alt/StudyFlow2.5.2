export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  joinedAt: string;
  targetExam?: string;
  dailyGoalMinutes?: number;
  level: number;
  streak: number;
  xp: number;
  xpToNextLevel: number;
  points: number;
  badges: Badge[];
  totalSessions: number;
  totalStudyTime: number;
}

export interface Subject {
  id: string;
  name: string;
  score: number;
  focus: number;
  weakCount: number;
  status: string;
  priorityScore: number;
  readiness: number;
  gradient: string;
  image: string;
  examDate: string;
  notes: string;
  weeklyTasks: { id: string; title: string; completed: boolean }[];
  topics: Topic[];
  totalStudyTime: number;
}

export interface Topic {
  id: string;
  title: string;
  mastery: number;
  image: string;
  lastReviewed?: string;
  nextReview?: string;
  interval?: number;
  easeFactor?: number;
  reviewCount?: number;
  resources?: Resource[];
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'pdf' | 'link';
}

export interface Activity {
  id: string;
  time: string;
  description: string;
  type: 'study' | 'tuition' | 'break' | 'rest';
  focusMode?: boolean;
}

export type WeeklySchedule = {
  [key in 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday']: Activity[];
};

export interface StudyLog {
  id: string;
  subjectId: string;
  topicIds: string[];
  duration: number;
  focusLevel: number;
  performance: number;
  timestamp: string;
  notes?: string;
  tags?: string[];
  sessionType?: string;
  topicId?: string;
  resources?: string[];
}

export interface ExamRecord {
  id: string;
  subjectId?: string;
  score?: number;
  date: string;
  type?: string;
  title: string;
  averageScore: number;
  totalScore: number;
  marks: { subjectId: string; score: number }[];
  rank?: number;
  notes?: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'optimization' | 'focus' | 'rest';
  impact: 'High' | 'Medium' | 'Low';
  dismissed?: boolean;
  liked?: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  reason?: string;
}

export interface AIStudyPlan {
  id: string;
  date: string;
  tasks: AIPlanTask[];
  summary?: string;
}

export interface AIPlanTask {
  id: string;
  title: string;
  duration: number;
  startTime: string;
  endTime: string;
  completed: boolean;
  subjectId?: string;
  reason?: string;
  priority?: 'High' | 'Medium' | 'Low';
  topicId?: string;
}

export type TaskFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'One-time';

export interface Task {
  id: string;
  title: string;
  description?: string;
  frequency: TaskFrequency | string;
  completed: boolean;
  subjectId?: string;
  createdAt: string;
  impact: number;
  effort: number;
  dueDate?: string;
  difficulty?: number;
  lastReviewed?: string;
  focusMode?: boolean;
}

export interface WeeklyTask {
  id: string;
  title: string;
  completed: boolean;
}

export type FocusMode = 'IDLE' | 'RITUAL' | 'FOCUS' | 'RECAP' | 'EXTRACT';

export interface UserNote {
  id: string;
  text: string;
  timestamp: string;
  sessionId?: string;
}

export interface NoiseLog {
  id: string;
  timestamp: string;
  level: number;
  source: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  requirement: number;
  unlockedAt?: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'ai' | 'system';
  link?: string;
}

export interface NotificationPreferences {
  dailyReminders: boolean;
  achievementNotifications: boolean;
  studyTips: boolean;
  systemAlerts: boolean;
  aiRecommendations: boolean;
  reviewReminders: boolean;
  emailNotifications: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

// Deep Work Engine Types
export type FocusModeType = 'IDLE' | 'RITUAL' | 'FOCUS' | 'RECAP' | 'EXTRACT';

export interface FocusSession {
  id: string;
  task: string;
  startTime: number;
  duration: number; // In seconds
  elapsedSeconds: number;
  notes: string;
  interruptions: number;
  feynmanRecap?: string;
  focusScore?: number;
  recap?: string;
}

export interface FocusHistory {
  date: string;
  sessions: FocusSession[];
}
