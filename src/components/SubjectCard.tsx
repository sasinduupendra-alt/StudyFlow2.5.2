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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="enterprise-card group cursor-pointer relative overflow-hidden"
      onClick={() => onStartFocus(subject.id)}
    >
      <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={subject.image}
          alt={subject.name}
          containerClassName="w-full h-full"
          className="opacity-5 group-hover:opacity-10 transition-opacity duration-1000"
          fallbackGradient={subject.gradient}
          fallbackText={subject.name[0]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent" />
      </div>

      <div className="relative z-10 p-6 flex flex-col h-full min-h-[380px]">
        <div className="flex items-start justify-between mb-8">
          <div className={cn(
            "px-3 py-1 rounded-none text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 backdrop-blur-md border",
            getStatusColor(subject.status)
          )}>
            <StatusIcon className="w-3 h-3" />
            {subject.status}
          </div>
          <div className="w-8 h-8 rounded-none bg-transparent border border-white/10 flex items-center justify-center text-zinc-600 hover:text-white hover:border-white/30 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-black text-white mb-1 uppercase tracking-[0.15em] group-hover:text-white transition-colors">{subject.name}</h3>
          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-8">{subject.topics?.length || 0} Modules // Node {subject.id.toUpperCase()}</p>
          
          <div className="flex items-center gap-8 mb-10">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-white/5"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - subject.readiness / 100)}
                  className={cn(
                    "transition-all duration-1000 rounded-none",
                    subject.readiness > 65 ? "text-white" : subject.readiness > 40 ? "text-zinc-400" : "text-zinc-600"
                  )}
                  strokeLinecap="square"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-mono text-white tabular-nums tracking-tighter">{Math.round(subject.readiness)}%</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="bg-transparent p-3 rounded-none border border-white/5">
                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Score</p>
                <p className="text-sm font-mono text-white tabular-nums tracking-tighter">{subject.score}%</p>
              </div>
              <div className="bg-transparent p-3 rounded-none border border-white/5">
                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Weak</p>
                <p className="text-sm font-mono text-zinc-500 tabular-nums tracking-tighter">{subject.weakCount}</p>
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="mb-8 space-y-4">
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Active Modules</p>
            <div className="space-y-2">
              {subject.topics?.slice(0, 2).map((topic) => (
                <button
                  key={topic.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocus(subject.id, topic.id);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-transparent border border-white/5 rounded-none hover:border-white/20 transition-all group/link"
                >
                  <span className="text-[9px] font-mono text-zinc-500 group-hover/link:text-white uppercase tracking-[0.15em] truncate pr-2">
                    {topic.title}
                  </span>
                  <Zap className="w-3 h-3 text-zinc-800 group-hover/link:text-white shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <button 
            onClick={() => onStartFocus(subject.id)}
            className="flex-1 py-3 text-[10px] font-mono uppercase tracking-[0.2em] bg-white text-black hover:bg-zinc-200 transition-colors rounded-none font-bold"
          >
            Initialize
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-transparent border border-white/10 rounded-none hover:border-white/30 transition-all group/btn">
            <TrendingUp className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${subject.score}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
        />
      </div>
    </motion.div>
  );
});

export default SubjectCard;
