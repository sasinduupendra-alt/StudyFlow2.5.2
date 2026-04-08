import React, { useState, useEffect } from 'react';
import { WeeklySchedule, Activity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Zap, BookOpen, Coffee, Moon, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

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

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const getActiveActivity = () => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    return todaySchedule.find(activity => {
      const [startStr, endStr] = activity.time.split(' – ');
      if (!startStr || !endStr) return false;
      
      const startMinutes = parseTime(startStr);
      const endMinutes = parseTime(endStr);
      
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
  };

  const getNextActivity = () => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return todaySchedule.find(activity => {
      const [startStr] = activity.time.split(' – ');
      return parseTime(startStr) > currentMinutes;
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
        className="lg:col-span-2 bg-[#181818] rounded-3xl p-6 border border-white/5 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock className="w-32 h-32" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Happening Now</span>
            </div>
            <span className="text-xs font-bold text-gray-500 tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeActivity ? (
              <motion.div 
                key={activeActivity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-4 rounded-2xl border", getActivityColor(activeActivity.type))}>
                    {React.createElement(getActivityIcon(activeActivity.type), { className: "w-8 h-8" })}
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">{activeActivity.description}</h3>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">{activeActivity.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    getActivityColor(activeActivity.type)
                  )}>
                    {activeActivity.type}
                  </span>
                  {activeActivity.type === 'tuition' && (
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
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
                className="py-8 text-center lg:text-left"
              >
                <h3 className="text-2xl font-bold text-gray-500">No scheduled activity right now</h3>
                <p className="text-gray-600">Enjoy your free time or start an unscheduled session.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Next Activity / Quick View */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#181818] rounded-3xl p-6 border border-white/5 flex flex-col"
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
            <span>{Math.round((todaySchedule.filter(a => parseTime(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(todaySchedule.filter(a => parseTime(a.time.split(' – ')[0]) < (currentTime.getHours() * 60 + currentTime.getMinutes())).length / todaySchedule.length) * 100}%` }}
              className="h-full bg-[#1DB954]"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default CurrentScheduleBlock;
