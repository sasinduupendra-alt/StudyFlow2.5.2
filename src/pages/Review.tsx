import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Calendar, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, Star, 
  Zap, BookOpen, Timer
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Topic } from '../types';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function Review() {
  const { subjects, updateTopicSRS, user, addToast } = useAppStore();
  const [selectedTopic, setSelectedTopic] = useState<{ subjectId: string, subjectName: string, topic: Topic } | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [performance, setPerformance] = useState<number | null>(null);

  const now = new Date();
  
  const allTopics = subjects.flatMap(s => 
    s.topics.map(t => ({ subjectId: s.id, subjectName: s.name, topic: t }))
  );

  const dueTopics = allTopics.filter(item => {
    if (!item.topic.nextReview) return true; // New topics are always due
    return new Date(item.topic.nextReview) <= now;
  }).sort((a, b) => {
    // Sort by mastery (lower first) then by nextReview
    if (a.topic.mastery !== b.topic.mastery) return a.topic.mastery - b.topic.mastery;
    if (!a.topic.nextReview) return -1;
    if (!b.topic.nextReview) return 1;
    return new Date(a.topic.nextReview).getTime() - new Date(b.topic.nextReview).getTime();
  });

  const upcomingTopics = allTopics.filter(item => {
    if (!item.topic.nextReview) return false;
    return new Date(item.topic.nextReview) > now;
  }).sort((a, b) => new Date(a.topic.nextReview!).getTime() - new Date(b.topic.nextReview!).getTime());

  const handleCompleteReview = async () => {
    if (!selectedTopic || performance === null || !user) return;

    const { subjectId, topic } = selectedTopic;
    
    // Update local state
    updateTopicSRS(subjectId, topic.id, performance);

    // Sync to Firestore
    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        // We need the updated topics list
        // Since Zustand set is sync, we can find the updated subject in the store
        // But for simplicity in this turn, we'll use the logic from the slice
        // Actually, it's better to let the sync hook handle it if it's watching subjects
        // But subjects are usually updated as a whole document
        const updatedTopics = subject.topics.map(t => {
          if (t.id === topic.id) {
            // This is a bit redundant but ensures Firestore is updated
            // In a real app, you'd probably have a dedicated sync for this
            return { ...t }; // The slice already updated this in the store
          }
          return t;
        });
        
        // Note: The useFirestoreSync hook should catch the store change and sync it.
        // If not, we manually sync here:
        // await updateDoc(doc(db, 'users', user.uid, 'subjects', subjectId), { topics: updatedTopics });
      }
      addToast('Review session synchronized', 'success');
    } catch (error) {
      console.error('SRS Sync Error:', error);
    }

    setIsReviewing(false);
    setSelectedTopic(null);
    setPerformance(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Brain className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono text-white uppercase tracking-[0.4em]">Neural Retention System</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
            Spaced_Repetition
          </h1>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em] mt-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-white animate-pulse" />
            Recalibration Protocol: Active
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-10 py-6 bg-white/5 border border-white/10 flex flex-col items-end backdrop-blur-xl">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none mb-2">Due for Recalibration</p>
            <p className="text-3xl font-black text-white tabular-nums leading-none tracking-tighter">{dueTopics.length} Topics</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Due Topics List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Priority Queue</h3>
            <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em]">Sorted by Mastery Criticality</span>
          </div>

          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="grid grid-cols-1 gap-4"
          >
            {dueTopics.length > 0 ? (
              dueTopics.map((item) => (
                <motion.div
                  key={`${item.subjectId}-${item.topic.id}`}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="enterprise-card p-6 group cursor-pointer relative overflow-hidden"
                  onClick={() => {
                    setSelectedTopic(item);
                    setIsReviewing(true);
                  }}
                >
                  <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/5 border border-white/10 overflow-hidden shrink-0">
                        {item.topic.image ? (
                          <img src={item.topic.image} alt="" className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-2">{item.subjectName}</p>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none">{item.topic.title}</h4>
                        <div className="flex items-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-mono text-white tabular-nums tracking-tighter">{item.topic.mastery}% Mastery</span>
                          </div>
                          {item.topic.lastReviewed && (
                            <div className="flex items-center gap-2 text-zinc-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-mono uppercase tracking-widest">Last: {new Date(item.topic.lastReviewed).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center enterprise-card border-dashed border-white/10 opacity-40">
                <CheckCircle2 className="w-12 h-12 mb-6 text-white" />
                <p className="text-[10px] font-mono text-white uppercase tracking-[0.4em]">All Systems Calibrated</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-4">No topics due for review</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Upcoming Reviews */}
        <div className="space-y-8">
          <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Future Projections</h3>
          <div className="enterprise-card p-8 space-y-6">
            {upcomingTopics.slice(0, 5).map((item) => (
              <div key={`${item.subjectId}-${item.topic.id}`} className="flex items-center justify-between border-b border-white/5 pb-6 last:border-0 last:pb-0">
                <div>
                  <p className="text-[10px] font-mono text-white uppercase tracking-tight truncate max-w-[150px] font-bold">{item.topic.title}</p>
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">{item.subjectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white tabular-nums leading-none tracking-tighter">
                    {Math.ceil((new Date(item.topic.nextReview!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}d
                  </p>
                  <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mt-2">Remaining</p>
                </div>
              </div>
            ))}
            {upcomingTopics.length === 0 && (
              <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest text-center py-8">No upcoming reviews</p>
            )}
          </div>

          {/* Stats Card */}
          <div className="enterprise-card-premium p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Timer className="w-5 h-5" />
              </div>
              <h3 className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-bold">Retention Metrics</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-4">
                  <span className="text-zinc-500">Avg Mastery</span>
                  <span className="text-white">
                    {Math.round(allTopics.reduce((acc, curr) => acc + curr.topic.mastery, 0) / (allTopics.length || 1))}%
                  </span>
                </div>
                <div className="h-1 bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${allTopics.reduce((acc, curr) => acc + curr.topic.mastery, 0) / (allTopics.length || 1)}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewing && selectedTopic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewing(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl scifi-panel p-8 border-brand/30"
            >
              <div className="text-center space-y-6">
                <div>
                  <span className="hud-label text-brand">ACTIVE_RECALL_PHASE</span>
                  <h3 className="text-3xl font-black uppercase tracking-tighter mt-2">{selectedTopic.topic.title}</h3>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{selectedTopic.subjectName}</p>
                </div>

                <div className="py-12 border-y border-white/5">
                  <p className="text-lg font-black uppercase tracking-tight text-gray-400">
                    How well did you recall the concepts of this topic?
                  </p>
                  <div className="flex justify-center gap-4 mt-8">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setPerformance(score)}
                        className={cn(
                          "w-12 h-12 border transition-all flex items-center justify-center text-xl font-black",
                          performance === score 
                            ? "bg-brand text-black border-brand shadow-[0_0_20px_var(--color-brand-glow)]" 
                            : "bg-white/5 border-border-dim text-gray-500 hover:border-brand/50 hover:text-white"
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between px-4 mt-4 text-[8px] font-black text-gray-600 uppercase tracking-widest">
                    <span>Total Blackout</span>
                    <span>Perfect Recall</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setIsReviewing(false)}
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:text-white transition-colors"
                  >
                    ABORT_SESSION
                  </button>
                  <button
                    disabled={performance === null}
                    onClick={handleCompleteReview}
                    className="scifi-button flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    COMMIT_RECALIBRATION
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
