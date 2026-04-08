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
      whileHover={{ scale: 1.02, y: -8, borderColor: 'rgba(29, 185, 84, 0.4)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative bg-[#181818] rounded-2xl overflow-hidden border border-white/5 transition-all duration-500 shadow-2xl"
    >
      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={subject.image}
          alt={subject.name}
          containerClassName="w-full h-full"
          className="opacity-30 group-hover:opacity-50 transition-opacity duration-700"
          fallbackGradient={subject.gradient}
          fallbackText={subject.name[0]}
        />
        <div className={cn("absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent opacity-90")} />
        {/* Aesthetic Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
      </div>

      <div className="relative z-10 p-6 flex flex-col h-full min-h-[280px]">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
            getStatusColor(subject.status)
          )}>
            <StatusIcon className="w-3 h-3" />
            {subject.status}
          </div>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1">
          <h3 className="text-xl md:text-2xl font-bold mb-1 group-hover:text-[#1DB954] transition-colors">{subject.name}</h3>
          <p className="text-xs md:text-sm text-gray-400 mb-6">{subject.topics.length} Topics • {subject.weakCount} Weak Areas</p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-white/10"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - subject.readiness / 100)}
                  className={cn(
                    "transition-all duration-1000",
                    subject.readiness > 65 ? "text-[#1DB954]" : subject.readiness > 40 ? "text-yellow-500" : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  key={subject.readiness}
                  initial={{ scale: 1.1, color: '#1DB954' }}
                  animate={{ scale: 1, color: '#fff' }}
                  className="text-xs font-bold leading-none"
                >
                  {Math.round(subject.readiness)}%
                </motion.span>
                <span className="text-[8px] text-gray-500 uppercase font-bold">Ready</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-2 border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Score</p>
                <p className="text-lg font-bold">{subject.score}%</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-2 border border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Priority</p>
                <p className="text-lg font-bold">#{Math.round(subject.priorityScore)}</p>
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="mb-6 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Quick Links</p>
            <div className="space-y-1.5">
              {subject.topics.slice(0, 3).map((topic) => (
                <button
                  key={topic.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocus(subject.id, topic.id);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-[#1DB954]/10 border border-transparent hover:border-[#1DB954]/20 transition-all group/link"
                >
                  <span className="text-[11px] font-bold text-gray-400 group-hover/link:text-white truncate pr-2">
                    {topic.title}
                  </span>
                  <Zap className="w-3 h-3 text-gray-700 group-hover/link:text-[#1DB954] shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <button 
            onClick={() => onStartFocus(subject.id)}
            className="flex-1 flex items-center justify-center gap-2 h-11 md:h-12 bg-white text-black rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Zap className="w-4 h-4 fill-current" />
            Focus
          </button>
          <button className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all">
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${subject.score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-[#1DB954]" 
        />
      </div>
    </motion.div>
  );
});

export default SubjectCard;
