import { StateCreator } from 'zustand';
import { Subject, StudyLog, WeeklySchedule, AIRecommendation, ExamRecord, AIStudyPlan } from '../../types';
import { INITIAL_SUBJECTS, WEEKLY_BASE_SCHEDULE } from '../../constants';

export interface StudySlice {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  studyLogs: StudyLog[];
  setStudyLogs: (logs: StudyLog[]) => void;
  exams: ExamRecord[];
  setExams: (exams: ExamRecord[]) => void;
  schedule: WeeklySchedule;
  setSchedule: (schedule: WeeklySchedule) => void;
  recommendations: AIRecommendation[];
  setRecommendations: (recommendations: AIRecommendation[]) => void;
  aiPlan: AIStudyPlan | null;
  setAIPlan: (plan: AIStudyPlan | null) => void;
  recentlyStudied: string[];
  setRecentlyStudied: (ids: string[]) => void;
  addRecentlyStudied: (id: string) => void;
}

export const createStudySlice: StateCreator<StudySlice> = (set) => ({
  subjects: INITIAL_SUBJECTS,
  setSubjects: (subjects) => set({ subjects }),
  studyLogs: [],
  setStudyLogs: (logs) => set({ studyLogs: logs }),
  exams: [],
  setExams: (exams) => set({ exams }),
  schedule: WEEKLY_BASE_SCHEDULE,
  setSchedule: (schedule) => set({ schedule }),
  recommendations: [],
  setRecommendations: (recommendations) => set({ recommendations }),
  aiPlan: null,
  setAIPlan: (plan) => set({ aiPlan: plan }),
  recentlyStudied: [],
  setRecentlyStudied: (ids) => set({ recentlyStudied: ids }),
  addRecentlyStudied: (id) => set((state) => {
    const filtered = state.recentlyStudied.filter(tid => tid !== id);
    return { recentlyStudied: [id, ...filtered].slice(0, 10) };
  }),
});
