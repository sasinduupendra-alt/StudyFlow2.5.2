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
        <div className="bg-transparent p-6 border border-white/20 flex flex-col items-center text-center rounded-none">
          <div className="w-12 h-12 bg-transparent border border-white/20 rounded-none flex items-center justify-center mb-3">
            <Star className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-mono text-white">{profile.points}</span>
          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Total Points</span>
        </div>
        <div className="bg-transparent p-6 border border-white/20 flex flex-col items-center text-center rounded-none">
          <div className="w-12 h-12 bg-transparent border border-white/20 rounded-none flex items-center justify-center mb-3">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-mono text-white">{profile.streak}</span>
          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Day Streak</span>
        </div>
        <div className="bg-transparent p-6 border border-white/20 flex flex-col items-center text-center rounded-none">
          <div className="w-12 h-12 bg-transparent border border-white/20 rounded-none flex items-center justify-center mb-3">
            <Award className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-mono text-white">{unlockedBadges.length}</span>
          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Badges Won</span>
        </div>
        <div className="bg-transparent p-6 border border-white/20 flex flex-col items-center text-center rounded-none">
          <div className="w-12 h-12 bg-transparent border border-white/20 rounded-none flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-mono text-white">{Math.round(profile.totalStudyTime / 60)}h</span>
          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Study Hours</span>
        </div>
      </div>

      {/* Unlocked Badges */}
      <section>
        <h2 className="text-2xl font-mono uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
          <Trophy className="w-6 h-6 text-white" />
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
                  className="bg-transparent p-6 border border-white/30 relative overflow-hidden group rounded-none"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                  <div className="w-12 h-12 bg-white border border-white/20 rounded-none flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="font-mono uppercase tracking-widest text-lg mb-1 text-white">{badge.title}</h3>
                  <p className="text-sm text-zinc-400 mb-3 font-mono">{badge.description}</p>
                  <div className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">
                    Unlocked {new Date(badge.unlockedAt!).toLocaleDateString()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-transparent border border-dashed border-white/20 rounded-none p-12 text-center">
            <p className="text-zinc-500 font-mono uppercase tracking-widest">Keep studying to unlock your first badge!</p>
          </div>
        )}
      </section>

      {/* Locked Badges */}
      <section>
        <h2 className="text-2xl font-mono uppercase tracking-widest mb-6 text-zinc-500">Locked Badges</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lockedBadges.map((badge) => {
            const Icon = iconMap[badge.icon] || Award;
            return (
              <div 
                key={badge.id}
                className="bg-transparent p-6 border border-white/10 grayscale opacity-50 rounded-none"
              >
                <div className="w-12 h-12 bg-transparent border border-white/20 rounded-none flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="font-mono uppercase tracking-widest text-lg mb-1 text-zinc-300">{badge.title}</h3>
                <p className="text-sm text-zinc-500 font-mono">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
