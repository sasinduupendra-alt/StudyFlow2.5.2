import React, { useState, useEffect } from 'react';
import { WeeklySchedule, Activity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Zap, BookOpen, Coffee, Moon, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { parseTimeStr } from '../lib/timeUtils';

interface CurrentScheduleBlockProps {
  schedule: WeeklySchedule;
  onViewFullSchedule: () => void;
}

export const CurrentScheduleBlock = React.memo(({ schedule, onViewFullSchedule }: CurrentScheduleBlockProps) => {
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
      case 'study': return 'text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/20';
      case 'tuition': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'break': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'rest': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
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
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-none", activeActivity ? "bg-white animate-pulse" : "bg-zinc-700")} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Current Session</span>
            </div>
            <span className="text-xs font-mono text-zinc-500 tabular-nums">
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
                    "w-16 h-16 rounded-none flex items-center justify-center shrink-0 transition-all duration-500",
                    getActivityColor(activeActivity.type).split(' ')[1],
                    "border border-white/20"
                  )}>
                    {React.createElement(getActivityIcon(activeActivity.type), { className: cn("w-8 h-8", getActivityColor(activeActivity.type).split(' ')[0]) })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-[10px] font-mono uppercase tracking-widest", getActivityColor(activeActivity.type).split(' ')[0])}>
                        {activeActivity.type}
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        {activeActivity.time}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-mono uppercase tracking-widest text-white group-hover:text-zinc-300 transition-colors duration-500">
                      {activeActivity.description}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-8">
                  <button className="px-6 py-2 text-xs font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors rounded-none border border-transparent">
                    Start Session
                  </button>
                  {activeActivity.type === 'tuition' && (
                    <span className="px-3 py-1 bg-transparent text-blue-500 border border-blue-500/30 rounded-none text-[10px] font-mono uppercase tracking-widest">
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
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-none bg-transparent border border-white/20 flex items-center justify-center mb-4">
                  <Moon className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-mono uppercase tracking-widest text-zinc-400">System Idle</h3>
                <p className="text-xs font-mono text-zinc-600 mt-1 uppercase tracking-widest">No scheduled activities for this time block.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Next Activity */}
      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-transparent border border-white/10 p-8 flex flex-col rounded-none"
      >
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Upcoming</h4>
          <button 
            onClick={onViewFullSchedule}
            className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 hover:text-white transition-colors flex items-center gap-1"
          >
            Full Schedule <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1">
          {nextActivity ? (
            <div className="p-5 bg-transparent border border-white/10 rounded-none hover:border-white/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-none flex items-center justify-center shrink-0 border border-white/20", getActivityColor(nextActivity.type).split(' ')[1])}>
                  {React.createElement(getActivityIcon(nextActivity.type), { className: cn("w-5 h-5", getActivityColor(nextActivity.type).split(' ')[0]) })}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{nextActivity.time.split(' – ')[0]}</p>
                  <h5 className="font-mono uppercase tracking-widest text-sm text-white truncate group-hover:text-zinc-300 transition-colors">{nextActivity.description}</h5>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-transparent border border-dashed border-white/20 rounded-none">
              <Calendar className="w-8 h-8 text-zinc-600 mb-3" />
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">End of Queue</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Daily Progress</span>
            <span className="text-xs font-mono text-white tabular-nums">
              {Math.round((todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-zinc-900 rounded-none overflow-hidden border border-white/10">
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
