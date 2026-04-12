import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Zap, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { Subject } from '../types';

interface FocusModeProps {
  subject: Subject;
  session: {
    subjectId: string;
    topicId: string;
    elapsedSeconds: number;
    totalSeconds: number;
  };
  isPaused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  onFinish?: () => void;
}

export default function FocusMode({ subject, session, isPaused, onTogglePause, onExit, onFinish }: FocusModeProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);
  };

  const progress = (session.elapsedSeconds / session.totalSeconds) * 100;
  const timeLeft = session.totalSeconds - session.elapsedSeconds;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      {/* Visual Confirmation Flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {subject.image ? (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: isImmersive ? 0.2 : 0.1,
              scale: isImmersive ? 1.02 : 1.1,
            }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img 
              src={subject.image} 
              alt="" 
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
              className="w-full h-full object-cover blur-[100px] scale-110 opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        ) : (
          <motion.div 
            animate={{
              scale: isImmersive ? [1, 1.05, 1] : [1, 1.02, 1],
              opacity: isImmersive ? [0.05, 0.1, 0.05] : [0.02, 0.05, 0.02],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-white rounded-none blur-[200px]" 
          />
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        
        {/* Subtle Floating Particles */}
        <AnimatePresence>
          {isImmersive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 100 + "%", 
                    y: Math.random() * 100 + "%",
                    opacity: Math.random() * 0.2,
                    scale: Math.random() * 0.5 + 0.5
                  }}
                  animate={{
                    y: [null, "-=50px"],
                    opacity: [null, 0]
                  }}
                  transition={{
                    duration: Math.random() * 10 + 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute w-1 h-1 bg-white/30 rounded-none blur-[1px]"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
        <button 
          onClick={toggleImmersive}
          className="p-3 text-zinc-500 hover:text-white hover:bg-white/10 rounded-none transition-all group relative border border-transparent hover:border-white/20"
          title={isImmersive ? "Exit Immersive Mode" : "Enter Immersive Mode"}
        >
          {isImmersive ? <Minimize2 className="w-8 h-8" /> : <Maximize2 className="w-8 h-8" />}
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/10 rounded-none text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/20">
            {isImmersive ? "Normal View" : "Immersive View"}
          </span>
        </button>
        <button 
          onClick={onExit}
          className="p-3 text-zinc-500 hover:text-white hover:bg-white/10 rounded-none transition-all border border-transparent hover:border-white/20"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      <div className={cn(
        "relative z-10 flex flex-col items-center text-center max-w-4xl w-full transition-all duration-1000 ease-in-out",
        isImmersive ? "scale-110" : "scale-100"
      )}>
        <AnimatePresence mode="wait">
          {!isImmersive && (
            <motion.div
              key="header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-white animate-pulse" />
                <span className="text-sm font-mono uppercase tracking-[0.3em] text-white">Deep Work Session</span>
              </div>
              <h2 className="text-4xl md:text-7xl font-mono uppercase tracking-widest mb-8 md:mb-12 text-white">{subject.name}</h2>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "relative mb-8 md:mb-12 transition-all duration-1000 ease-in-out flex items-center justify-center",
          isImmersive ? "w-80 h-80 md:w-[500px] md:h-[500px]" : "w-56 h-56 md:w-80 md:h-80"
        )}>
          {isImmersive && !isPaused && (
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 4, // 4-second breathing cycle
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-white rounded-none blur-[50px] pointer-events-none"
            />
          )}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="currentColor"
              strokeWidth={isImmersive ? "2" : "4"}
              className="text-white/5"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="currentColor"
              strokeWidth={isImmersive ? "2" : "4"}
              strokeDasharray="100 100"
              strokeDashoffset={100 - progress}
              pathLength="100"
              className={cn("text-white transition-all duration-1000", isImmersive && "drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]")}
            />
          </svg>
          <div className="flex flex-col items-center justify-center z-10">
            <motion.span 
              layout
              className={cn(
                "font-mono tabular-nums tracking-widest transition-all duration-1000 ease-in-out drop-shadow-2xl",
                isImmersive ? "text-8xl md:text-[180px] leading-none" : "text-5xl md:text-8xl"
              )}
            >
              {formatTime(timeLeft)}
            </motion.span>
            {!isImmersive && (
              <span className="text-xs md:text-sm font-mono text-zinc-500 uppercase tracking-widest mt-2">Remaining</span>
            )}
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-8 transition-all duration-700",
          isImmersive ? "mt-12" : "mt-0"
        )}>
          <button 
            onClick={() => {}} // Reset logic would need to be in the hook
            className={cn(
              "p-4 text-zinc-500 hover:text-white transition-all",
              isImmersive && "opacity-10 hover:opacity-100"
            )}
          >
            <RotateCcw className="w-8 h-8" />
          </button>
          
          <button 
            onClick={onTogglePause}
            className={cn(
              "rounded-none flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]",
              isImmersive ? "w-20 h-20 bg-white/5 text-white hover:bg-white hover:text-black" : "w-20 h-20 md:w-24 md:h-24 bg-white text-black"
            )}
          >
            {!isPaused ? (
              <Pause className={cn("fill-current", isImmersive ? "w-8 h-8" : "w-10 h-10")} />
            ) : (
              <Play className={cn("fill-current ml-1", isImmersive ? "w-8 h-8" : "w-10 h-10")} />
            )}
          </button>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-4 text-zinc-500 hover:text-white transition-all",
              isImmersive && "opacity-10 hover:opacity-100"
            )}
          >
            {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
          </button>
        </div>

        {!isImmersive && onFinish && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onFinish}
            className="mt-8 px-8 py-3 bg-transparent hover:bg-white/5 border border-white/20 rounded-none text-[10px] font-mono uppercase tracking-widest transition-all"
          >
            Finish Session Early
          </motion.button>
        )}

        <AnimatePresence>
          {!isImmersive && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-12 md:mt-16 grid grid-cols-3 gap-6 md:gap-12 w-full max-w-md overflow-hidden"
            >
              <div className="text-center">
                <p className="text-xl md:text-2xl font-mono text-white">{Math.floor(session.totalSeconds / 60)}m</p>
                <p className="text-[8px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Goal</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-mono text-white">0</p>
                <p className="text-[8px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Distractions</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-mono text-white">High</p>
                <p className="text-[8px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Intensity</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isImmersive && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/20"
          >
            <Zap className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Immersive Focus Active</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
