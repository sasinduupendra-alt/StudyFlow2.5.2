import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import WeeklyScheduleView from '../components/WeeklyScheduleView';

export default function Schedule() {
  const navigate = useNavigate();
  const { schedule } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <WeeklyScheduleView 
        schedule={schedule} 
        onManageSchedule={() => navigate('/manage')}
      />
    </motion.div>
  );
}
