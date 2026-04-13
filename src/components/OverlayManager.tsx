import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import StudyLogForm from './StudyLogForm';
import FocusMode from './FocusMode';

interface OverlayManagerProps {
  handleSaveLog: (log: any) => void;
  finishSession: () => void;
}

export default function OverlayManager({ handleSaveLog, finishSession }: OverlayManagerProps) {
  const isFocusMode = useAppStore(state => state.isFocusMode);
  const setIsFocusMode = useAppStore(state => state.setIsFocusMode);
  const activeSession = useAppStore(state => state.activeSession);
  const setActiveSession = useAppStore(state => state.setActiveSession);
  const subjects = useAppStore(state => state.subjects);
  const isPaused = useAppStore(state => state.isPaused);
  const setIsPaused = useAppStore(state => state.setIsPaused);

  const activeSubject = subjects.find(s => s.id === activeSession?.subjectId);
  const isSessionComplete = activeSession ? activeSession.elapsedSeconds >= activeSession.totalSeconds : false;

  return (
    <>
      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && activeSession && activeSubject && (
          <FocusMode 
            key="focus-mode-overlay"
            subject={activeSubject}
            session={activeSession}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            onExit={() => setIsFocusMode(false)}
            onFinish={finishSession}
          />
        )}
      </AnimatePresence>

      {/* Study Log Form Overlay */}
      <AnimatePresence>
        {isSessionComplete && activeSession && (
          <StudyLogForm 
            key="study-log-form-overlay"
            subjects={subjects}
            initialData={{
              subjectId: activeSession.subjectId,
              topicIds: [activeSession.topicId],
              duration: Math.floor(activeSession.elapsedSeconds / 60)
            }}
            onSave={handleSaveLog}
            onClose={() => setActiveSession(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
