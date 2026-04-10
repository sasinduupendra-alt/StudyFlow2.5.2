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
      <div className="scifi-panel p-8 space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 border border-brand flex items-center justify-center text-2xl font-black text-brand bg-brand/5">
            S
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tighter">Sasi Upendra</h3>
            <p className="hud-label !text-brand mt-1">A/L_STUDENT_NODE • COMBINED_MATHS_STREAM</p>
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
            className="w-full text-left px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors"
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
            className="w-full text-left px-4 py-3 border border-border-dim bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
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
            className="w-full text-left px-4 py-3 border border-border-dim bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            RESET_SCHEDULE_DEFAULT
          </button>
        </div>
      </div>
    </div>
  );
}
