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
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* AI Planner Card */}
      <div className="bg-transparent border border-white/10 p-8 md:p-10 group overflow-hidden relative rounded-none">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-all duration-1000">
          <Zap className="w-48 h-48 text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="px-3 py-1 bg-transparent border border-white/30 rounded-none text-[10px] font-mono uppercase tracking-widest text-white">
              AI Optimization Active
            </div>
            {prioritySubject && (
              <div className="px-3 py-1 bg-black border border-white/20 rounded-none text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Priority: {prioritySubject.name}
              </div>
            )}
          </div>

          <h2 className="text-3xl font-mono uppercase tracking-widest text-white mb-4">Daily Focus Plan</h2>
          <p className="text-xs font-mono text-zinc-500 mb-10 max-w-2xl leading-relaxed uppercase tracking-widest">
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
                className="bg-transparent border border-white/10 p-5 rounded-none transition-all cursor-default group/block"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-none bg-transparent border border-white/20 flex items-center justify-center group-hover/block:border-white transition-colors">
                    <block.icon className="w-4 h-4 text-zinc-500 group-hover/block:text-white" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Block 0{i + 1}</span>
                </div>
                <p className="font-mono text-sm text-white uppercase tracking-widest">{block.label}</p>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{block.duration} Sprint</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Schedule List */}
      <div className="bg-transparent border border-white/10 p-8 rounded-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-mono uppercase tracking-widest text-white">Today's Schedule</h3>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-6">
            <button 
              onClick={onViewFullSchedule}
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              View Full Log
            </button>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest bg-black px-4 py-1.5 border border-white/20 rounded-none">
              <Calendar className="w-3 h-3 text-white" />
              <span className="tabular-nums">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {dailyPlan.map((activity, index) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={activity.id}
              className={cn(
                "group flex items-center gap-6 p-4 rounded-none transition-all duration-300",
                activity.type === 'study' ? "bg-transparent border border-white/10 hover:border-white/30" : "opacity-40 hover:opacity-100 border border-transparent"
              )}
            >
              <div className="w-16 text-xs font-mono text-zinc-500 tabular-nums uppercase tracking-widest">
                {activity.time.split(' – ')[0]}
              </div>
              
              <div className={cn(
                "w-10 h-10 rounded-none flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 border border-white/20",
                activity.type === 'study' ? "bg-transparent text-white" :
                activity.type === 'tuition' ? "bg-transparent text-blue-500" :
                activity.type === 'break' ? "bg-transparent text-yellow-500" :
                "bg-transparent text-zinc-500"
              )}>
                {activity.type === 'study' ? <BookOpen className="w-5 h-5" /> :
                 activity.type === 'tuition' ? <Zap className="w-5 h-5" /> :
                 activity.type === 'break' ? <Clock className="w-5 h-5" /> :
                 <CheckCircle2 className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-mono text-sm text-white uppercase tracking-widest truncate group-hover:text-zinc-300 transition-colors">{activity.description}</h4>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{activity.type}</p>
              </div>

              {activity.type === 'study' && (
                <button 
                  onClick={() => onStartFocus(prioritySubject?.id || '')}
                  className="w-10 h-10 rounded-none bg-white flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-200"
                >
                  <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                </button>
              )}
              
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Planner;
