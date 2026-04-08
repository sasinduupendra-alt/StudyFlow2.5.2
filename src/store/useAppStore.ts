import { create } from 'zustand';
import { AuthSlice, createAuthSlice } from './slices/authSlice';
import { StudySlice, createStudySlice } from './slices/studySlice';
import { UISlice, createUISlice } from './slices/uiSlice';

type AppState = AuthSlice & StudySlice & UISlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createStudySlice(...a),
  ...createUISlice(...a),
}));

