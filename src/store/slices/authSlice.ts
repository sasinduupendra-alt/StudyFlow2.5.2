import { StateCreator } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from '../../types';
import { INITIAL_BADGES } from '../../constants';

export interface AuthSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  isAuthReady: boolean;
  setIsAuthReady: (ready: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  userProfile: {
    points: 0,
    streak: 0,
    badges: INITIAL_BADGES,
    totalSessions: 0,
    totalStudyTime: 0
  },
  setUserProfile: (profile) => set({ userProfile: profile }),
  isAuthReady: false,
  setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
});
