import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, Flame, Star, Target, Zap, Clock, Calculator, Beaker, Shield, Sunrise, Timer } from 'lucide-react';
import { UserProfile, Badge } from '../types';
import { cn } from '../lib/utils';

interface AchievementsProps {
  profile: UserProfile;
}

const iconMap: Record<string, any> = {
  Trophy, Award, Flame, Star, Target, Zap, Clock, Calculator, Beaker, Shield, Sunrise, Timer
};

export default function Achievements({ profile }: AchievementsProps) {
  const unlockedBadges = profile.badges.filter(b => b.unlockedAt);
  const lockedBadges = profile.badges.filter(b => !b.unlockedAt);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 space-y-8"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-[#1DB954]/20 rounded-full flex items-center justify-center mb-3">
            <Star className="w-6 h-6 text-[#1DB954]" />
          </div>
          <span className="text-2xl font-bold text-white">{profile.points}</span>
          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Points</span>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <span className="text-2xl font-bold text-white">{profile.streak}</span>
          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Day Streak</span>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
            <Award className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-white">{unlockedBadges.length}</span>
          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Badges Won</span>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-white">{Math.round(profile.totalStudyTime / 60)}h</span>
          <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Study Hours</span>
        </div>
      </div>

      {/* Unlocked Badges */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[#1DB954]" />
          Unlocked Badges
        </h2>
        {unlockedBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {unlockedBadges.map((badge) => {
              const Icon = iconMap[badge.icon] || Award;
              return (
                <motion.div 
                  key={badge.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-[#1DB954]/20 to-white/5 p-6 rounded-2xl border border-[#1DB954]/30 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                  <div className="w-12 h-12 bg-[#1DB954] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{badge.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{badge.description}</p>
                  <div className="text-[10px] font-bold text-[#1DB954] uppercase tracking-wider">
                    Unlocked {new Date(badge.unlockedAt!).toLocaleDateString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-500">Keep studying to unlock your first badge!</p>
          </div>
        )}
      </section>

      {/* Locked Badges */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-400">Locked Badges</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lockedBadges.map((badge) => {
            const Icon = iconMap[badge.icon] || Award;
            return (
              <div 
                key={badge.id}
                className="bg-white/5 p-6 rounded-2xl border border-white/10 grayscale opacity-50"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-bold text-lg mb-1">{badge.title}</h3>
                <p className="text-sm text-gray-400">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
