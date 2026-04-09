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
}

export interface WeeklyTask {
  id: string;
  title: string;
  completed: boolean;
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
  topicId: string;
  duration: number;
  focusLevel: number;
  notes: string;
  timestamp: string;
  resources?: string[];
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
