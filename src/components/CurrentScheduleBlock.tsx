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
      case 'study': return 'text-brand bg-brand/10 border-brand/20';
      case 'tuition': return 'text-brand bg-brand/10 border-brand/20';
      case 'break': return 'text-[#8E8E93] bg-white/5 border-white/10';
      case 'rest': return 'text-[#8E8E93] bg-white/5 border-white/10';
      default: return 'text-[#8E8E93] bg-white/5 border-white/10';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "lg:col-span-2 bg-[#1C1C1E] border border-white/5 p-8 md:p-10 group relative overflow-hidden rounded-[32px]",
          (activeActivity?.description || '').toLowerCase().includes('deep work') && "border-brand/30 bg-brand/5"
        )}
      >
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-all duration-1000 group-hover:scale-110">
          <Clock className="w-48 h-48 -translate-y-1/4 translate-x-1/4" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className={cn("w-2.5 h-2.5 rounded-full", activeActivity ? "bg-brand animate-pulse shadow-[0_0_8px_var(--color-brand-glow)]" : "bg-[#8E8E93]")} />
              <span className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wider">Current Activity</span>
            </div>
            <span className="text-sm font-bold text-[#8E8E93] tabular-nums">
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
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className={cn(
                    "w-20 h-20 rounded-[24px] flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm",
                    getActivityColor(activeActivity.type).split(' ')[1],
                    getActivityColor(activeActivity.type).split(' ')[2]
                  )}>
                    {React.createElement(getActivityIcon(activeActivity.type), { className: cn("w-10 h-10", getActivityColor(activeActivity.type).split(' ')[0]) })}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn("text-xs font-bold uppercase tracking-wider", getActivityColor(activeActivity.type).split(' ')[0])}>
                        {activeActivity.type}
                      </span>
                      <span className="text-[#8E8E93]">•</span>
                      <span className="text-sm font-semibold text-[#8E8E93]">
                        {activeActivity.time}
                      </span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                      {activeActivity.description}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-10">
                  <button className="px-8 py-3.5 text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition-colors rounded-full shadow-sm">
                    Start Session
                  </button>
                  {activeActivity.type === 'tuition' && (
                    <span className="px-5 py-3.5 bg-white/5 text-white border border-white/10 rounded-full text-sm font-medium">
                      External Class
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
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Moon className="w-10 h-10 text-[#8E8E93]" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Free Time</h3>
                <p className="text-sm text-[#8E8E93] mt-2">No scheduled activities for this time block.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {reviewCount !== undefined && reviewCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onReviewClick}
              className="mt-10 p-5 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer rounded-[24px] group/review"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[16px] bg-brand/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Review Required</p>
                    <p className="text-xs text-[#8E8E93] mt-0.5">{reviewCount} topics pending review</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8E8E93] group-hover/review:text-white transition-all transform group-hover/review:translate-x-1" />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Next Activity */}
      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#1C1C1E] border border-white/5 p-8 flex flex-col rounded-[32px]"
      >
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wider">Upcoming</h4>
          <button 
            onClick={onViewFullSchedule}
            className="text-sm font-medium text-brand hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            Full Schedule <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1">
          {nextActivity ? (
            <div className="p-5 bg-white/5 border border-white/5 rounded-[24px] hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0", getActivityColor(nextActivity.type).split(' ')[1])}>
                  {React.createElement(getActivityIcon(nextActivity.type), { className: cn("w-6 h-6", getActivityColor(nextActivity.type).split(' ')[0]) })}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#8E8E93] mb-0.5">{nextActivity.time.split(' – ')[0]}</p>
                  <h5 className="font-bold text-base text-white truncate">{nextActivity.description}</h5>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-dashed border-white/10 rounded-[24px]">
              <Calendar className="w-10 h-10 text-[#8E8E93] mb-4" />
              <p className="text-sm font-semibold text-[#8E8E93]">No more activities today</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Daily Progress</span>
            <span className="text-sm font-bold text-white tabular-nums">
              {Math.round((todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100) || 0}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / Math.max(todaySchedule.length, 1)) * 100}%` }}
              className="h-full bg-brand rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default CurrentScheduleBlock;
