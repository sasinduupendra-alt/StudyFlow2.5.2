import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Settings as SettingsIcon, User, Bell, Shield, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';

export default function Settings() {
  const { user, userProfile, addToast } = useAppStore();

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
        <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-[#1DB954]" />
          Settings
        </h1>
        <p className="text-gray-400 font-medium">Manage your account, preferences, and data.</p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-[#181818] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-white/5">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{user?.displayName || 'StudyFlow User'}</h2>
              <p className="text-gray-500 font-bold">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Points</p>
              <p className="text-2xl font-black text-[#1DB954]">{userProfile.points}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Current Streak</p>
              <p className="text-2xl font-black text-orange-500">{userProfile.streak} Days</p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-[#181818] rounded-3xl p-8 border border-white/5">
          <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-400" />
            Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="font-bold">Browser Notifications</p>
                <p className="text-xs text-gray-500">Get notified when study sessions end.</p>
              </div>
              <button 
                onClick={() => Notification.requestPermission()}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                  Notification.permission === 'granted' ? "bg-[#1DB954]/20 text-[#1DB954]" : "bg-white text-black hover:scale-105"
                )}
              >
                {Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="font-bold">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive weekly progress reports.</p>
              </div>
              <div className="w-12 h-6 bg-[#1DB954] rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <p className="font-bold">Focus Mode Music</p>
                <p className="text-xs text-gray-500">Auto-play ambient sounds during sessions.</p>
              </div>
              <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-[#181818] rounded-3xl p-8 border border-red-500/10">
          <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3 text-red-500">
            <Shield className="w-5 h-5" />
            Danger Zone
          </h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 transition-colors group">
              <div className="text-left">
                <p className="font-bold text-red-500">Reset All Data</p>
                <p className="text-xs text-red-500/60">This will clear all study logs and subjects.</p>
              </div>
              <RefreshCw className="w-5 h-5 text-red-500 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors group"
            >
              <div className="text-left">
                <p className="font-bold">Sign Out</p>
                <p className="text-xs text-gray-500">Log out of your current session.</p>
              </div>
              <LogOut className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
