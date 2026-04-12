import { StateCreator } from 'zustand';
import { Toast } from '../../types';

export interface UISlice {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFocusMode: boolean;
  setIsFocusMode: (isFocusMode: boolean) => void;
  isLoggingSession: boolean;
  setIsLoggingSession: (isLoggingSession: boolean) => void;
  activeSession: {
    subjectId: string;
    topicId: string;
    elapsedSeconds: number;
    totalSeconds: number;
  } | null;
  setActiveSession: (activeSession: UISlice['activeSession']) => void;
  tickActiveSession: () => void;
  startFocusSession: (subjectId: string, topicId: string, durationMinutes?: number) => void;
  activeSubjectId: string | null;
  setActiveSubjectId: (id: string | null) => void;
  isPaused: boolean;
  setIsPaused: (isPaused: boolean) => void;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  highlightedSubjectId: string | null;
  setHighlightedSubjectId: (id: string | null) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isFocusMode: false,
  setIsFocusMode: (isFocusMode) => set({ isFocusMode }),
  isLoggingSession: false,
  setIsLoggingSession: (isLoggingSession) => set({ isLoggingSession }),
  activeSession: null,
  setActiveSession: (activeSession) => set({ activeSession }),
  tickActiveSession: () => set((state) => {
    if (!state.activeSession || state.isPaused) return {};
    return {
      activeSession: {
        ...state.activeSession,
        elapsedSeconds: state.activeSession.elapsedSeconds + 1
      }
    };
  }),
  startFocusSession: (subjectId, topicId, durationMinutes = 90) => set({
    isFocusMode: true,
    isPaused: false,
    activeSession: {
      subjectId,
      topicId,
      elapsedSeconds: 0,
      totalSeconds: durationMinutes * 60
    },
    activeSubjectId: subjectId
  }),
  activeSubjectId: null,
  setActiveSubjectId: (id) => set({ activeSubjectId: id }),
  isPaused: false,
  setIsPaused: (isPaused) => set({ isPaused }),
  isNowPlayingOpen: true,
  setIsNowPlayingOpen: (isNowPlayingOpen) => set({ isNowPlayingOpen }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  highlightedSubjectId: null,
  setHighlightedSubjectId: (id) => set({ highlightedSubjectId: id }),
});
