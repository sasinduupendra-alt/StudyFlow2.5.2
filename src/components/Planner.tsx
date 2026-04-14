import React from 'react';
import { Zap, Clock, Target, BookOpen, CheckCircle2, ChevronRight, Play, Calendar, Brain } from 'lucide-react';
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
  const studyBlocks = dailyPlan.filter(a => a.type === 'study');

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
          {dailyPlan.map((activity, index) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={activity.id}
              className={cn(
                "group flex items-center gap-5 p-4 rounded-[20px] transition-all duration-300",
                activity.type === 'study' ? "bg-white/5 border border-white/5 hover:bg-white/10" : "opacity-60 hover:opacity-100 border border-transparent hover:bg-white/5"
              )}
            >
              <div className="w-16 text-sm font-semibold text-[#8E8E93] tabular-nums">
                {activity.time.split(' – ')[0]}
              </div>
              
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                activity.type === 'study' ? "bg-brand/10 text-brand" :
                activity.type === 'tuition' ? "bg-blue-500/10 text-blue-500" :
                activity.type === 'break' ? "bg-[#FF9F0A]/10 text-[#FF9F0A]" :
                "bg-white/5 text-[#8E8E93]"
              )}>
                {activity.type === 'study' ? <BookOpen className="w-5 h-5" /> :
                 activity.type === 'tuition' ? <Zap className="w-5 h-5" /> :
                 activity.type === 'break' ? <Clock className="w-5 h-5" /> :
                 <CheckCircle2 className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base text-white truncate">{activity.description}</h4>
                <p className="text-sm font-medium text-[#8E8E93] capitalize mt-0.5">{activity.type}</p>
              </div>

              {activity.type === 'study' && (
                <button 
                  onClick={() => onStartFocus(prioritySubject?.id || '')}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                </button>
              )}
              
              <ChevronRight className="w-5 h-5 text-[#8E8E93] group-hover:text-white transition-colors shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Planner;
