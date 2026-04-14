import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { useAppStore } from '../store/useAppStore';
import { Bell, Mail, ShieldAlert, Sparkles, Clock } from 'lucide-react';

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
  const { notificationPreferences, updateNotificationPreferences } = useAppStore();

  return (
    <div className="space-y-8">
      <div className="bg-[#1C1C1E] border border-white/5 p-8 space-y-8 rounded-[32px] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-black border border-white/5 flex items-center justify-center text-3xl font-bold text-white rounded-full shadow-inner">
            S
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Sasi Upendra</h3>
            <p className="text-sm font-medium text-[#8E8E93] mt-1">A/L Student • Combined Maths Stream</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <Bell className="w-5 h-5 text-brand" />
            <h3 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wider">Notification Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <PreferenceItem 
                icon={<ShieldAlert className="w-5 h-5" />}
                label="System Alerts"
                description="Critical system updates and security notifications."
                active={notificationPreferences.systemAlerts}
                onToggle={() => updateNotificationPreferences({ systemAlerts: !notificationPreferences.systemAlerts })}
              />
              <PreferenceItem 
                icon={<Sparkles className="w-5 h-5" />}
                label="AI Insights"
                description="Personalized study recommendations and AI analysis."
                active={notificationPreferences.aiRecommendations}
                onToggle={() => updateNotificationPreferences({ aiRecommendations: !notificationPreferences.aiRecommendations })}
              />
            </div>
            <div className="space-y-4">
              <PreferenceItem 
                icon={<Clock className="w-5 h-5" />}
                label="Review Reminders"
                description="Spaced repetition alerts for upcoming topics."
                active={notificationPreferences.reviewReminders}
                onToggle={() => updateNotificationPreferences({ reviewReminders: !notificationPreferences.reviewReminders })}
              />
              <PreferenceItem 
                icon={<Mail className="w-5 h-5" />}
                label="Email Notifications"
                description="Weekly progress reports sent to your email."
                active={notificationPreferences.emailNotifications}
                onToggle={() => updateNotificationPreferences({ emailNotifications: !notificationPreferences.emailNotifications })}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <h3 className="text-sm font-semibold text-[#8E8E93] uppercase tracking-wider mb-6">System Reset</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Progress', 
              message: 'Reset points and streak?', 
              onConfirm: onResetProfile 
            })} 
            className="w-full text-center px-4 py-3.5 bg-[#FF453A]/10 text-[#FF453A] text-sm font-semibold hover:bg-[#FF453A]/20 transition-colors rounded-[16px]"
          >
            Reset Progress
          </button>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Syllabus', 
              message: 'Reset all subjects?', 
              onConfirm: onResetSyllabus 
            })} 
            className="w-full text-center px-4 py-3.5 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-colors rounded-[16px]"
          >
            Reset Syllabus
          </button>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Reset Schedule', 
              message: 'Reset weekly schedule?', 
              onConfirm: onResetSchedule 
            })} 
            className="w-full text-center px-4 py-3.5 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-colors rounded-[16px]"
          >
            Reset Schedule
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

function PreferenceItem({ icon, label, description, active, onToggle }: { 
  icon: React.ReactNode, 
  label: string, 
  description: string, 
  active: boolean, 
  onToggle: () => void 
}) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white/5 border border-white/5 hover:bg-white/10 transition-all group rounded-[20px]">
      <div className="mt-0.5 text-[#8E8E93] group-hover:text-brand transition-colors">
        {icon}
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">{label}</h4>
          <button 
            onClick={onToggle}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative shadow-inner",
              active ? "bg-brand" : "bg-white/10"
            )}
          >
            <motion.div 
              animate={{ x: active ? 26 : 2 }}
              className={cn(
                "absolute top-1 left-0 w-4 h-4 rounded-full shadow-sm",
                active ? "bg-white" : "bg-[#8E8E93]"
              )}
            />
          </button>
        </div>
        <p className="text-xs font-medium text-[#8E8E93] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
