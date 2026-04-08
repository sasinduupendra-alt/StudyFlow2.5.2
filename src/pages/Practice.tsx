import React from 'react';
import { motion } from 'motion/react';
import AIPracticeMode from '../components/AIPracticeMode';

export default function Practice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8 max-w-5xl mx-auto"
    >
      <AIPracticeMode />
    </motion.div>
  );
}
