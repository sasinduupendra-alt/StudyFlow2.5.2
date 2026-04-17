import React, { useEffect } from 'react';
import { useFocus } from '../lib/focus-context';
import { useAppStore } from '../store/useAppStore';
import { FocusMode } from './FocusMode';
import { RecapMode } from './RecapMode';
import { RitualTransition } from './RitualTransition';
import { AnimatePresence } from 'motion/react';

export const DeepWorkEngine: React.FC = () => {
  const { mode, setMode, currentSession, startSession } = useFocus();
  const isFocusMode = useAppStore(state => state.isFocusMode);
  const activeSession = useAppStore(state => state.activeSession);
  const subjects = useAppStore(state => state.subjects);
  const setIsFocusMode = useAppStore(state => state.setIsFocusMode);

  // Sync global store focus mode to local deep work engine
  useEffect(() => {
    if (isFocusMode && mode === 'IDLE') {
      const subject = subjects.find(s => s.id === activeSession?.subjectId);
      const topic = subject?.topics?.find(t => t.id === activeSession?.topicId);
      const taskName = topic ? `${subject?.name}: ${topic.title}` : activeSession?.task || 'Deep Work Session';
      
      startSession(taskName, activeSession?.totalSeconds || 25 * 60);
    }
  }, [isFocusMode, mode, activeSession, subjects, startSession]);

  const handleClose = () => {
    setIsFocusMode(false);
    setMode('IDLE');
  };

  // Sync local IDLE mode back to global store
  useEffect(() => {
    if (mode === 'IDLE' && isFocusMode) {
      setIsFocusMode(false);
    }
  }, [mode, isFocusMode, setIsFocusMode]);

  if (!isFocusMode && mode === 'IDLE') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <AnimatePresence mode="wait">
        {mode === 'RITUAL' && <RitualTransition key="ritual" />}
        {mode === 'FOCUS' && <FocusMode key="focus" />}
        {mode === 'RECAP' && <RecapMode key="recap" />}
        {mode === 'EXTRACT' && <RecapMode key="extract" />}
      </AnimatePresence>
    </div>
  );
};
