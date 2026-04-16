import React from 'react';
import { Zap, Clock, Target, BookOpen, CheckCircle2, ChevronRight, Play, Calendar, Brain, Coffee, Moon } from 'lucide-react';
import { Subject, Activity } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PlannerProps {
  prioritySubject: Subject | null;
  dailyPlan: Activity[];
  onStartFocus: (subjectId: string, topicId?: string) => void;
  onViewFullSchedule: () => void;
}

export const Planner = React.memo(({ prioritySubject, dailyPlan, onStartFocus, onViewFullSchedule }: PlannerProps) => {
  const [currentTimeMinutes, setCurrentTimeMinutes] = React.useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const currentActivityIndex = dailyPlan.findIndex(activity => {
    const [startStr, endStr] = activity.time.split(' – ');
    if (!startStr || !endStr) return false;
    const startMins = (startStr.split(':').map(Number)[0] * 60) + startStr.split(':').map(Number)[1];
    const endMins = (endStr.split(':').map(Number)[0] * 60) + endStr.split(':').map(Number)[1];
    return currentTimeMinutes >= startMins && currentTimeMinutes < endMins;
  });

  const nextActivityIndex = currentActivityIndex !== -1 
    ? currentActivityIndex + 1 
    : dailyPlan.findIndex(activity => {
        const startStr = activity.time.split(' – ')[0];
        const startMins = (startStr.split(':').map(Number)[0] * 60) + startStr.split(':').map(Number)[1];
        return startMins > currentTimeMinutes;
      });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* AI Planner Card */}
      <div className="bg-[#1C1C1E] border border-white/5 p-8 md:p-10 group overflow-hidden relative rounded-[32px]">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-all duration-1000">
          <Zap className="w-48 h-48 text-brand" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full text-xs font-semibold text-brand">
              AI Optimization Active
            </div>
            {prioritySubject && (
              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-[#8E8E93]">
                Priority: {prioritySubject.name}
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">Daily Focus Plan</h2>
          <p className="text-sm text-[#8E8E93] mb-10 max-w-2xl leading-relaxed">
            Your study blocks have been optimized based on current mastery metrics and upcoming deadlines.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Deep Work', duration: '90m', icon: Target },
              { label: 'Weak Topic', duration: '45m', icon: Brain },
              { label: 'Practice', duration: '60m', icon: Zap },
              { label: 'Revision', duration: '30m', icon: Clock }
            ].map((block, i) => (
              <motion.div 
                key={block.label} 
                whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                className="bg-white/5 border border-white/5 p-5 rounded-[24px] transition-all cursor-default group/block"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/block:bg-brand/10 transition-colors">
                    <block.icon className="w-5 h-5 text-[#8E8E93] group-hover/block:text-brand" />
                  </div>
                  <span className="text-xs font-semibold text-[#8E8E93]">Block 0{i + 1}</span>
                </div>
                <p className="font-bold text-base text-white">{block.label}</p>
                <p className="text-xs font-medium text-[#8E8E93] mt-1">{block.duration} Sprint</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Schedule List */}
      <div className="bg-[#1C1C1E] border border-white/5 p-8 rounded-[32px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white tracking-tight">Today's Schedule</h3>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6">
            <button 
              onClick={onViewFullSchedule}
              className="text-sm font-semibold text-brand hover:opacity-80 transition-opacity"
            >
              View Full Log
            </button>
            <div className="flex items-center gap-2 text-sm text-[#8E8E93] font-medium bg-white/5 px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4" />
              <span className="tabular-nums">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {dailyPlan.map((activity, index) => {
            const isCurrent = index === currentActivityIndex;
            const isNext = index === nextActivityIndex;
            const isIrrelevant = !isCurrent && !isNext;
            const isBreak = activity.type === 'break' || activity.type === 'rest';

            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: isIrrelevant ? 0.2 : 1, 
                  x: 0,
                  scale: isCurrent ? 1.05 : 1,
                  filter: isIrrelevant ? 'blur(1px)' : 'none'
                }}
                transition={{ delay: index * 0.05 }}
                key={activity.id}
                className={cn(
                  "group flex items-center gap-6 p-6 rounded-[24px] transition-all duration-500 relative overflow-hidden",
                  isCurrent ? "bg-brand/10 border-brand shadow-[0_0_30px_rgba(var(--color-brand-rgb),0.15)] ring-1 ring-brand/50" : 
                             "bg-white/5 border border-white/5",
                  (isBreak && !isCurrent) && "opacity-40 grayscale scale-95",
                  "mb-4" // Visual spacing - Quiet Zone
                )}
              >
                {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand shadow-[0_0_10px_rgba(var(--color-brand-rgb),0.5)]" />}
                
                <div className={cn(
                  "w-16 text-sm font-semibold tabular-nums",
                  isCurrent ? "text-brand" : "text-[#8E8E93]"
                )}>
                  {activity.time.split(' – ')[0]}
                </div>
                
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
                  activity.type === 'study' ? "bg-brand text-white shadow-lg" :
                  activity.type === 'tuition' ? "bg-blue-500/10 text-blue-500" :
                  isBreak ? "bg-white/5 text-[#48484A]" :
                  "bg-white/5 text-[#8E8E93]"
                )}>
                  {activity.type === 'study' ? <BookOpen className="w-6 h-6 animate-pulse" /> :
                   activity.type === 'tuition' ? <Zap className="w-6 h-6" /> :
                   activity.type === 'break' ? <Coffee className="w-6 h-6" /> :
                   activity.type === 'rest' ? <Moon className="w-6 h-6" /> :
                   <CheckCircle2 className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className={cn(
                      "transition-all duration-500 truncate", 
                      isCurrent ? "text-xl font-black text-white" : 
                      (activity.type === 'study' ? "text-base font-bold text-white/90" : "text-base font-medium text-white/50")
                    )}>
                      {activity.description}
                    </h4>
                    {isCurrent && (
                      <span className="px-2.5 py-1 bg-brand text-black text-[10px] font-black uppercase tracking-[0.1em] rounded-full">
                        Neural Sync
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs font-bold uppercase tracking-widest mt-1",
                    isCurrent ? "text-brand" : "text-[#48484A]"
                  )}>
                    {isBreak ? "Quiet Zone / Recovery" : activity.type}
                  </p>
                </div>

                {activity.type === 'study' && isCurrent && (
                  <button 
                    onClick={() => onStartFocus(prioritySubject?.id || '')}
                    className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 shrink-0"
                  >
                    Initiate
                  </button>
                )}
                
                {isNext && (
                  <div className="text-[10px] font-mono text-brand uppercase tracking-tighter bg-brand/5 px-2 py-1 rounded border border-brand/20">
                    Next
                  </div>
                )}
                
                <ChevronRight className="w-5 h-5 text-[#8E8E93] group-hover:text-white transition-colors shrink-0" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default Planner;
