import React from 'react';
import { motion } from 'motion/react';

interface ProfileSettingsProps {
  onResetProfile: () => void;
  onResetSyllabus: () => void;
  setConfirmModal: (val: any) => void;
}

export default function ProfileSettings({
  onResetProfile,
  onResetSyllabus,
  setConfirmModal
}: ProfileSettingsProps) {
  return (
    <div className="space-y-8">
      <div className="bg-[#181818] p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center text-2xl font-bold text-black">
            S
          </div>
          <div>
            <h3 className="text-2xl font-bold">Sasi Upendra</h3>
            <p className="text-gray-400 text-sm">A/L Student • Combined Maths Stream</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Progress', 
              message: 'Reset points and streak?', 
              onConfirm: onResetProfile 
            })} 
            className="w-full text-left px-4 py-3 bg-red-500/10 text-red-500 rounded-xl text-sm font-bold"
          >
            Reset Gamification Data
          </button>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Syllabus', 
              message: 'Reset all subjects?', 
              onConfirm: onResetSyllabus 
            })} 
            className="w-full text-left px-4 py-3 bg-white/5 text-white rounded-xl text-sm font-bold"
          >
            Reset Syllabus to Default
          </button>
        </div>
      </div>
    </div>
  );
}
