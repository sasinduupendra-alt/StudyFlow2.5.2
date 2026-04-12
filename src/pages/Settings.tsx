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
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono text-white uppercase tracking-[0.4em]">System Configuration</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none">Neural <span className="text-white">Settings</span></h1>
        <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em] mt-8 flex items-center gap-3">
          <span className="w-2 h-2 bg-white animate-pulse" />
          Core Parameters: Accessible // Root Access
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Profile Section */}
        <section className="enterprise-card p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row md:items-center gap-10 mb-16">
            <div className="w-32 h-32 bg-white flex items-center justify-center relative group overflow-hidden shadow-2xl">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-4xl font-black text-black">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">{user?.displayName || 'StudyFlow User'}</h2>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">{user?.email}</p>
                <span className="badge badge-brand">Pro Member</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/5 border border-white/10 group hover:border-white/30 transition-all">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">Neural Level</p>
              <p className="text-5xl font-black text-white tabular-nums tracking-tighter leading-none">{userProfile?.level || 1}</p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 group hover:border-white/30 transition-all">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">Total XP</p>
              <p className="text-5xl font-black text-white tabular-nums tracking-tighter leading-none">{userProfile?.xp || 0}</p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 group hover:border-white/30 transition-all">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">Study Streak</p>
              <p className="text-5xl font-black text-white tabular-nums tracking-tighter leading-none">{userProfile?.streak || 0}</p>
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
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <div className="w-2 h-8 bg-white" />
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Data Protocols</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="enterprise-card p-10 group hover:border-white/30 transition-all">
              <div className="flex items-center gap-6 mb-8">
                <div className="p-4 bg-white/5 border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-all">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter">Export Archive</h4>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-2">Download your neural history</p>
                </div>
              </div>
              <button onClick={handleDownloadData} className="enterprise-button-secondary w-full py-4">Initialize Export</button>
            </div>

            <div className="enterprise-card p-10 group hover:border-red-500/30 transition-all">
              <div className="flex items-center gap-6 mb-8">
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter">Purge Database</h4>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-2">Irreversible data deletion</p>
                </div>
              </div>
              <button 
                onClick={() => addToast("This action is restricted in the neural preview.", "info")}
                className="w-full py-4 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all"
              >
                Execute Purge
              </button>
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
