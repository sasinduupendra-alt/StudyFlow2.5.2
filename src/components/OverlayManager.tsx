import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import StudyLogForm from './StudyLogForm';
import { FocusMode } from './FocusMode';

import { Subject } from '../types';

interface OverlayManagerProps {
  handleSaveLog: (log: any) => void;
  finishSession: () => void;
}

export default function OverlayManager({ handleSaveLog, finishSession }: OverlayManagerProps) {
  const activeSession = useAppStore(state => state.activeSession);
  const setActiveSession = useAppStore(state => state.setActiveSession);
  const subjects = useAppStore(state => state.subjects);

  const isSessionComplete = activeSession ? activeSession.elapsedSeconds >= activeSession.totalSeconds : false;

  return (
    <>
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
