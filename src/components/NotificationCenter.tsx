import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, Trash2, Settings, Info, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    notificationPreferences 
  } = useAppStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return <Info className="w-4 h-4 text-blue-400" />;
      case 'ai': return <Sparkles className="w-4 h-4 text-brand" />;
      case 'reminder': return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <AlertCircle className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-5 h-5 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand rounded-full shadow-[0_0_8px_var(--color-brand-glow)]" />
                  )}
                </div>
                <h2 className="text-sm font-mono uppercase tracking-widest text-white">Neural_Notifications</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={markAllAsRead}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={clearNotifications}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">No active transmissions</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 border transition-all relative group",
                      n.read 
                        ? "bg-white/[0.02] border-white/5 opacity-60" 
                        : "bg-white/[0.05] border-white/20 shadow-lg"
                    )}
                  >
                    {!n.read && (
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-brand rounded-full" />
                    )}
                    <div className="flex gap-4">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">{n.title}</h3>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[8px] font-mono text-zinc-600 uppercase">
                            {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                          </span>
                          {!n.read && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="text-[8px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Preferences</h3>
                <Settings className="w-3 h-3 text-zinc-500" />
              </div>
              <div className="space-y-3">
                <PreferenceToggle 
                  label="System Alerts" 
                  active={notificationPreferences.systemAlerts}
                  onToggle={() => useAppStore.getState().updateNotificationPreferences({ systemAlerts: !notificationPreferences.systemAlerts })}
                />
                <PreferenceToggle 
                  label="AI Insights" 
                  active={notificationPreferences.aiRecommendations}
                  onToggle={() => useAppStore.getState().updateNotificationPreferences({ aiRecommendations: !notificationPreferences.aiRecommendations })}
                />
                <PreferenceToggle 
                  label="Review Reminders" 
                  active={notificationPreferences.reviewReminders}
                  onToggle={() => useAppStore.getState().updateNotificationPreferences({ reviewReminders: !notificationPreferences.reviewReminders })}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PreferenceToggle({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono uppercase text-zinc-400">{label}</span>
      <button 
        onClick={onToggle}
        className={cn(
          "w-8 h-4 rounded-full transition-all relative",
          active ? "bg-brand/20 border border-brand/50" : "bg-white/5 border border-white/10"
        )}
      >
        <motion.div 
          animate={{ x: active ? 16 : 2 }}
          className={cn(
            "absolute top-0.5 left-0 w-2.5 h-2.5 rounded-full",
            active ? "bg-brand" : "bg-zinc-600"
          )}
        />
      </button>
    </div>
  );
}
