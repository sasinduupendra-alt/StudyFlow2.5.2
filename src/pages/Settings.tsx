import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Settings as SettingsIcon, User, Bell, Shield, Trash2, LogOut, RefreshCw, Download } from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';

export default function Settings() {
  const { user, userProfile, addToast, subjects, studyLogs, exams } = useAppStore();

  const handleDownloadData = () => {
    const data = {
      profile: userProfile,
      subjects,
      studyLogs,
      exams,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Data exported successfully", "success");
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      addToast("Logged out successfully", "info");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 md:p-8 max-w-4xl mx-auto"
    >
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter mb-2 flex items-center gap-4 uppercase">
          <SettingsIcon className="w-8 h-8 text-brand" />
          SYSTEM_SETTINGS
        </h1>
        <p className="hud-label !text-gray-600">CORE_CONFIGURATION_INTERFACE</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="scifi-panel p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-white/5 border border-border-dim flex items-center justify-center relative group">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-2xl font-black text-brand">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand flex items-center justify-center">
                <div className="w-2 h-2 bg-black" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase">{user?.displayName || 'StudyFlow_User'}</h2>
              <p className="hud-label !text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 border border-border-dim">
              <p className="hud-label !text-gray-600 mb-1">TOTAL_POINTS</p>
              <p className="text-2xl font-black text-brand tabular-nums">{userProfile.points}</p>
            </div>
            <div className="bg-white/5 p-4 border border-border-dim">
              <p className="hud-label !text-gray-600 mb-1">STREAK_SYNC</p>
              <p className="text-2xl font-black text-orange-500 tabular-nums">{userProfile.streak}_DAYS</p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="scifi-panel p-8">
          <h3 className="text-sm font-black tracking-tighter mb-6 flex items-center gap-3 uppercase">
            <Bell className="w-4 h-4 text-blue-400" />
            USER_PREFERENCES
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-border-dim">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">BROWSER_NOTIFICATIONS</p>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Session completion alerts.</p>
              </div>
              <button 
                onClick={() => Notification.requestPermission()}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border",
                  Notification.permission === 'granted' ? "border-brand/30 text-brand bg-brand/5" : "bg-white text-black hover:bg-brand hover:border-brand"
                )}
              >
                {Notification.permission === 'granted' ? 'ACTIVE' : 'INITIALIZE'}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-border-dim">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">EMAIL_SYNC</p>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Weekly progress telemetry.</p>
              </div>
              <div className="w-10 h-4 bg-brand/20 border border-brand/40 relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-brand" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-border-dim">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">FOCUS_AUDIO</p>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Neural-sync ambient soundscapes.</p>
              </div>
              <div className="w-10 h-4 bg-white/5 border border-border-dim relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-gray-700" />
              </div>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="scifi-panel p-8">
          <h3 className="text-sm font-black tracking-tighter mb-6 flex items-center gap-3 uppercase">
            <Download className="w-4 h-4 text-brand" />
            DATA_MANAGEMENT
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-border-dim">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">EXPORT_CORE_DATA</p>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Download JSON telemetry log.</p>
              </div>
              <button 
                onClick={handleDownloadData}
                className="scifi-button px-4 py-2 text-[9px]"
              >
                <Download className="w-3 h-3 mr-2" />
                EXPORT_JSON
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-border-dim">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">SOURCE_CODE_PULL</p>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Local deployment package.</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-brand uppercase mb-1">AI_STUDIO_OVERRIDE</p>
                <p className="text-[8px] text-gray-700 font-black uppercase max-w-[150px]">Use 'Export to ZIP' in AI Studio settings menu.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="scifi-panel p-8 border-red-500/20">
          <h3 className="text-sm font-black tracking-tighter mb-6 flex items-center gap-3 text-red-500 uppercase">
            <Shield className="w-4 h-4" />
            DANGER_ZONE
          </h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-colors group">
              <div className="text-left">
                <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">RESET_ALL_DATA</p>
                <p className="text-[9px] text-red-500/60 font-black uppercase tracking-tighter">Permanent deletion of all telemetry logs.</p>
              </div>
              <RefreshCw className="w-4 h-4 text-red-500 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-border-dim transition-colors group"
            >
              <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-widest">TERMINATE_SESSION</p>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Sign out of current neural link.</p>
              </div>
              <LogOut className="w-4 h-4 text-gray-700 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
