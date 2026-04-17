import React from 'react';
import { motion } from 'motion/react';
import { Radio, Zap, Target, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';

export default function SNRPhilosophy() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-[10px] text-brand uppercase tracking-[0.2em] font-bold">
          The Jobs Methodology
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none uppercase">
          Signal vs <span className="text-zinc-600">Noise</span>
        </h2>
        <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
          Inspired by Steve Jobs' ruthless prioritization: Efficiency isn't about doing more. It's about removing the <span className="text-zinc-200 italic">unnecessary</span> until only the most critical signals remain.
        </p>
        
        <div className="space-y-4 pt-4">
          <div className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-brand/20 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-tight">The 3-5 Signal Rule</h4>
              <p className="text-sm text-zinc-500 mt-1">Focus 100% of your current cognitive energy on just 3-5 critical mission goals. Everything else is cognitive noise.</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-zinc-500/20 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-zinc-600" />
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-tight italic">Ruthless Elimination</h4>
              <p className="text-sm text-zinc-500 mt-1">Low-impact tasks, excessive emails, and busy-work are "Noise". They masquerade as progress while diluting your final output quality.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-brand/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative bg-zinc-900 border border-white/10 rounded-[40px] p-8 overflow-hidden h-full flex flex-col justify-between">
           <div className="flex items-center justify-between mb-8">
              <Radio className="w-8 h-8 text-brand animate-pulse" />
              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Current Optimization</span>
                <span className="text-2xl font-black text-white">80/20 Vector</span>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-brand">Signal (High Impact)</span>
                  <span className="text-white">80%</span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '80%' }}
                    viewport={{ once: true }}
                    className="h-full bg-brand rounded-full shadow-[0_0_15px_var(--color-brand-glow)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-zinc-500">Noise (Overhead)</span>
                  <span className="text-zinc-500">20%</span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '20%' }}
                    viewport={{ once: true }}
                    className="h-full bg-zinc-600 rounded-full"
                  />
                </div>
              </div>
           </div>

           <div className="mt-12 p-6 bg-black/40 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-brand" />
                <span className="text-sm font-bold text-white uppercase tracking-tight">System Feedback</span>
              </div>
              <p className="text-xs text-zinc-500 italic">
                "Your current task distribution shows a 4.2 SNR. To enter 'Steve Jobs Output Mode', eliminate 2 low-impact tasks and focus on Mastery Theory for Physics."
              </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
