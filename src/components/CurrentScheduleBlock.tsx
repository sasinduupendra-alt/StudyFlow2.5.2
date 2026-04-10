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
      {/* Current Activity */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="lg:col-span-2 scifi-panel p-8 md:p-10 group"
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12">
          <Clock className="w-48 h-48 -translate-y-1/4 translate-x-1/4" />
        </div>
        
        {activeActivity && (
          <div className={cn("absolute top-0 left-0 w-full h-full opacity-5 blur-[100px] pointer-events-none transition-colors duration-1000", getActivityColor(activeActivity.type).split(' ')[1])} />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 border border-border-dim">
              <div className="w-2 h-2 bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">LIVE_STATUS: ACTIVE</span>
            </div>
            <span className="text-[10px] font-black text-gray-500 tabular-nums bg-white/5 px-4 py-1.5 border border-border-dim">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}_UTC
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeActivity ? (
              <motion.div 
                key={activeActivity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-8">
                  <div className={cn("p-5 border shadow-[0_0_20px_rgba(0,0,0,0.5)]", getActivityColor(activeActivity.type))}>
                    {React.createElement(getActivityIcon(activeActivity.type), { className: "w-10 h-10" })}
                  </div>
                  <div>
                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 uppercase leading-none">{activeActivity.description}</h3>
                    <p className="hud-label !text-gray-600">{activeActivity.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <span className={cn(
                    "px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] border",
                    getActivityColor(activeActivity.type)
                  )}>
                    {activeActivity.type}_MODULE
                  </span>
                  {activeActivity.type === 'tuition' && (
                    <span className="px-4 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/30 text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                      REMOTE_SYNC
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="no-activity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center lg:text-left"
              >
                <h3 className="text-2xl font-black text-gray-700 mb-2 uppercase tracking-tighter">System_Idle</h3>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">No scheduled tasks detected. Standby mode active.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Next Activity / Quick View */}
      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="scifi-panel p-8 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h4 className="hud-label">UP_NEXT</h4>
          <button 
            onClick={onViewFullSchedule}
            className="hud-label hover:text-brand transition-colors"
          >
            FULL_LOG <ChevronRight className="w-3 h-3 inline" />
          </button>
        </div>

        <div className="flex-1 relative z-10">
          {nextActivity ? (
            <div className="flex items-start gap-4 p-4 bg-white/5 border border-border-dim hover:border-brand/30 transition-all cursor-pointer group">
              <div className={cn("p-2 border", getActivityColor(nextActivity.type))}>
                {React.createElement(getActivityIcon(nextActivity.type), { className: "w-4 h-4" })}
              </div>
              <div className="min-w-0">
                <p className="hud-label !text-gray-600 mb-1">{nextActivity.time.split(' – ')[0]}</p>
                <h5 className="font-black text-[11px] uppercase truncate group-hover:text-brand transition-colors tracking-tight">{nextActivity.description}</h5>
                <p className="hud-label !text-gray-700 mt-0.5">{nextActivity.type}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Calendar className="w-8 h-8 text-gray-800 mb-3" />
              <p className="hud-label !text-gray-700">END_OF_QUEUE</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border-dim relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="hud-label">DAILY_QUOTA</span>
            <span className="text-[10px] font-black tabular-nums">{Math.round((todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100)}%</span>
          </div>
          <div className="h-[2px] bg-white/5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100}%` }}
              className="h-full bg-brand shadow-[0_0_5px_var(--color-brand-glow)]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default CurrentScheduleBlock;
