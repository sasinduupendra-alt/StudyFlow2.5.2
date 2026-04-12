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
      className="p-6 md:p-12 max-w-5xl mx-auto space-y-16"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-white">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-white uppercase tracking-[0.3em]">System Configuration</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-[0.15em]">System <span className="text-white">Settings</span></h1>
        <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest leading-relaxed max-w-2xl">Manage your account preferences, data telemetry, and system configuration for the optimal StudyFlow experience.</p>
      </div>

      <div className="space-y-12">
        {/* Profile Section */}
        <section className="enterprise-card p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row md:items-center gap-10 mb-16">
            <div className="w-32 h-32 rounded-none bg-transparent border border-white/20 flex items-center justify-center relative group overflow-hidden shadow-2xl">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110 grayscale" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-4xl font-bold text-white">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
              <div className="absolute bottom-3 right-3 w-5 h-5 bg-white rounded-none border-4 border-black shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-widest">{user?.displayName || 'StudyFlow User'}</h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest">{user?.email}</p>
                <div className="w-1 h-1 bg-zinc-800 rounded-none" />
                <span className="text-[10px] font-mono text-white uppercase tracking-widest">Pro Member</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-transparent p-8 rounded-none border border-white/10 hover:border-white/30 transition-colors group">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Total Points</p>
              <p className="text-5xl font-bold text-white tabular-nums tracking-tighter group-hover:text-white transition-colors">{userProfile.points}</p>
            </div>
            <div className="bg-transparent p-8 rounded-none border border-white/10 hover:border-white/30 transition-colors group">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Current Streak</p>
              <p className="text-5xl font-bold text-white tabular-nums tracking-tighter group-hover:text-white transition-colors">{userProfile.streak} <span className="text-lg text-zinc-600 font-bold uppercase tracking-widest ml-1">Days</span></p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="enterprise-card p-12">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-white">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold tracking-widest text-white uppercase">User Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-8 bg-transparent rounded-none border border-white/10 hover:border-white/20 transition-all">
              <div>
                <p className="text-base font-bold text-white uppercase tracking-widest">Browser Notifications</p>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">Session completion alerts and mission updates.</p>
              </div>
              <button 
                onClick={() => Notification.requestPermission()}
                className={cn(
                  "px-8 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all border",
                  Notification.permission === 'granted' ? "border-white/30 text-white bg-white/5" : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {Notification.permission === 'granted' ? 'Active' : 'Initialize'}
              </button>
            </div>
            <div className="flex items-center justify-between p-8 bg-transparent rounded-none border border-white/10 hover:border-white/20 transition-all">
              <div>
                <p className="text-base font-bold text-white uppercase tracking-widest">Email Sync</p>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">Weekly progress telemetry and performance reports.</p>
              </div>
              <div className="w-14 h-7 bg-white/20 border border-white/40 rounded-none relative cursor-pointer p-1">
                <div className="absolute right-1 top-1 bottom-1 aspect-square bg-white rounded-none shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
            <div className="flex items-center justify-between p-8 bg-transparent rounded-none border border-white/10 hover:border-white/20 transition-all">
              <div>
                <p className="text-base font-bold text-white uppercase tracking-widest">Focus Audio</p>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">Neural-sync ambient soundscapes for deep work.</p>
              </div>
              <div className="w-14 h-7 bg-transparent border border-white/20 rounded-none relative cursor-pointer p-1">
                <div className="absolute left-1 top-1 bottom-1 aspect-square bg-zinc-600 rounded-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="enterprise-card p-12">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-white">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold tracking-widest text-white uppercase">Data Management</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-8 bg-transparent rounded-none border border-white/10 hover:border-white/20 transition-all">
              <div>
                <p className="text-base font-bold text-white uppercase tracking-widest">Export Core Data</p>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">Download complete JSON telemetry log for external analysis.</p>
              </div>
              <button 
                onClick={handleDownloadData}
                className="enterprise-button px-8 py-4"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>

            <div className="flex items-center justify-between p-8 bg-transparent rounded-none border border-white/10 hover:border-white/20 transition-all">
              <div>
                <p className="text-base font-bold text-white uppercase tracking-widest">Source Code Pull</p>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">Local deployment package and system source files.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-white uppercase tracking-widest mb-1">AI Studio Override</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest max-w-[200px] leading-relaxed">Use 'Export to ZIP' in AI Studio settings menu for full source access.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="enterprise-card p-12 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-transparent border border-zinc-500 flex items-center justify-center text-zinc-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Danger Zone</h3>
          </div>

          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-8 bg-transparent hover:bg-white/5 border border-white/10 rounded-none transition-all group">
              <div className="text-left">
                <p className="text-base font-bold text-zinc-400 uppercase tracking-widest">Reset All Data</p>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">Permanent deletion of all telemetry logs and mission history.</p>
              </div>
              <div className="w-12 h-12 bg-transparent border border-zinc-500 flex items-center justify-center text-zinc-400 group-hover:rotate-180 transition-transform duration-700">
                <RefreshCw className="w-5 h-5" />
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-8 bg-transparent hover:bg-white/5 border border-white/10 rounded-none transition-all group"
            >
              <div className="text-left">
                <p className="text-base font-bold text-white uppercase tracking-widest">Terminate Session</p>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mt-1">Sign out of current neural link and terminate session.</p>
              </div>
              <div className="w-12 h-12 bg-transparent border border-white/20 flex items-center justify-center text-zinc-500 group-hover:translate-x-2 transition-transform duration-500">
                <LogOut className="w-5 h-5" />
              </div>
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
