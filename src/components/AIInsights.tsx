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
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-brand" />
            AI Insights
          </h2>
          <p className="text-[#8E8E93] mt-2 text-sm font-medium">Personalized recommendations based on your study patterns and performance.</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-3 text-white bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">Analyzing...</span>
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
                  "group relative bg-[#1C1C1E] border border-white/5 p-8 hover:bg-[#2C2C2E] transition-all duration-500 overflow-hidden rounded-[32px]",
                  rec.liked && "border-brand/30 bg-brand/5"
                )}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  {rec.priority === 'High' ? <Zap className="w-32 h-32 text-brand" /> : <Brain className="w-32 h-32 text-brand" />}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold",
                      rec.priority === 'High' ? "bg-brand/10 text-brand border border-brand/20" :
                      rec.priority === 'Medium' ? "bg-white/10 text-white border border-white/10" :
                      "bg-white/5 text-[#8E8E93] border border-white/5"
                    )}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Recommendation</span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-brand transition-colors tracking-tight">{rec.title}</h3>
                  <p className="text-[#8E8E93] mb-8 leading-relaxed text-sm font-medium">{rec.description}</p>
                  
                  <div className="bg-white/5 rounded-[20px] p-5 mb-8 border border-white/5 text-sm text-[#8E8E93] font-medium">
                    <span className="text-white font-bold mr-2">Why:</span>
                    {rec.reason}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onLike(rec.id)}
                        className={cn(
                          "p-3 rounded-full transition-all",
                          rec.liked ? "bg-brand text-white" : "bg-white/5 text-[#8E8E93] hover:text-white hover:bg-white/10"
                        )}
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDismiss(rec.id)}
                        className="p-3 bg-white/5 text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-full transition-all"
                      >
                        <ThumbsDown className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <motion.button 
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-2 text-sm font-semibold text-brand hover:opacity-80 group/btn"
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
        <div className="lg:col-span-2 bg-[#1C1C1E] border border-white/5 p-8 rounded-[32px]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 tracking-tight">
            <Target className="w-6 h-6 text-brand" />
            Learning Pattern Analysis
          </h3>
          <div className="space-y-8">
            {[
              { label: 'Morning Retention', value: 85, color: 'bg-[#32D74B]' },
              { label: 'Afternoon Focus', value: 42, color: 'bg-[#FF9F0A]' },
              { label: 'Night Recall', value: 68, color: 'bg-brand' },
            ].map((item) => (
              <div key={item.label} className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  <span>{item.label}</span>
                  <span className="text-white tabular-nums">{item.value}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn("h-full rounded-full", item.color)} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1C1C1E] border border-white/5 p-8 flex flex-col justify-center text-center rounded-[32px]">
          <div className="w-16 h-16 bg-brand/10 rounded-[20px] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-brand" />
          </div>
          <h4 className="text-xl font-bold text-white mb-3 tracking-tight">Pro Tip: The Syllabus Audit</h4>
          <p className="text-sm text-[#8E8E93] leading-relaxed font-medium">
            Don't just follow tuition notes. Print the official NIE syllabus. Place a single checkmark when theory is covered, and a double checkmark only after 5+ years of past papers. If it's not in the syllabus, it's noise.
          </p>
        </div>
      </div>
    </div>
  );
}
