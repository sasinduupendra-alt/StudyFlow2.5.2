import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Radio, Brain, Smartphone, Users, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface NoiseCaptureButtonProps {
  onLogNoise: (source: string) => void;
}

export default function NoiseCaptureButton({ onLogNoise }: NoiseCaptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const noiseSources = [
    { label: 'Social Media', icon: Smartphone, color: 'text-blue-400' },
    { label: 'Environment', icon: Radio, color: 'text-amber-400' },
    { label: 'Social / Family', icon: Users, color: 'text-green-400' },
    { label: 'Mental Drift', icon: Brain, color: 'text-purple-400' },
  ];

  const handleLog = (source: string) => {
    onLogNoise(source);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-10 right-10 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] border-2 border-red-500/50 group"
        >
          <AlertTriangle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute inset-0 rounded-full animate-ping bg-red-600/20" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1C1C1E] border border-white/10 rounded-[32px] w-full max-w-sm p-8 relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-[#8E8E93] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <h3 className="text-xl font-bold text-white tracking-tight">Log Noise</h3>
                </div>
                <p className="text-sm text-[#8E8E93]">Quickly identify the distraction source and return to flow.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {noiseSources.map((source) => (
                  <button
                    key={source.label}
                    onClick={() => handleLog(source.label)}
                    className="flex flex-col items-center gap-3 p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-red-500/30 transition-all group"
                  >
                    <source.icon className={cn("w-8 h-8 transition-transform group-hover:scale-110", source.color)} />
                    <span className="text-xs font-bold text-white/70 group-hover:text-white">{source.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-[0.2em]">
                  Acknowledgement is the first step to focus.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
