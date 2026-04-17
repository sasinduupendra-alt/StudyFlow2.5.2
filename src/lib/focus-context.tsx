import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FocusMode, FocusSession, UserNote } from '../types';
import { useAppStore } from '../store/useAppStore';

interface FocusContextType {
  mode: FocusMode;
  setMode: (mode: FocusMode) => void;
  currentSession: Partial<FocusSession> | null;
  startSession: (task: string, duration: number) => void;
  endSession: () => void;
  updateNotes: (notes: string) => void;
  saveRecap: (recap: string) => void;
  history: FocusSession[];
  stats: {
    totalFocusTime: number;
    avgFocusScore: number;
    sessionCount: number;
  };
  interruptionOccurred: () => void;
  clearSession: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<FocusMode>('IDLE');
  const [currentSession, setCurrentSession] = useState<Partial<FocusSession> | null>(null);
  const [history, setHistory] = useState<FocusSession[]>([]);
  
  const isPaused = useAppStore(state => state.isPaused);
  const tickActiveSession = useAppStore(state => state.tickActiveSession);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('focus_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('focus_history', JSON.stringify(history));
  }, [history]);

  // Main Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'FOCUS' && !isPaused && currentSession) {
      interval = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev) return null;
          const nextElapsed = (prev.elapsedSeconds || 0) + 1;
          
          // Auto-end if reached
          if (nextElapsed >= (prev.duration || 0)) {
            setMode('RECAP');
            return { ...prev, elapsedSeconds: prev.duration };
          }
          
          return { ...prev, elapsedSeconds: nextElapsed };
        });
        
        // Sync with global store if applicable
        tickActiveSession();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, isPaused, currentSession?.id, tickActiveSession]);

  const startSession = useCallback((task: string, duration: number) => {
    setCurrentSession({
      id: crypto.randomUUID(),
      task,
      startTime: Date.now(),
      duration,
      elapsedSeconds: 0,
      interruptions: 0,
      focusScore: 100,
      notes: '',
    });
    setMode('RITUAL');
    setTimeout(() => setMode('FOCUS'), 2000);
  }, []);

  const interruptionOccurred = useCallback(() => {
    if (!currentSession) return;
    setCurrentSession(prev => ({
      ...prev,
      interruptions: (prev?.interruptions || 0) + 1,
      focusScore: Math.max(0, (prev?.focusScore || 100) - 10)
    }));
  }, [currentSession]);

  const updateNotes = useCallback((notes: string) => {
    setCurrentSession(prev => ({ ...prev, notes }));
  }, []);

  const endSession = useCallback(() => {
    setMode('RECAP');
  }, []);

  const saveRecap = useCallback((recap: string) => {
    if (currentSession) {
      const fullSession: FocusSession = {
        ...(currentSession as FocusSession),
        recap,
      };
      setHistory(prev => [fullSession, ...prev]);
      setCurrentSession(fullSession); // Keep it populated with recap
    }
    setMode('EXTRACT');
  }, [currentSession]);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setMode('IDLE');
  }, []);

  const stats = {
    totalFocusTime: history.reduce((acc, s) => acc + (s.elapsedSeconds || 0), 0),
    avgFocusScore: history.length ? history.reduce((acc, s) => acc + (s.focusScore || 0), 0) / history.length : 0,
    sessionCount: history.length
  };

  return (
    <FocusContext.Provider value={{
      mode, setMode, currentSession, startSession, endSession, updateNotes, saveRecap, history, stats, interruptionOccurred, clearSession
    }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error('useFocus must be used within a FocusProvider');
  return context;
};
