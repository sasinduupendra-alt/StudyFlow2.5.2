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
      case 'Critical': return 'text-[#FF453A] border-[#FF453A]/20 bg-[#FF453A]/10';
      case 'Weak': return 'text-[#FF9F0A] border-[#FF9F0A]/20 bg-[#FF9F0A]/10';
      case 'Strong': return 'text-[#32D74B] border-[#32D74B]/20 bg-[#32D74B]/10';
      default: return 'text-[#8E8E93] border-[#8E8E93]/20 bg-[#8E8E93]/10';
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
      className="bg-[#1C1C1E] border border-white/5 shadow-sm rounded-[32px] group cursor-pointer relative overflow-hidden"
      onClick={() => onStartFocus(subject.id)}
    >
      {/* Background Image & Gradient */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={`https://picsum.photos/seed/tech-${(subject.name || '').replace(/\s+/g, '-').toLowerCase()}/800/600?grayscale`}
          alt={subject.name}
          containerClassName="w-full h-full"
          className="opacity-10 group-hover:opacity-20 transition-opacity duration-500"
          fallbackGradient={subject.gradient}
          fallbackText={subject.name?.charAt(0) || '?'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/90 to-transparent" />
      </div>

      <div className="relative z-10 p-6 flex flex-col h-full min-h-[380px]">
        <div className="flex items-start justify-between mb-6">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border",
            getStatusColor(subject.status)
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {subject.status}
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{subject.name}</h3>
          <div className="flex items-center gap-2 text-sm text-[#8E8E93] mb-8">
            <span>{subject.topics?.length || 0} Modules</span>
            {subject.totalStudyTime !== undefined && (
              <>
                <span>•</span>
                <span>{Math.round(subject.totalStudyTime / 60)}h {subject.totalStudyTime % 60}m studied</span>
              </>
            )}
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
                    subject.readiness > 65 ? "text-brand" : subject.readiness > 40 ? "text-[#FF9F0A]" : "text-[#FF453A]"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-white">{Math.round(subject.readiness)}%</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-2xl">
                <p className="text-xs text-[#8E8E93] mb-1">Score</p>
                <p className="text-lg font-semibold text-white">{subject.score}%</p>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl">
                <p className="text-xs text-[#8E8E93] mb-1">Weak</p>
                <p className="text-lg font-semibold text-white">{subject.weakCount}</p>
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="mb-8 space-y-3">
            <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Active Modules</p>
            <div className="space-y-2">
              {subject.topics?.slice(0, 2).map((topic) => (
                <button
                  key={topic.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocus(subject.id, topic.id);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group/link"
                >
                  <span className="text-sm text-[#EBEBF5] group-hover/link:text-white truncate pr-2">
                    {topic.title}
                  </span>
                  <Zap className="w-4 h-4 text-[#8E8E93] group-hover/link:text-brand shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto">
          <button 
            onClick={() => onStartFocus(subject.id)}
            className="flex-1 py-3 text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition-colors rounded-xl"
          >
            Start Session
          </button>
          <button className="w-11 h-11 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-colors group/btn">
            <TrendingUp className="w-5 h-5 text-[#8E8E93] group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default SubjectCard;
