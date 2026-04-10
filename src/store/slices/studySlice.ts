import { StateCreator } from 'zustand';
import { Subject, StudyLog, WeeklySchedule, AIRecommendation, ExamRecord, AIStudyPlan, AIPlanTask, Activity } from '../../types';
import { INITIAL_SUBJECTS, WEEKLY_BASE_SCHEDULE } from '../../constants';
import { parseTimeStr, formatTimeStr } from '../../lib/timeUtils';

const recalculateActivityTimes = (activities: Activity[]) => {
  if (activities.length === 0) return [];

  const updated = [...activities];
  
  for (let i = 0; i < updated.length; i++) {
    const current = updated[i];
    const [startStr, endStr] = current.time.split(' – ');
    const startMinutes = parseTimeStr(startStr);
    const endMinutes = parseTimeStr(endStr);
    const duration = endMinutes - startMinutes;

    if (i > 0) {
      const prev = updated[i - 1];
      const prevEndStr = prev.time.split(' – ')[1];
      const prevEndMinutes = parseTimeStr(prevEndStr);
      
      const newStart = prevEndMinutes;
      const newEnd = newStart + duration;
      
      updated[i] = {
        ...current,
        time: `${formatTimeStr(newStart)} – ${formatTimeStr(newEnd)}`
      };
    }
  }
  
  return updated;
};

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
  updateAIPlanTask: (taskId: string, updates: Partial<AIPlanTask>) => void;
  reorderSchedule: (day: keyof WeeklySchedule, startIndex: number, endIndex: number) => void;
  updateActivity: (day: keyof WeeklySchedule, activityId: string, updates: Partial<Activity>) => void;
  recentlyStudied: string[];
  setRecentlyStudied: (ids: string[]) => void;
  addRecentlyStudied: (id: string) => void;
  resetToDefault: () => void;
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
  updateAIPlanTask: (taskId, updates) => set((state) => {
    if (!state.aiPlan) return state;
    
    const taskIndex = state.aiPlan.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return state;

    const newTasks = [...state.aiPlan.tasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], ...updates };

    // Auto-adjust subsequent tasks if duration or start time changed
    if (updates.duration !== undefined || updates.startTime !== undefined) {
      for (let i = taskIndex; i < newTasks.length; i++) {
        const task = { ...newTasks[i] }; // Create a copy of the task to mutate
        
        if (i > taskIndex) {
          const prevTask = newTasks[i - 1];
          if (prevTask.endTime) {
            task.startTime = prevTask.endTime;
          }
        }
        
        if (task.startTime) {
          const [hours, minutes] = task.startTime.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          startDate.setMinutes(startDate.getMinutes() + task.duration);
          task.endTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        }
        
        newTasks[i] = task;
      }
    }

    return {
      aiPlan: {
        ...state.aiPlan,
        tasks: newTasks
      }
    };
  }),
  reorderSchedule: (day, startIndex, endIndex) => set((state) => {
    const newDayActivities = [...state.schedule[day]];
    const [removed] = newDayActivities.splice(startIndex, 1);
    newDayActivities.splice(endIndex, 0, removed);

    // Recalculate times for the entire day based on the new order
    const updatedActivities = recalculateActivityTimes(newDayActivities);

    return {
      schedule: {
        ...state.schedule,
        [day]: updatedActivities
      }
    };
  }),
  updateActivity: (day, activityId, updates) => set((state) => {
    const newDayActivities = [...state.schedule[day]];
    const index = newDayActivities.findIndex(a => a.id === activityId);
    if (index === -1) return state;

    newDayActivities[index] = { ...newDayActivities[index], ...updates };

    // If time or duration (implied by start/end) changed, recalculate
    // For simplicity, if any update happens, we can recalculate or just if time changed
    const updatedActivities = recalculateActivityTimes(newDayActivities);

    return {
      schedule: {
        ...state.schedule,
        [day]: updatedActivities
      }
    };
  }),
  recentlyStudied: [],
  setRecentlyStudied: (ids) => set({ recentlyStudied: ids }),
  addRecentlyStudied: (id) => set((state) => {
    const filtered = state.recentlyStudied.filter(tid => tid !== id);
    return { recentlyStudied: [id, ...filtered].slice(0, 10) };
  }),
  resetToDefault: () => set({ 
    subjects: INITIAL_SUBJECTS, 
    schedule: WEEKLY_BASE_SCHEDULE,
    aiPlan: null,
    studyLogs: [],
    exams: []
  }),
});
