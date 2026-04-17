import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock, Target, Flame, Coffee, Play, Sparkles, TrendingUp, BookOpen, Brain, ChevronRight, Trophy, LogIn, List, CheckCircle2, Layers, Radio } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn, calculateUserSNR } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import CurrentScheduleBlock from '../components/CurrentScheduleBlock';
import Planner from '../components/Planner';
import AIStudyPlanner from '../components/AIStudyPlanner';
import TopicCard from '../components/TopicCard';
import SubjectCard from '../components/SubjectCard';
import VisualStudyAid from '../components/VisualStudyAid';
import SNRVisualizer from '../components/SNRVisualizer';
import DailyCommitPrompt from '../components/DailyCommitPrompt';
import NoiseCaptureButton from '../components/NoiseCaptureButton';
import NeuralSoundscape from '../components/NeuralSoundscape';
import SNRPhilosophy from '../components/SNRPhilosophy';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function Home() {
  const navigate = useNavigate();
  const subjects = useAppStore(state => state.subjects);
  const schedule = useAppStore(state => state.schedule);
  const recentlyStudied = useAppStore(state => state.recentlyStudied);
  const searchQuery = useAppStore(state => state.searchQuery);
  const setIsFocusMode = useAppStore(state => state.setIsFocusMode);
  const setIsPaused = useAppStore(state => state.setIsPaused);
  const setActiveSession = useAppStore(state => state.setActiveSession);
  const addToast = useAppStore(state => state.addToast);
  const isAuthReady = useAppStore(state => state.isAuthReady);
  const user = useAppStore(state => state.user);
  const userProfile = useAppStore(state => state.userProfile);
  const studyLogs = useAppStore(state => state.studyLogs);
  const startFocusSession = useAppStore(state => state.startFocusSession);
  const tasks = useAppStore(state => state.tasks);
  const toggleTask = useAppStore(state => state.toggleTask);
  const dailyCommits = useAppStore(state => state.dailyCommits);
  const isDailyCommitDone = useAppStore(state => state.isDailyCommitDone);
  const setDailyCommits = useAppStore(state => state.setDailyCommits);
  const setDailyCommitDone = useAppStore(state => state.setDailyCommitDone);
  const addNoiseLog = useAppStore(state => state.addNoiseLog);

  const snrData = useMemo(() => calculateUserSNR(tasks), [tasks]);

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    toggleTask(id);

    if (user) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        await setDoc(doc(db, 'users', user.uid, 'tasks', id), { completed: newCompleted }, { merge: true });
      } catch (error) {
        const { handleFirestoreError, OperationType } = await import('../firebase');
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/tasks/${id}`);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const executionTasks = useMemo(() => {
    return tasks.filter(t => 
      !t.completed && 
      (dailyCommits.includes(t.id) || (t.frequency === 'Daily' && (!t.dueDate || t.dueDate <= todayStr)))
    );
  }, [tasks, todayStr, dailyCommits]);

  const signalTasks = useMemo(() => tasks.filter(t => t.impact >= 7), [tasks]);
  
  const dailyCommitTasks = useMemo(() => {
    return tasks.filter(t => dailyCommits.includes(t.id));
  }, [tasks, dailyCommits]);

  const signalCompletionRate = useMemo(() => {
    if (dailyCommitTasks.length === 0) return 0;
    const completedCount = dailyCommitTasks.filter(t => t.completed).length;
    return (completedCount / dailyCommitTasks.length) * 100;
  }, [dailyCommitTasks]);

  const morningTaskCount = dailyCommitTasks.length;
  const morningCompletedCount = dailyCommitTasks.filter(t => t.completed).length;

  const handleCommit = (selectedIds: string[]) => {
    setDailyCommits(selectedIds);
    setDailyCommitDone(true, todayStr);
    addToast('Strategic Signals committed for today!', 'success');
  };

  const handleLogNoise = (source: string) => {
    addNoiseLog(source);
    addToast(`Noise logged: ${source}. Focus resumed.`, 'info');
  };

  const displaySignalTasks = dailyCommits.length > 0 
    ? dailyCommitTasks.filter(t => !t.completed) 
    : executionTasks.filter(t => t.impact >= 7);

  const noiseTasks = useMemo(() => executionTasks.filter(t => t.impact < 7), [executionTasks]);

  const processedSubjects = useMemo(() => {
    return subjects.map(s => {
      const topics = s.topics || [];
      const avgMastery = topics.length > 0 
        ? topics.reduce((acc, t) => acc + t.mastery, 0) / topics.length
        : 0;
      
      // Advanced Logic: "Imminent Use" & Predictive Performance
      // If score is < 50, it becomes a Priority Signal automatically
      const isWeakSubject = s.score < 50;
      const readiness = (s.score * 0.4) + (avgMastery * 0.6);
      
      // Calculate Priority Score: Weak subjects get a massive boost to become "Strategic Signals"
      const priorityScore = (100 - readiness) * (s.focus / 5) * (s.weakCount + 1) * (isWeakSubject ? 2 : 1);
      
      return { ...s, readiness, priorityScore, isWeakSubject };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    const query = (searchQuery || '').toLowerCase();
    if (!query) return processedSubjects;
    return processedSubjects.filter(s => 
      (s.name || '').toLowerCase().includes(query) ||
      s.topics?.some(t => (t.title || '').toLowerCase().includes(query))
    );
  }, [processedSubjects, searchQuery]);

  const dueTopicsCount = useMemo(() => {
    const now = new Date();
    return subjects.flatMap(s => s.topics || []).filter(t => {
      if (!t.nextReview) return true;
      return new Date(t.nextReview) <= now;
    }).length;
  }, [subjects]);

  if (!isAuthReady) {
    return (
      <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (subjects.length === 0 && !searchQuery) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8 space-y-6">
        <div className="w-24 h-24 bg-[#1C1C1E] border border-white/5 flex items-center justify-center mb-6 rounded-full">
          <BookOpen className="w-10 h-10 text-[#8E8E93]" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">No Subjects Detected</h2>
        <p className="text-[#8E8E93] max-w-md mx-auto text-base leading-relaxed">Your study flow is currently empty. Initialize your syllabus to begin tracking your progress and generating AI insights.</p>
        <button 
          onClick={() => navigate('/manage')}
          className="enterprise-button px-10 py-4"
        >
          Initialize Syllabus
        </button>
      </div>
    );
  }

  const prioritySubject = processedSubjects[0] || null;
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as any;
  const dailyPlan = schedule[currentDay] || [];

  const [isScheduleCollapsed, setIsScheduleCollapsed] = React.useState(false);
  const [isPlannerCollapsed, setIsPlannerCollapsed] = React.useState(false);
  const [isAIPlannerCollapsed, setIsAIPlannerCollapsed] = React.useState(false);
  const [isRecentlyStudiedCollapsed, setIsRecentlyStudiedCollapsed] = React.useState(false);
  const [isSubjectsCollapsed, setIsSubjectsCollapsed] = React.useState(false);
  const [isMethodologyCollapsed, setIsMethodologyCollapsed] = React.useState(true); // Default collapsed for minimalism
  const [isAnalyticsCollapsed, setIsAnalyticsCollapsed] = React.useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 md:p-10 space-y-12 max-w-7xl mx-auto relative min-h-screen"
    >
      <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />

      <DailyCommitPrompt 
        tasks={tasks} 
        isOpen={!isDailyCommitDone && tasks.filter(t => t.impact >= 7).length > 0} 
        onCommit={handleCommit} 
      />

      <NoiseCaptureButton onLogNoise={handleLogNoise} />

      {/* Welcome Header */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-white/5 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[9px] font-mono text-brand uppercase tracking-[0.4em]">Neural Core Active</span>
            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand-glow)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
            Vector <span className="text-zinc-500">Flow</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-4">
            {user ? `${user.displayName?.split(' ')[0]} // Authorization Verified` : 'Vanguard Protocol Standby'}
          </p>
        </div>

        {!user ? (
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-zinc-400 hover:text-white font-mono text-[10px] uppercase tracking-[0.3em] transition-all group"
          >
            <LogIn className="w-3.5 h-3.5 text-brand group-hover:scale-110 transition-transform" />
            Initialize
          </motion.button>
        ) : (
          <div className="flex items-center gap-10 bg-white/5 backdrop-blur-xl px-10 py-6 rounded-[32px] border border-white/5 relative overflow-hidden group shadow-2xl">
            <div className="relative text-center">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em] mb-1">SNR Index</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-4xl font-black text-white tracking-tighter">
                  {snrData.snr.toFixed(2)}
                </p>
                <div className="flex flex-col items-start translate-y-1">
                  <TrendingUp className="w-4 h-4 text-brand" />
                  <span className="text-[8px] font-black text-brand uppercase tracking-tighter">Peak</span>
                </div>
              </div>
            </div>
            
            <div className="w-[1px] h-12 bg-white/5" />
            
            <div className="relative text-center">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em] mb-1">Signal Rate</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-4xl font-black text-white tracking-tighter">
                  {Math.round(signalCompletionRate)}<span className="text-xl text-zinc-600">%</span>
                </p>
                <Sparkles className="w-4 h-4 text-brand/50 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </motion.header>

      {/* Bento Grid Stats */}
      <motion.div variants={itemVariants} className="w-full space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Temporal Flow</h2>
          </div>
          <button 
            onClick={() => setIsScheduleCollapsed(!isScheduleCollapsed)}
            className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
          >
            {isScheduleCollapsed ? '[ Expand ]' : '[ Collapse ]'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isScheduleCollapsed && (
            <motion.div
              key="schedule"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
              className="overflow-hidden"
            >
              <CurrentScheduleBlock 
                schedule={schedule} 
                onViewFullSchedule={() => navigate('/schedule')} 
                reviewCount={dueTopicsCount}
                onReviewClick={() => navigate('/review')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Daily Protocol</h2>
              </div>
              <button 
                onClick={() => setIsPlannerCollapsed(!isPlannerCollapsed)}
                className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
              >
                {isPlannerCollapsed ? '[ Expand ]' : '[ Collapse ]'}
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {!isPlannerCollapsed && (
                <motion.div
                  key="planner"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'circOut' }}
                  className="overflow-hidden"
                >
                  <Planner 
                    prioritySubject={prioritySubject} 
                    dailyPlan={dailyPlan} 
                    onStartFocus={(subId, topId) => startFocusSession(subId, topId || subjects.find(s => s.id === subId)?.topics[0]?.id || '')}
                    onViewFullSchedule={() => navigate('/schedule')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">AI Synthesis</h2>
              </div>
              <button 
                onClick={() => setIsAIPlannerCollapsed(!isAIPlannerCollapsed)}
                className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
              >
                {isAIPlannerCollapsed ? '[ Expand ]' : '[ Collapse ]'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isAIPlannerCollapsed && (
                <motion.div
                  key="ai-planner"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'circOut' }}
                  className="overflow-hidden"
                >
                  <AIStudyPlanner />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {recentlyStudied.length > 0 && !searchQuery && (
            <motion.section variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-brand/30" />
                  <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Continue</h2>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors">View All</button>
                  <button 
                    onClick={() => setIsRecentlyStudiedCollapsed(!isRecentlyStudiedCollapsed)}
                    className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
                  >
                    {isRecentlyStudiedCollapsed ? '[ Expand ]' : '[ Collapse ]'}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!isRecentlyStudiedCollapsed && (
                  <motion.div
                    key="recently-studied"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'circOut' }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {recentlyStudied.map(topicId => {
                        const subject = subjects.find(s => s.topics?.some(t => t.id === topicId));
                        const topic = subject?.topics?.find(t => t.id === topicId);
                        if (!topic || !subject) return null;
                        return (
                          <div key={topicId} className="min-w-[260px]">
                            <TopicCard 
                              topic={topic} 
                              subjectName={subject.name} 
                              onStartFocus={() => startFocusSession(subject.id, topic.id)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </div>

        <div className="space-y-10">
          {/* Mini Execution Tab */}
          {!searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-brand/30" />
                  <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Execution</h2>
                </div>
                <button onClick={() => navigate('/tasks')} className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors">Details</button>
              </div>
              <div className="space-y-3">
                {/* SNR Index Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-zinc-500" />
                      <h3 className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Efficiency</h3>
                    </div>
                    <span className="text-lg font-black text-white">{snrData.snr.toFixed(2)}</span>
                  </div>
                  
                  <div className="mb-4">
                    <SNRVisualizer 
                      signal={snrData.signal} 
                      noise={snrData.noise} 
                      className="h-20 border-none bg-transparent opacity-40"
                    />
                  </div>

                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, snrData.snr * 20)}%` }}
                      className="h-full bg-brand"
                    />
                  </div>
                </div>

                {/* Signal */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-brand" />
                      <h3 className="text-[9px] font-mono text-white uppercase tracking-widest">Signal</h3>
                    </div>
                    <span className="text-[10px] font-mono text-brand font-bold">{displaySignalTasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {displaySignalTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-start gap-3 group">
                        <button onClick={() => handleToggleTask(task.id)} className="mt-0.5 shrink-0 text-zinc-700 hover:text-brand transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-xs text-zinc-300 line-clamp-1 group-hover:text-white transition-colors">{task.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Noise */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <List className="w-3.5 h-3.5 text-zinc-600" />
                      <h3 className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Noise</h3>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 font-bold">{noiseTasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {noiseTasks.slice(0, 2).map(task => (
                      <div key={task.id} className="flex items-start gap-3 group opacity-60">
                        <button onClick={() => handleToggleTask(task.id)} className="mt-0.5 shrink-0 text-zinc-800 hover:text-white transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-xs text-zinc-500 line-clamp-1 group-hover:text-white transition-colors">{task.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <NeuralSoundscape />
              </div>
            </motion.section>
          )}

          {!searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-brand/30" />
                  <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Shortcuts</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'mix-1', title: 'Focus Mix', icon: Zap, action: () => startFocusSession(processedSubjects[0]?.id || '', processedSubjects[0]?.topics[0]?.id || '') },
                  { id: 'mix-2', title: 'Review', icon: Brain, action: () => navigate('/review') },
                ].map((mix) => (
                  <button 
                    key={mix.id}
                    onClick={mix.action}
                    className="p-4 flex flex-col gap-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group items-center text-center"
                  >
                    <mix.icon className="w-5 h-5 text-zinc-600 group-hover:text-brand transition-colors" />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{mix.title}</span>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {studyLogs.length > 0 && !searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white tracking-tight">Recent Activity</h2>
                <button onClick={() => navigate('/analytics')} className="text-sm font-semibold text-brand hover:opacity-80 transition-opacity">History</button>
              </div>
              <div className="space-y-3">
                {studyLogs.slice(0, 4).map((log) => {
                  const subject = subjects.find(s => s.id === log.subjectId);
                  const topic = subject?.topics?.find(t => t.id === log.topicId);
                  return (
                    <div
                      key={log.id}
                      onClick={() => navigate(`/session/${log.id}`)}
                      className="flex items-center gap-4 p-4 bg-[#1C1C1E] rounded-[20px] hover:bg-[#2C2C2E] cursor-pointer group transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#8E8E93] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-white truncate">{topic?.title || 'Study Session'}</h4>
                        <p className="text-sm text-[#8E8E93] truncate mt-0.5">{subject?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{log.duration}m</p>
                        <p className="text-xs text-[#8E8E93] mt-0.5">{new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Subject Catalog */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Syllabus Telemetry'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            {!searchQuery && (
              <button 
                onClick={() => navigate('/manage')}
                className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
              >
                [ Manage ]
              </button>
            )}
            <button 
              onClick={() => setIsSubjectsCollapsed(!isSubjectsCollapsed)}
              className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
            >
              {isSubjectsCollapsed ? '[ Expand ]' : '[ Collapse ]'}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSubjectsCollapsed && (
            <motion.div
              key="subjects"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSubjects.map(subject => (
                  <motion.div key={subject.id} variants={itemVariants}>
                    <SubjectCard subject={subject} onStartFocus={(subId) => startFocusSession(subId, subjects.find(s => s.id === subId)?.topics[0]?.id || '')} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Visual Study Aid Section */}
      <motion.section id="visual-aid" variants={itemVariants}>
        <VisualStudyAid />
      </motion.section>

      {/* SNR Methodology & Analysis */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Noise/Signal Methodology</h2>
          </div>
          <button 
            onClick={() => setIsMethodologyCollapsed(!isMethodologyCollapsed)}
            className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
          >
            {isMethodologyCollapsed ? '[ View Details ]' : '[ Hide Details ]'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isMethodologyCollapsed && (
            <motion.div
              key="methodology"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
              className="overflow-hidden"
            >
              <SNRPhilosophy />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Analytics CTA */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
            <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Neural Analytics</h2>
          </div>
          <button 
            onClick={() => setIsAnalyticsCollapsed(!isAnalyticsCollapsed)}
            className="text-[9px] font-mono text-brand uppercase tracking-widest hover:text-white transition-colors"
          >
            {isAnalyticsCollapsed ? '[ Show CTA ]' : '[ Hide CTA ]'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isAnalyticsCollapsed && (
            <motion.div
              key="analytics-cta"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
              className="overflow-hidden"
            >
              <div className="enterprise-card p-10 relative group overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
                  <img 
                    src="https://picsum.photos/seed/analytics-tech/1200/600?grayscale" 
                    className="w-full h-full object-cover"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-brand/20 transition-all duration-1000 pointer-events-none" />
                <div className="relative flex flex-col lg:flex-row items-center gap-10">
                  <div className="flex-1 space-y-5 text-center lg:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-white text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-brand" />
                      Advanced Insights
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Deep Dive Analytics</h2>
                    <p className="text-[#8E8E93] text-base max-w-xl leading-relaxed">Our AI has processed your recent study patterns. We've identified several areas where you can optimize your focus for maximum retention.</p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
                      <button 
                        onClick={() => navigate('/weak-areas')}
                        className="enterprise-button px-8 py-3.5"
                      >
                        Generate Insights
                      </button>
                      <button 
                        onClick={() => navigate('/analytics')}
                        className="enterprise-button-secondary px-8 py-3.5"
                      >
                        View Full Data
                      </button>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/4 aspect-square bg-white/5 rounded-[32px] flex items-center justify-center relative group-hover:bg-white/10 transition-all duration-500">
                    <TrendingUp className="w-16 h-16 text-brand" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
