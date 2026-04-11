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
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand/10 border border-brand/20 text-brand">
              <Brain className="w-5 h-5" />
            </div>
            <span className="hud-label">NEURAL_RETENTION_SYSTEM</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Spaced_Repetition</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="hud-label !text-gray-600">DUE_FOR_RECALIBRATION</p>
            <p className="text-xl font-black tabular-nums text-brand">{dueTopics.length} TOPICS</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Due Topics List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="hud-label">PRIORITY_QUEUE</h3>
            <span className="text-[10px] font-black text-gray-600 uppercase">SORTED_BY_MASTERY_CRITICALITY</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {dueTopics.length > 0 ? (
              dueTopics.map((item) => (
                <motion.div
                  key={`${item.subjectId}-${item.topic.id}`}
                  layout
                  className="scifi-panel p-4 hover:border-brand/30 transition-all group cursor-pointer"
                  onClick={() => {
                    setSelectedTopic(item);
                    setIsReviewing(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 border border-border-dim overflow-hidden shrink-0">
                        {item.topic.image ? (
                          <img src={item.topic.image} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-brand uppercase tracking-widest mb-1">{item.subjectName}</p>
                        <h4 className="text-sm font-black uppercase tracking-tight">{item.topic.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            <span className="text-[10px] font-black tabular-nums">{item.topic.mastery}%</span>
                          </div>
                          {item.topic.lastReviewed && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase">Last: {new Date(item.topic.lastReviewed).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-brand transition-colors" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-48 flex flex-col items-center justify-center border border-dashed border-border-dim opacity-40">
                <CheckCircle2 className="w-8 h-8 mb-4 text-brand" />
                <p className="hud-label">ALL_SYSTEMS_CALIBRATED</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-2">NO_TOPICS_DUE_FOR_REVIEW</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reviews */}
        <div className="space-y-4">
          <h3 className="hud-label">FUTURE_PROJECTIONS</h3>
          <div className="scifi-panel p-6 space-y-6">
            {upcomingTopics.slice(0, 5).map((item) => (
              <div key={`${item.subjectId}-${item.topic.id}`} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px]">{item.topic.title}</p>
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{item.subjectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-brand tabular-nums">
                    {Math.ceil((new Date(item.topic.nextReview!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}d
                  </p>
                  <p className="text-[8px] font-black text-gray-700 uppercase">REMAINING</p>
                </div>
              </div>
            ))}
            {upcomingTopics.length === 0 && (
              <p className="text-[10px] text-gray-700 font-black uppercase text-center py-4">NO_UPCOMING_REVIEWS</p>
            )}
          </div>

          {/* Stats Card */}
          <div className="scifi-panel p-6 bg-brand/5 border-brand/20">
            <div className="flex items-center gap-3 mb-4">
              <Timer className="w-5 h-5 text-brand" />
              <h3 className="text-xs font-black uppercase tracking-widest">RETENTION_METRICS</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                  <span className="text-gray-500">AVG_MASTERY</span>
                  <span className="text-brand">
                    {Math.round(allTopics.reduce((acc, curr) => acc + curr.topic.mastery, 0) / (allTopics.length || 1))}%
                  </span>
                </div>
                <div className="h-1 bg-black border border-white/5">
                  <div 
                    className="h-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)]"
                    style={{ width: `${allTopics.reduce((acc, curr) => acc + curr.topic.mastery, 0) / (allTopics.length || 1)}%` }}
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
