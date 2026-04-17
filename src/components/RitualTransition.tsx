import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, ShieldCheck, Timer } from 'lucide-react';

export const RitualTransition: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-8 overflow-hidden"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center space-y-12"
      >
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-brand blur-3xl opacity-30 rounded-full"
          />
          <div className="w-24 h-24 rounded-full border border-brand/30 flex items-center justify-center bg-black/50 backdrop-blur-xl relative z-10">
            <Timer className="w-8 h-8 text-brand" />
          </div>
        </div>

        <div className="space-y-4 text-center">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-light text-white tracking-widest uppercase"
          >
            Entering <span className="text-brand">Zen</span>
          </motion.h2>
          
          <div className="flex items-center justify-center gap-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold"
            >
              <Wind className="w-3 h-3" />
              Environment Calibrating
            </motion.div>
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold"
            >
              <ShieldCheck className="w-3 h-3 text-brand" />
              Shield Deployed
            </motion.div>
          </div>
        </div>

        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 300 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent overflow-hidden"
        >
          <motion.div 
            animate={{ x: [-300, 300] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-full h-full bg-white opacity-30"
          />
        </motion.div>
      </motion.div>

      {/* Background ripples */}
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          className="absolute w-[500px] h-[500px] rounded-full border border-brand/20 pointer-events-none"
        />
      ))}
    </motion.div>
  );
};
