import React from 'react';
import { Zap, Clock, Target, BookOpen, CheckCircle2, ChevronRight, Play, Calendar } from 'lucide-react';
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* AI Planner Card */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#1DB954] via-[#1DB954]/80 to-[#191414] p-6 md:p-8 shadow-[0_20px_50px_rgba(29,185,84,0.2)] group">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
          <Zap className="w-32 h-32 md:w-48 md:h-48 text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
            <div className="px-3 py-1 bg-black/30 backdrop-blur-xl rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10">
              AI Study Planner
            </div>
            {prioritySubject && (
              <div className="px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10">
                Priority: {prioritySubject.name}
              </div>
            )}
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-5 tracking-tighter leading-none">Your Daily Focus Plan</h2>
          <p className="text-sm md:text-xl text-white/90 mb-8 md:mb-10 max-w-2xl font-medium leading-relaxed">
            Based on your weekly schedule and current mastery, we've optimized your blocks for maximum retention.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {['Deep Work', 'Weak Topic', 'Timed Practice', 'Revision'].map((label, i) => (
              <motion.div 
                key={label} 
                whileHover={{ y: -5, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                className="bg-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/10 transition-all cursor-default shadow-lg"
              >
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/70">Block {i + 1}</span>
                  <Clock className="w-3.5 h-3.5 text-white/70" />
                </div>
                <p className="font-black text-sm md:text-xl tracking-tight">{label}</p>
                <p className="text-[10px] md:text-xs text-white/70 mt-1 md:mt-1.5 font-bold">90 Min Sprint</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Schedule List */}
      <div className="bg-[#181818] rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-bold">Today's Schedule</h3>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <button 
              onClick={onViewFullSchedule}
              className="text-[10px] md:text-xs font-bold text-[#1DB954] hover:underline"
            >
              View Full Schedule
            </button>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {dailyPlan.map((activity, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={activity.id}
              className={cn(
                "group flex items-center gap-3 md:gap-6 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300",
                activity.type === 'study' ? "bg-white/5 hover:bg-white/10" : "opacity-60 hover:opacity-100"
              )}
            >
              <div className="w-16 md:w-24 text-xs md:text-sm font-bold text-gray-500 tabular-nums">
                {activity.time.split(' – ')[0]}
              </div>
              
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                activity.type === 'study' ? "bg-[#1DB954]/20 text-[#1DB954]" :
                activity.type === 'tuition' ? "bg-blue-500/20 text-blue-500" :
                activity.type === 'break' ? "bg-yellow-500/20 text-yellow-500" :
                "bg-gray-500/20 text-gray-500"
              )}>
                {activity.type === 'study' ? <BookOpen className="w-5 h-5 md:w-6 md:h-6" /> :
                 activity.type === 'tuition' ? <Zap className="w-5 h-5 md:w-6 md:h-6" /> :
                 activity.type === 'break' ? <Clock className="w-5 h-5 md:w-6 md:h-6" /> :
                 <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm md:text-lg truncate">{activity.description}</h4>
                <p className="text-[10px] md:text-sm text-gray-500 capitalize">{activity.type}</p>
              </div>

              {activity.type === 'study' && (
                <button 
                  onClick={() => onStartFocus(prioritySubject?.id || '')}
                  className="w-11 h-11 md:w-10 md:h-10 bg-[#1DB954] rounded-full flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all transform md:translate-x-4 group-hover:translate-x-0 shrink-0"
                >
                  <Play className="w-4 h-4 md:w-4 md:h-4 text-black fill-current ml-0.5" />
                </button>
              )}
              
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Planner;
