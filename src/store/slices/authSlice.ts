import { StateCreator } from 'zustand';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../../types';
import { INITIAL_BADGES } from '../../constants';

export interface AuthSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  isAuthReady: boolean;
  setIsAuthReady: (ready: boolean) => void;
  setAuth: (user: User | null, isAuthReady: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  userProfile: {
    points: 0,
    streak: 0,
    badges: INITIAL_BADGES,
    totalSessions: 0,
    totalStudyTime: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100
  },
  setUserProfile: (profile) => set({ userProfile: profile }),
  isAuthReady: false,
  setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
  setAuth: (user, isAuthReady) => set({ user, isAuthReady }),
});
