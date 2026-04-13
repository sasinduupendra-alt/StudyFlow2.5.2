import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, SkipBack, Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function ActiveSessionBar() {
  const { 
    activeSession, 
    isPaused, 
    setIsPaused, 
    tickActiveSession, 
    subjects, 
    setIsFocusMode,
    isNowPlayingOpen,
    setIsNowPlayingOpen
  } = useAppStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && !isPaused) {
      interval = setInterval(() => {
        tickActiveSession();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.subjectId, activeSession?.topicId, isPaused, tickActiveSession]);

  if (!activeSession) return null;

  const activeSubject = subjects.find(s => s.id === activeSession.subjectId);
  const activeTopic = activeSubject?.topics?.find(t => t.id === activeSession.topicId);
  const progress = (activeSession.elapsedSeconds / activeSession.totalSeconds) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle session completion
  useEffect(() => {
    if (activeSession && activeSession.elapsedSeconds >= activeSession.totalSeconds) {
      setIsPaused(true);
      setIsFocusMode(false);
      setIsNowPlayingOpen(true);
      // We don't call addToast here because it might cause multiple toasts if not careful
      // But it's generally safe in a useEffect with proper dependencies
    }
  }, [activeSession?.elapsedSeconds, activeSession?.totalSeconds, setIsPaused, setIsFocusMode, setIsNowPlayingOpen]);

  return (
    <motion.div 
      key="active-session-bar"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] md:w-auto md:min-w-[600px] max-w-[90%]"
    >
      <div className="enterprise-card-premium py-3 px-6 flex items-center gap-8 relative group rounded-full">
        {/* Progress Bar (Top) */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 rounded-t-full overflow-hidden">
          <motion.div 
            className="h-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div 
            className="w-10 h-10 bg-brand/10 border border-brand/30 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_var(--color-brand-glow)] cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)}
          >
            <Brain className="w-5 h-5 text-brand" />
          </div>
          <div className="overflow-hidden max-w-[200px]">
            <h4 className="text-sm font-semibold text-white truncate leading-none">
              {activeTopic?.title || 'Neural Sync'}
            </h4>
            <p className="text-[11px] font-medium text-zinc-400 mt-1 truncate">
              {activeSubject?.name}
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-6">
          <button className="text-zinc-400 hover:text-white transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="w-12 h-12 bg-brand text-black rounded-full flex items-center justify-center shadow-[0_0_15px_var(--color-brand-glow)] hover:scale-105 transition-all duration-300"
          >
            {isPaused ? <Play className="w-5 h-5 fill-current ml-1" /> : <Pause className="w-5 h-5 fill-current" />}
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-400 tabular-nums">{formatTime(activeSession.elapsedSeconds)}</span>
            <span className="text-[11px] font-medium text-zinc-600">/</span>
            <span className="text-[11px] font-medium text-white tabular-nums">{formatTime(activeSession.totalSeconds)}</span>
          </div>
          <button 
            onClick={() => setIsFocusMode(true)}
            className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
