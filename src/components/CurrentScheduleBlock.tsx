import React, { useState, useEffect } from 'react';
import { WeeklySchedule, Activity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Zap, BookOpen, Coffee, Moon, ChevronRight, Calendar, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { parseTimeStr } from '../lib/timeUtils';

interface CurrentScheduleBlockProps {
  schedule: WeeklySchedule;
  onViewFullSchedule: () => void;
  reviewCount?: number;
  onReviewClick?: () => void;
}

export const CurrentScheduleBlock = React.memo(({ schedule, onViewFullSchedule, reviewCount, onReviewClick }: CurrentScheduleBlockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const days: (keyof WeeklySchedule)[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[currentTime.getDay()];
  const todaySchedule = schedule[currentDay] || [];

  const getActiveActivity = () => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    return todaySchedule.find(activity => {
      const [startStr, endStr] = activity.time.split(' – ');
      if (!startStr || !endStr) return false;
      
      const startMinutes = parseTimeStr(startStr);
      const endMinutes = parseTimeStr(endStr);
      
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
  };

  const getNextActivity = () => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return todaySchedule.find(activity => {
      const [startStr] = activity.time.split(' – ');
      return parseTimeStr(startStr) > currentMinutes;
    });
  };

  const activeActivity = getActiveActivity();
  const nextActivity = getNextActivity();

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'study': return BookOpen;
      case 'tuition': return Zap;
      case 'break': return Coffee;
      case 'rest': return Moon;
      default: return Clock;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'study': return 'text-white bg-white/10 border-white/20';
      case 'tuition': return 'text-white bg-white/10 border-white/20';
      case 'break': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
      case 'rest': return 'text-zinc-700 bg-zinc-700/10 border-zinc-700/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "lg:col-span-2 bg-transparent border border-white/10 p-8 md:p-10 group relative overflow-hidden rounded-none",
          activeActivity?.description.toLowerCase().includes('deep work') && "border-white/30 bg-white/[0.02]"
        )}
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all duration-1000 group-hover:scale-110">
          <Clock className="w-48 h-48 -translate-y-1/4 translate-x-1/4" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className={cn("w-2 h-2 rounded-none", activeActivity ? "bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-zinc-800")} />
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600">Active Protocol</span>
            </div>
            <span className="text-xs font-mono text-zinc-600 tabular-nums tracking-tighter">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeActivity ? (
              <motion.div 
                key={activeActivity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col justify-center"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-10">
                  <div className={cn(
                    "w-20 h-20 rounded-none flex items-center justify-center shrink-0 transition-all duration-500",
                    getActivityColor(activeActivity.type).split(' ')[1],
                    "border border-white/10"
                  )}>
                    {React.createElement(getActivityIcon(activeActivity.type), { className: cn("w-10 h-10", getActivityColor(activeActivity.type).split(' ')[0]) })}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={cn("text-[9px] font-mono uppercase tracking-[0.2em]", getActivityColor(activeActivity.type).split(' ')[0])}>
                        {activeActivity.type}
                      </span>
                      <span className="text-zinc-800">//</span>
                      <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
                        {activeActivity.time}
                      </span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white group-hover:text-zinc-300 transition-colors duration-500 leading-none">
                      {activeActivity.description}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-12">
                  <button className="px-10 py-4 text-[10px] font-mono uppercase tracking-[0.2em] bg-white text-black hover:bg-zinc-200 transition-colors rounded-none font-bold">
                    Initialize Session
                  </button>
                  {activeActivity.type === 'tuition' && (
                    <span className="px-4 py-2 bg-transparent text-white border border-white/20 rounded-none text-[9px] font-mono uppercase tracking-[0.2em]">
                      External Sync
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="no-activity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 rounded-none bg-transparent border border-white/10 flex items-center justify-center mb-6">
                  <Moon className="w-10 h-10 text-zinc-800" />
                </div>
                <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-700">System Idle</h3>
                <p className="text-[10px] font-mono text-zinc-800 mt-2 uppercase tracking-[0.2em]">No scheduled activities for this time block.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {reviewCount !== undefined && reviewCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onReviewClick}
              className="mt-12 p-6 bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all cursor-pointer group/review"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="w-4 h-4 text-zinc-500 group-hover/review:text-white transition-colors" />
                  <div>
                    <p className="text-[10px] font-mono text-white uppercase tracking-widest">Review Required</p>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">{reviewCount} Topics pending recalibration</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover/review:text-white transition-all" />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Next Activity */}
      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-transparent border border-white/5 p-10 flex flex-col rounded-none"
      >
        <div className="flex items-center justify-between mb-10">
          <h4 className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600">Upcoming</h4>
          <button 
            onClick={onViewFullSchedule}
            className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-700 hover:text-white transition-colors flex items-center gap-2"
          >
            Temporal Grid <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1">
          {nextActivity ? (
            <div className="p-6 bg-transparent border border-white/5 rounded-none hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-6">
                <div className={cn("w-12 h-12 rounded-none flex items-center justify-center shrink-0 border border-white/10", getActivityColor(nextActivity.type).split(' ')[1])}>
                  {React.createElement(getActivityIcon(nextActivity.type), { className: cn("w-6 h-6", getActivityColor(nextActivity.type).split(' ')[0]) })}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em] mb-1">{nextActivity.time.split(' – ')[0]}</p>
                  <h5 className="font-mono uppercase tracking-[0.15em] text-xs text-white truncate group-hover:text-zinc-300 transition-colors">{nextActivity.description}</h5>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-transparent border border-dashed border-white/5 rounded-none">
              <Calendar className="w-10 h-10 text-zinc-800 mb-4" />
              <p className="text-[9px] font-mono text-zinc-800 uppercase tracking-[0.2em]">End of Queue</p>
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">Cycle Progress</span>
            <span className="text-xs font-mono text-white tabular-nums tracking-tighter">
              {Math.round((todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100)}%
            </span>
          </div>
          <div className="h-[2px] bg-white/5 rounded-none overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100}%` }}
              className="h-full bg-white rounded-none"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default CurrentScheduleBlock;
