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
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    setGlitch(true);
    const timer = setTimeout(() => setGlitch(false), 150);
    return () => clearTimeout(timer);
  }, [isPaused]);

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

  const activeTopic = subject.topics.find(t => t.id === session.topicId);

  // Reactive animation values
  const intensity = isPaused ? 0.2 : 0.4 + (progress / 200); // 0.4 to 0.9
  const pulseDuration = isPaused ? 15 : 10 - (progress / 20); // 10s down to 5s as focus deepens

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        backgroundColor: isPaused ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,1)',
        x: glitch ? [0, -4, 4, -2, 2, 0] : 0,
        filter: glitch ? 'hue-rotate(90deg) contrast(1.2)' : 'hue-rotate(0deg) contrast(1)'
      }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 overflow-y-auto"
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
        {/* Subject Theme Layer */}
        <div className={cn(
          "absolute inset-0 opacity-[0.05] transition-all duration-1000 bg-gradient-to-br",
          subject.gradient
        )} />

        {/* Dynamic Neural Aura */}
        <motion.div 
          animate={{
            opacity: [intensity * 0.1, intensity * 0.2, intensity * 0.1],
            scale: [1, 1.1 + (progress / 500), 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: pulseDuration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "absolute inset-0 blur-[120px] transition-colors duration-1000",
            isPaused ? "bg-zinc-900/20" : "bg-brand/10"
          )}
        />

        {/* Focus Waves */}
        {!isPaused && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 2],
                  opacity: [0, 0.1, 0]
                }}
                transition={{
                  duration: 4,
                  delay: i * 1.3,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute w-[500px] h-[500px] border border-brand/20 rounded-full"
              />
            ))}
          </div>
        )}

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
          className="p-3 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-all group relative"
          title={isImmersive ? "Exit Immersive Mode" : "Enter Immersive Mode"}
        >
          {isImmersive ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1C1C1E] rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-white/5">
            {isImmersive ? "Normal View" : "Immersive View"}
          </span>
        </button>
        <button 
          onClick={onExit}
          className="p-3 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
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
                <Zap className="w-5 h-5 text-brand animate-pulse" />
                <span className="text-sm font-semibold tracking-wider text-brand uppercase">Deep Work Session</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 text-white">{subject.name}</h2>
              <p className="text-sm md:text-lg font-medium text-[#8E8E93] mb-8 md:mb-12">{activeTopic?.title || 'Neural Sync'}</p>
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
              className={cn("text-brand transition-all duration-1000", isImmersive && "drop-shadow-[0_0_15px_var(--color-brand-glow)]")}
            />
          </svg>
          <div className="flex flex-col items-center justify-center z-10">
            <motion.span 
              layout
              className={cn(
                "font-medium tabular-nums tracking-tight transition-all duration-1000 ease-in-out drop-shadow-2xl",
                isImmersive ? "text-8xl md:text-[180px] leading-none" : "text-6xl md:text-8xl"
              )}
            >
              {formatTime(timeLeft)}
            </motion.span>
            {!isImmersive && (
              <div className="flex flex-col items-center mt-2">
                <span className="text-xs md:text-sm font-semibold text-[#8E8E93] uppercase tracking-wider">Remaining</span>
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 mt-4"
                >
                  <div className="w-2 h-2 bg-brand rounded-full shadow-lg" />
                  <span className="text-[10px] font-semibold text-brand uppercase tracking-widest">Active</span>
                </motion.div>
              </div>
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
              "p-4 text-[#8E8E93] hover:text-white transition-all rounded-full hover:bg-white/5",
              isImmersive && "opacity-20 hover:opacity-100"
            )}
          >
            <RotateCcw className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          
          <button 
            onClick={onTogglePause}
            className={cn(
              "rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg",
              isImmersive ? "w-20 h-20 bg-brand/20 text-brand hover:bg-brand hover:text-white" : "w-20 h-20 md:w-24 md:h-24 bg-brand text-white"
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
              "p-4 text-[#8E8E93] hover:text-white transition-all rounded-full hover:bg-white/5",
              isImmersive && "opacity-20 hover:opacity-100"
            )}
          >
            {isMuted ? <VolumeX className="w-6 h-6 md:w-8 md:h-8" /> : <Volume2 className="w-6 h-6 md:w-8 md:h-8" />}
          </button>
        </div>

        {!isImmersive && onFinish && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onFinish}
            className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-sm font-semibold text-white transition-all"
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
                <p className="text-xl md:text-2xl font-bold text-white">{Math.floor(session.elapsedSeconds / 60)}m</p>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Elapsed</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-white">{Math.floor((session.elapsedSeconds / session.totalSeconds) * 100)}%</p>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Progress</p>
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-xl md:text-2xl font-bold transition-colors duration-1000",
                  isPaused ? "text-[#8E8E93]" : progress > 75 ? "text-brand animate-pulse" : "text-white"
                )}>
                  {isPaused ? 'Standby' : progress > 75 ? 'Deep' : 'Active'}
                </p>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">State</p>
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
