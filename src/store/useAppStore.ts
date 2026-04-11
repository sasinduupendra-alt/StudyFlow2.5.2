import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/authSlice';
import { StudySlice, createStudySlice } from './slices/studySlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { TaskSlice, createTaskSlice } from './slices/taskSlice';

export type AppState = AuthSlice & StudySlice & UISlice & TaskSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createStudySlice(...a),
      ...createUISlice(...a),
      ...createTaskSlice(...a),
    }),
    {
      name: 'studyflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        subjects: state.subjects,
        schedule: state.schedule,
        studyLogs: state.studyLogs,
        exams: state.exams,
        userProfile: state.userProfile,
        recentlyStudied: state.recentlyStudied,
        aiPlan: state.aiPlan,
        tasks: state.tasks,
      }),
    }
  )
);

