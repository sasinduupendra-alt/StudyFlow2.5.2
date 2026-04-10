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
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* AI Planner Card */}
      <div className="scifi-panel p-8 md:p-12 group overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-all duration-1000">
          <Zap className="w-48 h-48 text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="px-4 py-1 bg-brand/10 border border-brand/20 text-[9px] font-black uppercase tracking-[0.3em] text-brand shadow-[0_0_15px_rgba(29,185,84,0.1)]">
              AI_PLANNER_ACTIVE
            </div>
            {prioritySubject && (
              <div className="px-4 py-1 bg-white/5 border border-border-dim text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                PRIORITY_TARGET: {prioritySubject.name}
              </div>
            )}
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter uppercase leading-none">Daily_Focus_Plan</h2>
          <p className="text-xs md:text-sm text-gray-500 mb-10 max-w-2xl font-black uppercase tracking-widest leading-relaxed">
            Neural optimization complete. Recommended focus blocks synchronized with current mastery metrics.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {['Deep Work', 'Weak Topic', 'Timed Practice', 'Revision'].map((label, i) => (
              <motion.div 
                key={label} 
                whileHover={{ y: -5, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                className="bg-white/5 border border-border-dim p-4 transition-all cursor-default"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="hud-label">BLOCK_0{i + 1}</span>
                  <Clock className="w-3 h-3 text-gray-600" />
                </div>
                <p className="font-black text-xs uppercase tracking-tight">{label}</p>
                <p className="hud-label !text-gray-700 mt-2">90M_SPRINT</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Schedule List */}
      <div className="scifi-panel p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-brand shadow-[0_0_10px_var(--color-brand-glow)]" />
            <h3 className="text-lg font-black uppercase tracking-tighter">Today_Schedule</h3>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6">
            <button 
              onClick={onViewFullSchedule}
              className="hud-label hover:text-brand transition-colors"
            >
              EXPAND_FULL_LOG
            </button>
            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-black uppercase tracking-widest bg-white/5 px-4 py-1.5 border border-border-dim">
              <Calendar className="w-3 h-3 text-brand" />
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
                "group flex items-center gap-4 md:gap-8 p-3 transition-all duration-500 border border-transparent",
                activity.type === 'study' ? "bg-white/5 hover:border-brand/30" : "opacity-30 hover:opacity-100"
              )}
            >
              <div className="w-16 md:w-24 text-[10px] font-black text-gray-600 tabular-nums tracking-tighter">
                {activity.time.split(' – ')[0]}
              </div>
              
              <div className={cn(
                "w-10 h-10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 shrink-0 border",
                activity.type === 'study' ? "bg-brand/5 text-brand border-brand/20" :
                activity.type === 'tuition' ? "bg-blue-500/5 text-blue-500 border-blue-500/20" :
                activity.type === 'break' ? "bg-yellow-500/5 text-yellow-500 border-yellow-500/20" :
                "bg-gray-500/5 text-gray-500 border-gray-500/20"
              )}>
                {activity.type === 'study' ? <BookOpen className="w-5 h-5" /> :
                 activity.type === 'tuition' ? <Zap className="w-5 h-5" /> :
                 activity.type === 'break' ? <Clock className="w-5 h-5" /> :
                 <CheckCircle2 className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-black text-[11px] uppercase truncate tracking-tight group-hover:text-brand transition-colors">{activity.description}</h4>
                <p className="hud-label !text-gray-700">{activity.type}</p>
              </div>

              {activity.type === 'study' && (
                <button 
                  onClick={() => onStartFocus(prioritySubject?.id || '')}
                  className="w-10 h-10 bg-brand flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_15px_var(--color-brand-glow)]"
                  style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)' }}
                >
                  <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                </button>
              )}
              
              <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-gray-400 transition-colors shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Planner;
