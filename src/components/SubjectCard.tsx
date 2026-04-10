import React from 'react';
import { Zap, MoreVertical, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Subject } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import ImageWithFallback from './ImageWithFallback';

interface SubjectCardProps {
  subject: Subject;
  onStartFocus: (subjectId: string, topicId?: string) => void;
}

export const SubjectCard = React.memo(({ subject, onStartFocus }: SubjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'text-red-500 border-red-500/20 bg-red-500/10';
      case 'Weak': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
      case 'Strong': return 'text-[#1DB954] border-[#1DB954]/20 bg-[#1DB954]/10';
      default: return 'text-gray-500 border-gray-500/20 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Critical': return AlertTriangle;
      case 'Weak': return TrendingUp;
      case 'Strong': return CheckCircle2;
      default: return TrendingUp;
    }
  };

  const StatusIcon = getStatusIcon(subject.status);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="scifi-panel group cursor-pointer"
      onClick={() => onStartFocus(subject.id)}
    >
      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={subject.image}
          alt={subject.name}
          containerClassName="w-full h-full"
          className="opacity-10 group-hover:opacity-30 transition-opacity duration-1000"
          fallbackGradient={subject.gradient}
          fallbackText={subject.name[0]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
      </div>

      <div className="relative z-10 p-6 flex flex-col h-full min-h-[340px]">
        <div className="flex items-start justify-between mb-6">
          <div className={cn(
            "px-3 py-1 border text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2 backdrop-blur-md",
            getStatusColor(subject.status)
          )}>
            <StatusIcon className="w-3 h-3" />
            {subject.status}
          </div>
          <div className="w-8 h-8 bg-white/5 border border-border-dim flex items-center justify-center text-gray-600 group-hover:text-brand transition-colors">
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-black mb-1 group-hover:text-brand transition-colors uppercase tracking-tight">{subject.name}</h3>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-3 bg-brand/40" />
            <p className="hud-label !text-gray-600">{subject.topics.length} MODULES_DETECTED</p>
          </div>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - subject.readiness / 100)}
                  className={cn(
                    "transition-all duration-1000 shadow-[0_0_10px_var(--color-brand-glow)]",
                    subject.readiness > 65 ? "text-brand" : subject.readiness > 40 ? "text-yellow-500" : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black tabular-nums">{Math.round(subject.readiness)}%</span>
                <span className="text-[7px] text-gray-600 uppercase font-black tracking-tighter">READY</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-2 border border-border-dim">
                <p className="hud-label !text-gray-700">SCORE</p>
                <p className="text-sm font-black tabular-nums">{subject.score}%</p>
              </div>
              <div className="bg-white/5 p-2 border border-border-dim">
                <p className="hud-label !text-gray-700">WEAK</p>
                <p className="text-sm font-black tabular-nums text-red-500">{subject.weakCount}</p>
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="mb-6 space-y-2">
            <p className="hud-label">Module_Index</p>
            <div className="space-y-1">
              {subject.topics.slice(0, 2).map((topic) => (
                <button
                  key={topic.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocus(subject.id, topic.id);
                  }}
                  className="w-full flex items-center justify-between p-2 bg-white/5 border border-transparent hover:border-brand/20 transition-all group/link"
                >
                  <span className="text-[9px] font-black text-gray-600 group-hover/link:text-white truncate pr-2 uppercase tracking-tight">
                    {topic.title}
                  </span>
                  <Zap className="w-3 h-3 text-gray-800 group-hover/link:text-brand shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <button 
            onClick={() => onStartFocus(subject.id)}
            className="scifi-button flex-1"
          >
            <Zap className="w-4 h-4 fill-current" />
            INIT_FOCUS
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-white/5 border border-border-dim hover:border-brand/30 transition-all group/btn">
            <TrendingUp className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${subject.score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)]" 
        />
      </div>
    </motion.div>
  );
});

export default SubjectCard;
