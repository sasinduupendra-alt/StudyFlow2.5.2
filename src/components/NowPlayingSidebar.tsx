import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Zap, Heart, ListMusic, Volume1, VolumeX, X, Info, ExternalLink, Share2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface NowPlayingSidebarProps {
  currentSubject: string;
  currentSubjectImage?: string;
  progress: number;
  timeElapsed: string;
  totalTime?: string;
  onClose?: () => void;
  onToggleFocus?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

import { useAppStore } from '../store/useAppStore';

export default function NowPlayingSidebar({ 
  onClose,
  onToggleFocus,
}: { 
  onClose?: () => void;
  onToggleFocus?: () => void;
}) {
  const { activeSession, subjects, isPaused, setIsPaused } = useAppStore();
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!activeSession) return null;

  const activeSubject = subjects.find(s => s.id === activeSession.subjectId);
  const currentSubject = activeSubject?.name || '';
  const currentSubjectImage = activeSubject?.image;
  const progress = (activeSession.elapsedSeconds / activeSession.totalSeconds) * 100;
  const isPlaying = !isPaused;
  const onTogglePlay = () => setIsPaused(!isPaused);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeElapsed = formatTime(activeSession.elapsedSeconds);
  const totalTime = formatTime(activeSession.totalSeconds);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setVolume(newVolume);
    if (isMuted) setIsMuted(false);
  };

  return (
    <motion.aside
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="hidden md:flex flex-col w-[350px] bg-black border-l border-white/10 h-full overflow-y-auto scrollbar-hide shrink-0 relative z-50"
    >
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-transparent z-10 border-b border-white/10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">Now Playing</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors hover:bg-white/10 rounded-none">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors hover:bg-white/10 rounded-none">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8 relative z-10">
        {/* Album Art / Subject Image */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="aspect-square w-full bg-transparent rounded-none overflow-hidden shadow-2xl border border-white/20 relative group"
        >
          {!isLoaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
          <img 
            src={currentSubjectImage || `https://picsum.photos/seed/${currentSubject}/400/400`} 
            alt={currentSubject}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-all duration-1000",
              isLoaded ? (isPlaying ? "scale-110 opacity-100 grayscale" : "scale-100 opacity-50 grayscale") : "opacity-0 scale-110"
            )}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {isPlaying && (
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md p-2 rounded-none border border-white/20">
              <span className="flex gap-1 h-4 items-end">
                <motion.span animate={{ height: [4, 16, 8, 16, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-none" />
                <motion.span animate={{ height: [16, 4, 16, 8, 16] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white rounded-none" />
                <motion.span animate={{ height: [8, 16, 4, 16, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-white rounded-none" />
              </span>
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl font-mono uppercase tracking-widest truncate hover:text-zinc-300 cursor-pointer drop-shadow-md text-white">
              {currentSubject || 'Select a Subject'}
            </h3>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                "transition-all p-2 hover:scale-110 active:scale-90 rounded-none hover:bg-white/5",
                isLiked ? "text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <Heart className={cn("w-6 h-6", isLiked && "fill-current drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]")} />
            </button>
          </div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">
            {isPlaying ? 'Deep Focus Session' : 'Paused'}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="h-1.5 bg-white/10 rounded-none group cursor-pointer relative overflow-hidden border border-white/10">
            <div 
              className="h-full bg-white group-hover:bg-zinc-300 rounded-none transition-all duration-300 relative" 
              style={{ width: `${progress}%` }} 
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-none shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest tabular-nums">
            <span>{timeElapsed}</span>
            <span>{totalTime}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8 py-2">
          <div className="flex items-center gap-8">
            <button className="text-zinc-500 hover:text-white transition-colors">
              <Shuffle className="w-5 h-5" />
            </button>
            <button className="text-zinc-500 hover:text-white transition-colors hover:scale-110 active:scale-90">
              <SkipBack className="w-8 h-8 fill-current" />
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTogglePlay}
              className="w-16 h-16 bg-white rounded-none flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-zinc-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all group"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-black fill-current" />
              ) : (
                <Play className="w-7 h-7 text-black fill-current ml-1" />
              )}
            </motion.button>
            <button className="text-zinc-500 hover:text-white transition-colors hover:scale-110 active:scale-90">
              <SkipForward className="w-8 h-8 fill-current" />
            </button>
            <button className="text-zinc-500 hover:text-white transition-colors">
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex items-center gap-4 px-2">
            <button onClick={() => setIsMuted(!isMuted)}>
              <VolumeIcon className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" />
            </button>
            <div 
              className="flex-1 h-1.5 bg-white/10 rounded-none group/bar cursor-pointer relative overflow-hidden border border-white/10"
              onClick={handleVolumeClick}
            >
              <div 
                className={cn(
                  "h-full rounded-none transition-all relative",
                  isMuted ? "bg-zinc-600" : "bg-white group-hover/bar:bg-zinc-300"
                )} 
                style={{ width: isMuted ? '0%' : `${volume}%` }} 
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-none shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="bg-transparent rounded-none p-5 border border-white/10 hover:border-white/30 transition-colors cursor-pointer group backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-mono text-xs text-white uppercase tracking-widest group-hover:text-zinc-300 transition-colors">About the Subject</h4>
              <Info className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
              {currentSubject} is a core component of your Advanced Level syllabus. 
              Focusing on this will help you improve your overall readiness score.
            </p>
          </div>

          <div className="bg-transparent rounded-none p-5 border border-white/20 flex items-center justify-between group cursor-pointer hover:border-white/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none bg-transparent border border-white/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-mono text-white uppercase tracking-widest">Deep Focus Mode</span>
            </div>
            <button 
              onClick={onToggleFocus}
              className="px-4 py-2 bg-white text-black rounded-none text-[10px] font-mono uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg"
            >
              Enable
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-white/5 rounded-none text-[10px] font-mono uppercase tracking-widest transition-all border border-white/10 text-white">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-white/5 rounded-none text-[10px] font-mono uppercase tracking-widest transition-all border border-white/10 text-white">
              <ExternalLink className="w-4 h-4" />
              Resources
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
