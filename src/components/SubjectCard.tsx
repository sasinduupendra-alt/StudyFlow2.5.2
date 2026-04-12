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

      <div className="relative z-10 p-6 flex flex-col h-full min-h-[360px]">
        <div className="flex items-start justify-between mb-6">
          <div className={cn(
            "px-3 py-1 rounded-none text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border",
            getStatusColor(subject.status)
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {subject.status}
          </div>
          <div className="w-8 h-8 rounded-none bg-transparent border border-white/20 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-widest group-hover:text-white transition-colors">{subject.name}</h3>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-6">{subject.topics.length} Modules</p>
          
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
                  className="text-white/10"
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
                    "transition-all duration-1000 rounded-none",
                    subject.readiness > 65 ? "text-white" : subject.readiness > 40 ? "text-zinc-400" : "text-zinc-600"
                  )}
                  strokeLinecap="square"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-mono text-white tabular-nums">{Math.round(subject.readiness)}%</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-transparent p-2.5 rounded-none border border-white/10">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Score</p>
                <p className="text-sm font-mono text-white tabular-nums">{subject.score}%</p>
              </div>
              <div className="bg-transparent p-2.5 rounded-none border border-white/10">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Weak</p>
                <p className="text-sm font-mono text-zinc-400 tabular-nums">{subject.weakCount}</p>
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="mb-6 space-y-3">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Recent Modules</p>
            <div className="space-y-2">
              {subject.topics.slice(0, 2).map((topic) => (
                <button
                  key={topic.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocus(subject.id, topic.id);
                  }}
                  className="w-full flex items-center justify-between p-2.5 bg-transparent border border-white/10 rounded-none hover:border-white/30 transition-all group/link"
                >
                  <span className="text-[10px] font-mono text-zinc-500 group-hover/link:text-white uppercase tracking-widest truncate pr-2">
                    {topic.title}
                  </span>
                  <Zap className="w-3 h-3 text-zinc-700 group-hover/link:text-white shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <button 
            onClick={() => onStartFocus(subject.id)}
            className="flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors rounded-none"
          >
            Start Focus
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-transparent border border-white/20 rounded-none hover:border-white/50 transition-all group/btn">
            <TrendingUp className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
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
