import { StateCreator } from 'zustand';
import { Subject, StudyLog, WeeklySchedule, AIRecommendation, ExamRecord, AIStudyPlan, AIPlanTask, Activity, Task } from '../../types';
import { INITIAL_SUBJECTS, WEEKLY_BASE_SCHEDULE, INITIAL_TASKS } from '../../constants';
import { parseTimeStr, formatTimeStr } from '../../lib/timeUtils';
import { calculateSNR } from '../../lib/utils';
import { AppState } from '../useAppStore';

const recalculateActivityTimes = (activities: Activity[]) => {
  if (activities.length === 0) return [];

  const updated = [...activities];
  
  for (let i = 0; i < updated.length; i++) {
    const current = updated[i];
    
    // Tuition times are fixed and should not be recalculated based on previous blocks
    if (current.type === 'tuition') continue;

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
  optimizeDaySchedule: (day: keyof WeeklySchedule) => void;
  recentlyStudied: string[];
  setRecentlyStudied: (ids: string[]) => void;
  addRecentlyStudied: (id: string) => void;
  updateTopicSRS: (subjectId: string, topicId: string, performance: number) => void;
  resetToDefault: () => void;
}

export const createStudySlice: StateCreator<AppState, [], [], StudySlice> = (set, get) => ({
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
  optimizeDaySchedule: (day) => set((state) => {
    const fullState = get() as AppState;
    const tasks = fullState.tasks || [];
    
    const activities = [...state.schedule[day]].sort((a, b) => 
      parseTimeStr(a.time.split(' – ')[0]) - parseTimeStr(b.time.split(' – ')[0])
    );
    
    const tuitionBlocks = activities.filter(a => a.type === 'tuition');
    const optimized: Activity[] = [];
    
    const dayStart = parseTimeStr("04:30 AM");
    const dayEnd = parseTimeStr("10:30 PM");
    
    let currentTime = dayStart;
    
    const workTypes = [
      "Ultra-Deep Work: Concept Mastery",
      "Deep Work: High-Intensity Practice",
      "Deep Work: Weak Area Rebuild",
      "Deep Work: Past Paper Simulation",
      "Active Recall & Formulae Review"
    ];

    // Calculate subject priority based on pending tasks SNR
    const subjectPriorities = state.subjects.map(subject => {
      const subjectTasks = tasks.filter(t => t.subjectId === subject.id && !t.completed);
      const totalSNR = subjectTasks.reduce((acc, t) => acc + calculateSNR(t, subject), 0);
      return { id: subject.id, score: totalSNR + (subject.focus / 10) };
    }).sort((a, b) => b.score - a.score);

    let subjectIndex = 0;
    let workTypeIndex = 0;

    // Helper to get duration based on time of day (Circadian alignment)
    const getStudyDuration = (time: number) => {
      if (time < parseTimeStr("10:00 AM")) return 120; // 2h morning deep work
      if (time < parseTimeStr("06:00 PM")) return 90;  // 1.5h mid-day focus
      return 60; // 1h evening review
    };

    // Helper to add study/break blocks in a gap
    const fillGap = (start: number, end: number) => {
      let gapTime = start;
      const breakDuration = 15;
      
      while (gapTime + 30 <= end) { // Minimum 30 min block
        const currentDuration = Math.min(getStudyDuration(gapTime), end - gapTime);
        
        // Pick subject based on priority, but rotate to ensure coverage
        const subjectId = subjectPriorities[subjectIndex % subjectPriorities.length].id;
        const subject = state.subjects.find(s => s.id === subjectId) || state.subjects[0];
        const workType = workTypes[workTypeIndex % workTypes.length];
        
        // Find top task for this subject to include in description
        const topTask = tasks
          .filter(t => t.subjectId === subject.id && !t.completed)
          .sort((a, b) => calculateSNR(b, subject) - calculateSNR(a, subject))[0];

        const description = topTask 
          ? `${subject.name}: ${workType} (${topTask.title})`
          : `${subject.name}: ${workType}`;

        // Add Study Block
        optimized.push({
          id: Math.random().toString(36).substring(2, 9),
          description,
          time: `${formatTimeStr(gapTime)} – ${formatTimeStr(gapTime + currentDuration)}`,
          type: 'study'
        });
        
        gapTime += currentDuration;
        subjectIndex++;
        workTypeIndex++;
        
        // Add Break if there's room and it's not the very end of the gap
        if (gapTime + breakDuration + 30 <= end) {
          optimized.push({
            id: Math.random().toString(36).substring(2, 9),
            description: "Neural Recovery Break",
            time: `${formatTimeStr(gapTime)} – ${formatTimeStr(gapTime + breakDuration)}`,
            type: 'break'
          });
          gapTime += breakDuration;
        }
      }
      
      // Fill remaining small gap with rest if > 10 mins
      if (end - gapTime >= 10) {
        optimized.push({
          id: Math.random().toString(36).substring(2, 9),
          description: "System Standby / Rest",
          time: `${formatTimeStr(gapTime)} – ${formatTimeStr(end)}`,
          type: 'rest'
        });
      }
    };

    // Process gaps around tuition
    tuitionBlocks.forEach(tuition => {
      const tuitionStart = parseTimeStr(tuition.time.split(' – ')[0]);
      const tuitionEnd = parseTimeStr(tuition.time.split(' – ')[1]);
      
      if (tuitionStart > currentTime) {
        // Add Tuition Prep if gap is large enough
        if (tuitionStart - currentTime > 15) {
          fillGap(currentTime, tuitionStart - 15);
          optimized.push({
            id: Math.random().toString(36).substring(2, 9),
            description: "Tuition Prep: Pre-session Review",
            time: `${formatTimeStr(tuitionStart - 15)} – ${formatTimeStr(tuitionStart)}`,
            type: 'study'
          });
        } else {
          fillGap(currentTime, tuitionStart);
        }
      }
      
      optimized.push(tuition);
      currentTime = tuitionEnd;

      // Add Tuition Conversion (Review what was just learned)
      if (currentTime + 30 <= dayEnd) {
        const conversionEnd = currentTime + 30;
        // Check if next tuition block is too close
        const nextTuition = tuitionBlocks.find(t => parseTimeStr(t.time.split(' – ')[0]) > currentTime);
        const limit = nextTuition ? parseTimeStr(nextTuition.time.split(' – ')[0]) : dayEnd;
        
        const actualConversionEnd = Math.min(conversionEnd, limit);
        if (actualConversionEnd - currentTime >= 15) {
          optimized.push({
            id: Math.random().toString(36).substring(2, 9),
            description: "Tuition Conversion: Post-session Synthesis",
            time: `${formatTimeStr(currentTime)} – ${formatTimeStr(actualConversionEnd)}`,
            type: 'study'
          });
          currentTime = actualConversionEnd;
        }
      }
    });
    
    // Fill final gap
    if (currentTime < dayEnd) {
      fillGap(currentTime, dayEnd);
    }

    return {
      schedule: {
        ...state.schedule,
        [day]: optimized.sort((a, b) => 
          parseTimeStr(a.time.split(' – ')[0]) - parseTimeStr(b.time.split(' – ')[0])
        )
      }
    };
  }),
  recentlyStudied: [],
  setRecentlyStudied: (ids) => set({ recentlyStudied: ids }),
  addRecentlyStudied: (id) => set((state) => {
    const filtered = state.recentlyStudied.filter(tid => tid !== id);
    return { recentlyStudied: [id, ...filtered].slice(0, 10) };
  }),
  updateTopicSRS: (subjectId, topicId, performance) => set((state) => {
    const subjectIndex = state.subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) return state;

    const newSubjects = [...state.subjects];
    const subject = { ...newSubjects[subjectIndex] };
    const topicIndex = subject.topics.findIndex(t => t.id === topicId);
    if (topicIndex === -1) return state;

    const topic = { ...subject.topics[topicIndex] };
    
    // SM-2 Algorithm
    let { interval = 0, easeFactor = 2.5, reviewCount = 0 } = topic;
    const q = performance;

    if (q >= 3) {
      if (reviewCount === 0) {
        interval = 1;
      } else if (reviewCount === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      
      easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;
      reviewCount++;
    } else {
      interval = 1;
      reviewCount = 0;
    }

    const now = new Date();
    const nextReview = new Date();
    nextReview.setDate(now.getDate() + interval);

    topic.lastReviewed = now.toISOString();
    topic.nextReview = nextReview.toISOString();
    topic.interval = interval;
    topic.easeFactor = easeFactor;
    topic.reviewCount = reviewCount;
    
    // Also update mastery based on performance
    topic.mastery = Math.min(100, Math.max(0, topic.mastery + (q - 3) * 5));

    subject.topics = [...subject.topics];
    subject.topics[topicIndex] = topic;
    newSubjects[subjectIndex] = subject;

    return { subjects: newSubjects };
  }),
  resetToDefault: () => set({ 
    subjects: INITIAL_SUBJECTS, 
    schedule: WEEKLY_BASE_SCHEDULE,
    tasks: INITIAL_TASKS as Task[],
    aiPlan: null,
    studyLogs: [],
    exams: []
  }),
});
