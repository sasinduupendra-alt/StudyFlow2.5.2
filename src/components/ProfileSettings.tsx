import React from 'react';
import { motion } from 'motion/react';

interface ProfileSettingsProps {
  onResetProfile: () => void;
  onResetSyllabus: () => void;
  onResetSchedule: () => void;
  setConfirmModal: (val: any) => void;
}

export default function ProfileSettings({
  onResetProfile,
  onResetSyllabus,
  onResetSchedule,
  setConfirmModal
}: ProfileSettingsProps) {
  return (
    <div className="space-y-8">
      <div className="bg-transparent border border-white/10 p-8 space-y-6 rounded-none">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 border border-white/20 flex items-center justify-center text-2xl font-mono text-white bg-transparent rounded-none">
            S
          </div>
          <div>
            <h3 className="text-sm font-mono uppercase tracking-widest text-white">Sasi Upendra</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">A/L_STUDENT_NODE • COMBINED_MATHS_STREAM</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Progress', 
              message: 'Reset points and streak?', 
              onConfirm: onResetProfile 
            })} 
            className="w-full text-left px-4 py-3 border border-red-500/30 bg-transparent text-red-500 text-[10px] font-mono uppercase tracking-widest hover:bg-red-500/10 transition-colors rounded-none"
          >
            RESET_GAMIFICATION_DATA
          </button>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Syllabus', 
              message: 'Reset all subjects?', 
              onConfirm: onResetSyllabus 
            })} 
            className="w-full text-left px-4 py-3 border border-white/20 bg-transparent text-white text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-colors rounded-none"
          >
            RESET_SYLLABUS_DEFAULT
          </button>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Schedule', 
              message: 'Reset weekly schedule?', 
              onConfirm: onResetSchedule 
            })} 
            className="w-full text-left px-4 py-3 border border-white/20 bg-transparent text-white text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-colors rounded-none"
          >
            RESET_SCHEDULE_DEFAULT
          </button>
        </div>
      </div>
    </div>
  );
}
