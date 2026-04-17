import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFocus } from '../lib/focus-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Shield, Play, History, TrendingUp, Zap } from 'lucide-react';
import { analyzeFocusMomentum } from '../services/gemini';

export const IdleMode: React.FC = () => {
  const { startSession, history, stats } = useFocus();
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState(25);
  const [momentumMsg, setMomentumMsg] = useState("");

  useEffect(() => {
    analyzeFocusMomentum(history).then(setMomentumMsg);
  }, [history]);

  return (
    <div className="max-w-4xl mx-auto p-8 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-brand font-mono text-sm uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            SNR System Active
          </div>
          <h1 className="text-6xl font-light tracking-tight text-white">
            Deep Work <span className="text-brand/50">Engine</span>
          </h1>
          <p className="text-zinc-500 max-w-lg italic">
            "{momentumMsg}"
          </p>
        </header>

        <section className="grid md:grid-cols-3 gap-8">
          <Card className="col-span-2 p-8 bg-zinc-900/50 border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Active Objective</label>
              <Input 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What is the one thing you are doing?"
                className="bg-transparent border-x-0 border-t-0 border-b border-zinc-700 rounded-none text-xl focus-visible:ring-0 focus-visible:border-brand px-0 py-6 h-auto"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-4">
                {[25, 50, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-4 py-2 rounded-full text-sm font-mono transition-all ${
                      duration === d ? 'bg-brand text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
              
              <Button 
                onClick={() => task && startSession(task, duration * 60)}
                disabled={!task}
                className="rounded-full bg-white text-black hover:bg-zinc-200 px-8 py-6 h-auto text-lg group"
              >
                Assemble Flow
                <Play className="w-4 h-4 ml-2 fill-black group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-zinc-900/30 border-white/5 space-y-6 flex flex-col justify-center">
            <div className="space-y-1">
              <div className="text-zinc-500 text-xs uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Flow Shield
              </div>
              <div className="text-2xl font-light text-white">Soft Mode</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-zinc-500 text-xs uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Focus Score
              </div>
              <div className="text-2xl font-light text-white">{Math.round(stats.avgFocusScore)}%</div>
            </div>

            <div className="space-y-1">
              <div className="text-zinc-500 text-xs uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" />
                Continuity
              </div>
              <div className="text-2xl font-light text-white">{stats.sessionCount} Epochs</div>
            </div>
          </Card>
        </section>

        {history.length > 0 && (
          <section className="space-y-4 pt-8">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Previous Recalls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.slice(0, 4).map(s => (
                <div key={s.id} className="p-4 rounded-xl bg-zinc-900/20 border border-white/5 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-zinc-300 font-medium">{s.task}</div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-1">
                      {new Date(s.startTime).toLocaleDateString()} • {Math.round(s.duration / 60)}m • Score: {s.focusScore}%
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand/30" />
                </div>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
};
