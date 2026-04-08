import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import AchievementsDashboard from '../components/Achievements';

export default function AchievementsPage() {
  const { userProfile } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <AchievementsDashboard profile={userProfile} />
    </motion.div>
  );
}
