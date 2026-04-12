import React from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, ChevronRight, Zap, Target, Brain } from 'lucide-react';
import { AIRecommendation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Skeleton, CardSkeleton } from './ui/Skeleton';

interface AIInsightsProps {
  recommendations: AIRecommendation[];
  onLike: (id: string) => void;
  onDismiss: (id: string) => void;
  isLoading: boolean;
}

export default function AIInsights({ recommendations, onLike, onDismiss, isLoading }: AIInsightsProps) {
  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-mono text-white uppercase tracking-widest flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-white" />
            AI Insights
          </h2>
          <p className="text-zinc-500 mt-2 font-mono uppercase tracking-widest text-xs">Personalized recommendations based on your study patterns and performance.</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-3 text-white bg-transparent px-4 py-2 rounded-none border border-white/20">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-widest">Analyzing...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {isLoading && recommendations.length === 0 ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <AnimatePresence mode="popLayout">
            {recommendations.filter(r => !r.dismissed).map((rec, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                key={rec.id}
                className={cn(
                  "group relative bg-transparent border border-white/10 p-8 hover:border-white/30 transition-all duration-500 overflow-hidden rounded-none",
                  rec.liked && "border-white/50 bg-white/5"
                )}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  {rec.priority === 'High' ? <Zap className="w-32 h-32 text-white" /> : <Brain className="w-32 h-32 text-white" />}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={cn(
                      "px-3 py-1 rounded-none text-[10px] font-mono uppercase tracking-widest",
                      rec.priority === 'High' ? "bg-transparent text-white border border-white/50" :
                      rec.priority === 'Medium' ? "bg-transparent text-zinc-300 border border-white/30" :
                      "bg-transparent text-zinc-500 border border-white/20"
                    )}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Recommendation</span>
                  </div>

                  <h3 className="text-2xl font-mono text-white mb-4 group-hover:text-zinc-300 transition-colors uppercase tracking-widest">{rec.title}</h3>
                  <p className="text-zinc-400 mb-8 leading-relaxed font-mono text-sm">{rec.description}</p>
                  
                  <div className="bg-transparent rounded-none p-5 mb-8 border border-white/10 italic text-sm text-zinc-300 font-mono">
                    <span className="text-white font-bold not-italic mr-2 uppercase tracking-widest">Why:</span>
                    {rec.reason}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onLike(rec.id)}
                        className={cn(
                          "p-3 rounded-none transition-all border border-transparent",
                          rec.liked ? "bg-white text-black" : "bg-transparent text-zinc-500 hover:text-white hover:border-white/30 border-white/10"
                        )}
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDismiss(rec.id)}
                        className="p-3 bg-transparent border border-white/10 text-zinc-500 hover:text-white hover:border-white/30 rounded-none transition-all"
                      >
                        <ThumbsDown className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <motion.button 
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-white hover:text-zinc-300 group/btn"
                    >
                      Take Action
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-transparent border border-white/10 p-8 rounded-none">
          <h3 className="text-xl font-mono text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
            <Target className="w-5 h-5 text-white" />
            Learning Pattern Analysis
          </h3>
          <div className="space-y-8">
            {[
              { label: 'Morning Retention', value: 85, color: 'bg-white' },
              { label: 'Afternoon Focus', value: 42, color: 'bg-zinc-400' },
              { label: 'Night Recall', value: 68, color: 'bg-zinc-600' },
            ].map((item) => (
              <div key={item.label} className="space-y-3">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  <span>{item.label}</span>
                  <span className="text-white">{item.value}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-none overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn("h-full rounded-none", item.color)} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-transparent border border-white/10 p-8 flex flex-col justify-center text-center rounded-none">
          <div className="w-16 h-16 bg-transparent rounded-none flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-xl font-mono text-white mb-3 uppercase tracking-widest">Pro Tip</h4>
          <p className="text-sm text-zinc-400 leading-relaxed font-mono uppercase tracking-widest">
            Your focus peaks between 5:00 AM and 7:30 AM. Schedule your most difficult Pure Maths topics during this window.
          </p>
        </div>
      </div>
    </div>
  );
}
