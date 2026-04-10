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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="lg:col-span-2 bg-gradient-to-br from-[#181818] to-[#121212] rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110">
          <Clock className="w-48 h-48 -translate-y-1/4 translate-x-1/4" />
        </div>
        
        {activeActivity && (
          <div className={cn("absolute top-0 left-0 w-full h-full opacity-10 blur-[100px] pointer-events-none transition-colors duration-1000", getActivityColor(activeActivity.type).split(' ')[1])} />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Happening Now</span>
            </div>
            <span className="text-sm font-black text-gray-400 tabular-nums bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeActivity ? (
              <motion.div 
                key={activeActivity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-6">
                  <div className={cn("p-5 rounded-2xl border shadow-xl", getActivityColor(activeActivity.type))}>
                    {React.createElement(getActivityIcon(activeActivity.type), { className: "w-10 h-10" })}
                  </div>
                  <div>
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{activeActivity.description}</h3>
                    <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">{activeActivity.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm",
                    getActivityColor(activeActivity.type)
                  )}>
                    {activeActivity.type}
                  </span>
                  {activeActivity.type === 'tuition' && (
                    <span className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      Live Session
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
                <h3 className="text-3xl font-black text-gray-500 mb-2">No scheduled activity</h3>
                <p className="text-gray-600 font-medium text-lg">Enjoy your free time or start an unscheduled session.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Next Activity / Quick View */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-b from-[#181818] to-[#121212] rounded-[2rem] p-8 border border-white/5 flex flex-col shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Up Next</h4>
          <button 
            onClick={onViewFullSchedule}
            className="text-[10px] font-bold text-[#1DB954] hover:underline flex items-center gap-1"
          >
            Full Schedule <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1">
          {nextActivity ? (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
              <div className={cn("p-2 rounded-xl border", getActivityColor(nextActivity.type))}>
                {React.createElement(getActivityIcon(nextActivity.type), { className: "w-4 h-4" })}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-400 tabular-nums">{nextActivity.time.split(' – ')[0]}</p>
                <h5 className="font-bold text-sm truncate group-hover:text-[#1DB954] transition-colors">{nextActivity.description}</h5>
                <p className="text-[10px] text-gray-500 uppercase font-bold">{nextActivity.type}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Calendar className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-xs text-gray-500 font-bold">No more activities for today</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase mb-3">
            <span>Today's Progress</span>
            <span>{Math.round((todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(todaySchedule.filter(a => parseTimeStr(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100}%` }}
              className="h-full bg-[#1DB954]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default CurrentScheduleBlock;
