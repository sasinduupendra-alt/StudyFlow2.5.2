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

export default function NowPlayingSidebar({ 
  currentSubject, 
  currentSubjectImage,
  progress, 
  timeElapsed, 
  totalTime = '90:00',
  onClose,
  onToggleFocus,
  isPlaying = false,
  onTogglePlay
}: NowPlayingSidebarProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
      className="hidden md:flex flex-col w-[350px] bg-[#121212] border-l border-white/10 h-full overflow-y-auto scrollbar-hide shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-[#121212]/80 backdrop-blur-md z-10">
        <h2 className="font-bold text-base">Now Playing</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Album Art / Subject Image */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="aspect-square w-full bg-gradient-to-br from-gray-800 to-black rounded-xl overflow-hidden shadow-2xl border border-white/5 relative group"
        >
          {!isLoaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
          <img 
            src={currentSubjectImage || `https://picsum.photos/seed/${currentSubject}/400/400`} 
            alt={currentSubject}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-all duration-1000",
              isLoaded ? (isPlaying ? "scale-110 opacity-90" : "scale-100 opacity-50 grayscale") : "opacity-0 scale-110"
            )}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          
          {isPlaying && (
            <div className="absolute bottom-4 right-4">
              <span className="flex gap-1 h-4 items-end">
                <motion.span animate={{ height: [4, 16, 8, 16, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-[#1DB954]" />
                <motion.span animate={{ height: [16, 4, 16, 8, 16] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-[#1DB954]" />
                <motion.span animate={{ height: [8, 16, 4, 16, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-[#1DB954]" />
              </span>
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl font-black tracking-tight truncate hover:underline cursor-pointer">
              {currentSubject || 'Select a Subject'}
            </h3>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                "transition-all p-2 hover:scale-110 active:scale-90",
                isLiked ? "text-[#1DB954]" : "text-gray-400 hover:text-white"
              )}
            >
              <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
            </button>
          </div>
          <p className="text-gray-400 font-medium hover:text-white transition-colors cursor-pointer">
            {isPlaying ? 'Deep Focus Session' : 'Paused'}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="h-1.5 bg-white/10 rounded-full group cursor-pointer relative">
            <div 
              className="h-full bg-white group-hover:bg-[#1DB954] rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-500 tabular-nums">
            <span>{timeElapsed}</span>
            <span>{totalTime}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex items-center gap-8">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Shuffle className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onTogglePlay}
              className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-[#1DB954] transition-colors group"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-black fill-current" />
              ) : (
                <Play className="w-6 h-6 text-black fill-current ml-1" />
              )}
            </motion.button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex items-center gap-4 px-4">
            <button onClick={() => setIsMuted(!isMuted)}>
              <VolumeIcon className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </button>
            <div 
              className="flex-1 h-1 bg-white/10 rounded-full group/bar cursor-pointer relative"
              onClick={handleVolumeClick}
            >
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  isMuted ? "bg-gray-600" : "bg-white group-hover/bar:bg-[#1DB954]"
                )} 
                style={{ width: isMuted ? '0%' : `${volume}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="space-y-4 pt-4">
          <div className="bg-[#242424] rounded-xl p-4 border border-white/5 hover:bg-[#2a2a2a] transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">About the Subject</h4>
              <Info className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </div>
            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
              {currentSubject} is a core component of your Advanced Level syllabus. 
              Focusing on this will help you improve your overall readiness score.
            </p>
          </div>

          <div className="bg-[#242424] rounded-xl p-4 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-[#2a2a2a] transition-colors">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#1DB954]" />
              <span className="text-sm font-bold">Deep Focus Mode</span>
            </div>
            <button 
              onClick={onToggleFocus}
              className="px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold hover:scale-105 transition-transform"
            >
              Enable
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all">
              <ExternalLink className="w-4 h-4" />
              Resources
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
