import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface DailyCommitPromptProps {
  tasks: Task[];
  onCommit: (taskIds: string[]) => void;
  isOpen: boolean;
}

export default function DailyCommitPrompt({ tasks, onCommit, isOpen }: DailyCommitPromptProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const signalTasks = tasks.filter(t => t.impact >= 7);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else if (selectedIds.length < 5) {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedIds.length >= 3) {
      onCommit(selectedIds);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1C1C1E] border border-white/10 rounded-[32px] w-full max-w-lg p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand" />
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Target className="w-32 h-32" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Daily Commit</h2>
              <p className="text-sm text-[#8E8E93]">Select 3–5 non-negotiable Signals for today.</p>
            </div>
          </div>

          <div className="space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
            {signalTasks.length > 0 ? (
              signalTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleSelect(task.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                    selectedIds.includes(task.id) 
                      ? "bg-brand/10 border-brand/40 shadow-[0_0_15px_rgba(var(--color-brand-rgb),0.1)]" 
                      : "bg-white/5 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className={cn("text-base font-bold truncate", selectedIds.includes(task.id) ? "text-white" : "text-white/70")}>
                      {task.title}
                    </h4>
                    <p className="text-xs text-[#8E8E93] mt-0.5 font-mono uppercase tracking-tighter">
                      Signal Index: {(task.impact * 0.8).toFixed(1)}
                    </p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                    selectedIds.includes(task.id) ? "bg-brand border-brand" : "border-white/20"
                  )}>
                    {selectedIds.includes(task.id) && <CheckCircle2 className="w-4 h-4 text-black" />}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                <AlertCircle className="w-10 h-10 text-[#8E8E93] mx-auto mb-4" />
                <p className="text-sm text-[#8E8E93]">No high-signal tasks found. Add some mission-critical goals first.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-6">
            <p className="text-xs font-mono text-[#8E8E93] uppercase tracking-widest">
              Selected: <span className={cn(selectedIds.length >= 3 ? "text-brand" : "text-red-500")}>
                {selectedIds.length}/5
              </span>
            </p>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.length < 3}
              className={cn(
                "px-8 py-3.5 rounded-full text-sm font-black uppercase tracking-widest transition-all",
                selectedIds.length >= 3 
                  ? "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              Commit to Signal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
