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
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-[#1DB954]" />
            AI Insights
          </h2>
          <p className="text-sm md:text-base text-gray-400">Personalized recommendations based on your study patterns and performance.</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-[#1DB954]">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Analyzing...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  "group relative bg-[#181818] rounded-3xl p-6 md:p-8 border border-white/5 hover:border-[#1DB954]/30 transition-all duration-500 overflow-hidden",
                  rec.liked && "border-[#1DB954]/50 bg-[#1DB954]/5"
                )}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  {rec.priority === 'High' ? <Zap className="w-32 h-32" /> : <Brain className="w-32 h-32" />}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      rec.priority === 'High' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                      rec.priority === 'Medium' ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                      "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    )}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recommendation</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 group-hover:text-[#1DB954] transition-colors">{rec.title}</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">{rec.description}</p>
                  
                  <div className="bg-black/20 rounded-2xl p-4 mb-8 border border-white/5 italic text-sm text-gray-300">
                    <span className="text-[#1DB954] font-bold not-italic mr-2">Why:</span>
                    {rec.reason}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onLike(rec.id)}
                        className={cn(
                          "p-3 rounded-full transition-all",
                          rec.liked ? "bg-[#1DB954] text-black" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDismiss(rec.id)}
                        className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                      >
                        <ThumbsDown className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <motion.button 
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-2 text-sm font-bold text-[#1DB954] hover:underline group/btn"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#181818] rounded-3xl p-8 border border-white/5">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#1DB954]" />
            Learning Pattern Analysis
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Morning Retention', value: 85, color: 'bg-[#1DB954]' },
              { label: 'Afternoon Focus', value: 42, color: 'bg-yellow-500' },
              { label: 'Night Recall', value: 68, color: 'bg-blue-500' },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn("h-full", item.color)} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-8 border border-white/5 flex flex-col justify-center text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h4 className="text-xl font-bold mb-2">Pro Tip</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your focus peaks between 5:00 AM and 7:30 AM. Schedule your most difficult Pure Maths topics during this window.
          </p>
        </div>
      </div>
    </div>
  );
}
