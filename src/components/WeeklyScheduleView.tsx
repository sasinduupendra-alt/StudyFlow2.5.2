import React from 'react';
import { WeeklySchedule, Activity } from '../types';
import { motion } from 'motion/react';
import { Clock, BookOpen, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface WeeklyScheduleViewProps {
  schedule: WeeklySchedule;
  onManageSchedule: () => void;
}

export default function WeeklyScheduleView({ schedule, onManageSchedule }: WeeklyScheduleViewProps) {
  const days: (keyof WeeklySchedule)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-4 md:p-8 space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight">Weekly Schedule</h2>
          <p className="text-gray-400">Your optimized study routine for the week.</p>
        </div>
        <button 
          onClick={onManageSchedule}
          className="px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-all shadow-xl flex items-center gap-2"
        >
          <Zap className="w-4 h-4 fill-current" />
          Manage Schedule
        </button>
      </div>

      {/* Tuition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => {
          const tuitionSessions = schedule[day].filter(a => a.type === 'tuition');
          if (tuitionSessions.length === 0) return null;
          return (
            <div key={`summary-${day}`} className="bg-[#181818] p-4 rounded-2xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm">{day} Tuition</h3>
              </div>
              <div className="space-y-2">
                {tuitionSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">{s.description}</span>
                    <span className="text-blue-500 font-bold tabular-nums">{s.time.split(' – ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex lg:grid lg:grid-cols-7 overflow-x-auto pb-8 scrollbar-hide gap-6 snap-x snap-mandatory">
        {days.map((day, dayIndex) => (
          <motion.div 
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.05 }}
            className="min-w-[280px] lg:min-w-0 flex flex-col gap-4 snap-start"
          >
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md py-4 border-b border-white/10 mb-2">
              <h3 className="text-xl font-bold text-[#1DB954]">{day}</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {schedule[day].filter(a => a.type === 'study').length} Study Blocks
              </p>
            </div>

            <div className="space-y-3">
              {schedule[day].map((activity, i) => (
                <div 
                  key={activity.id}
                  className={cn(
                    "p-3 rounded-xl border border-white/5 transition-all group hover:bg-white/5",
                    activity.type === 'study' ? "bg-white/5 border-[#1DB954]/20" : "opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-500 tabular-nums">{activity.time.split(' – ')[0]}</span>
                    {activity.type === 'study' && <BookOpen className="w-3 h-3 text-[#1DB954]" />}
                    {activity.type === 'tuition' && <Zap className="w-3 h-3 text-blue-500" />}
                    {activity.type === 'break' && <Clock className="w-3 h-3 text-yellow-500" />}
                  </div>
                  <h4 className="text-sm font-bold truncate group-hover:text-white transition-colors">{activity.description}</h4>
                  <p className="text-[10px] text-gray-500 capitalize">{activity.type}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
