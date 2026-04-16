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
      t.frequency === 'Daily' && 
      (!t.dueDate || t.dueDate <= todayStr)
    );
  }, [tasks, todayStr]);

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

  const signalFilteredTasks = useMemo(() => executionTasks.filter(t => t.impact >= 7 && !dailyCommits.includes(t.id)), [executionTasks, dailyCommits]);
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
    if (!searchQuery) return processedSubjects;
    return processedSubjects.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.topics?.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
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
      className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto relative min-h-screen"
    >
      <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.03]" />

      <DailyCommitPrompt 
        tasks={tasks} 
        isOpen={!isDailyCommitDone && tasks.filter(t => t.impact >= 7).length >= 3} 
        onCommit={handleCommit} 
      />

      <NoiseCaptureButton onLogNoise={handleLogNoise} />

      {/* Welcome Header */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-1000">
          <img 
            src="https://picsum.photos/seed/neural-welcome/1200/400?grayscale&blur=10" 
            className="w-full h-full object-cover"
            alt=""
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
        
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand/10 border border-brand/30 flex items-center justify-center text-brand rounded-lg shadow-[0_0_15px_var(--color-brand-glow)]">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-brand uppercase tracking-[0.4em]">System Active</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase">
            Vector <span className="text-brand glow-text">Flow</span>
          </h1>
          <p className="text-[#8E8E93] text-[11px] font-mono uppercase tracking-[0.3em] mt-6 flex items-center gap-3">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand-glow)]" />
            {user ? `Authenticated: ${user.displayName?.split(' ')[0]}` : 'Awaiting Authentication'}
          </p>
        </div>

        {!user ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="enterprise-button px-12 py-5 flex items-center gap-3 relative z-10 shadow-[0_0_30px_var(--color-brand-glow)]"
          >
            <LogIn className="w-5 h-5" />
            Initialize Session
          </motion.button>
        ) : (
          <div className="flex items-center gap-8 bg-white/5 backdrop-blur-md px-8 py-6 rounded-[24px] border border-white/10 relative z-10 vector-border">
            <div className="text-center">
              <p className="text-[9px] font-mono text-[#8E8E93] uppercase tracking-[0.2em] mb-2">SNR INDEX</p>
              <p className="text-3xl font-black text-white flex items-center justify-center gap-2 tracking-tighter">
                {snrData.snr.toFixed(2)} <TrendingUp className="w-6 h-6 text-brand" />
              </p>
            </div>
            <div className="w-[1px] h-12 bg-white/10" />
            <div className="text-center">
              <p className="text-[9px] font-mono text-[#8E8E93] uppercase tracking-[0.2em] mb-2">SIGNAL RATE</p>
              <p className="text-3xl font-black text-brand flex items-center justify-center gap-2 tracking-tighter">
                {Math.round(signalCompletionRate)}% <Sparkles className="w-6 h-6" />
              </p>
            </div>
          </div>
        )}
      </motion.header>

      {/* Bento Grid Stats */}
      <motion.div variants={itemVariants} className="w-full">
        <CurrentScheduleBlock 
          schedule={schedule} 
          onViewFullSchedule={() => navigate('/schedule')} 
          reviewCount={dueTopicsCount}
          onReviewClick={() => navigate('/review')}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.section variants={itemVariants}>
            <Planner 
              prioritySubject={prioritySubject} 
              dailyPlan={dailyPlan} 
              onStartFocus={(subId, topId) => startFocusSession(subId, topId || subjects.find(s => s.id === subId)?.topics[0]?.id || '')}
              onViewFullSchedule={() => navigate('/schedule')}
            />
          </motion.section>

          <motion.section variants={itemVariants}>
            <AIStudyPlanner />
          </motion.section>

          {recentlyStudied.length > 0 && !searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white tracking-tight">Continue Studying</h2>
                <button className="text-sm font-semibold text-brand hover:opacity-80 transition-opacity">View All</button>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                {recentlyStudied.map(topicId => {
                  const subject = subjects.find(s => s.topics?.some(t => t.id === topicId));
                  const topic = subject?.topics?.find(t => t.id === topicId);
                  if (!topic || !subject) return null;
                  return (
                    <div key={topicId} className="min-w-[280px]">
                      <TopicCard 
                        topic={topic} 
                        subjectName={subject.name} 
                        onStartFocus={() => startFocusSession(subject.id, topic.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>

        <div className="space-y-8">
          {/* Mini Execution Tab */}
          {!searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white tracking-tight">Today's Execution</h2>
                <button onClick={() => navigate('/tasks')} className="text-sm font-semibold text-brand hover:opacity-80 transition-opacity">View All</button>
              </div>
              <div className="space-y-4">
                {/* SNR Index Card */}
                <div className="bg-brand/5 border border-brand/20 rounded-[20px] p-5 relative overflow-hidden group">
                  <div className="scan-line opacity-20" />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-brand" />
                      <h3 className="text-[10px] font-mono text-brand uppercase tracking-[0.2em]">SNR Index</h3>
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter">{snrData.snr.toFixed(2)}</span>
                  </div>
                  
                  {/* Visual Waveform */}
                  <div className="mb-4 relative z-10">
                    <SNRVisualizer 
                      signal={snrData.signal} 
                      noise={snrData.noise} 
                      className="h-24 border-none bg-transparent"
                    />
                  </div>

                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, snrData.snr * 20)}%` }}
                      className="h-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)]"
                    />
                  </div>
                  <p className="text-[9px] font-mono text-[#8E8E93] uppercase tracking-[0.1em] mt-2 relative z-10">
                    Efficiency: {snrData.snr > 2 ? 'High Signal' : 'Low Signal'}
                  </p>
                </div>

                {/* Signal */}
                <div className="bg-[#1C1C1E] rounded-[20px] p-5 border border-brand/30 hover:border-brand/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Signal</h3>
                    </div>
                    <span className="text-xs font-mono text-brand">{signalTasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {signalTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-start gap-3 group">
                        <button onClick={() => handleToggleTask(task.id)} className="mt-0.5 shrink-0 text-zinc-600 hover:text-brand transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <p className="text-sm text-white line-clamp-2 leading-tight group-hover:text-brand transition-colors">{task.title}</p>
                      </div>
                    ))}
                    {signalTasks.length === 0 && (
                      <p className="text-xs text-[#8E8E93] italic">No active signal tasks.</p>
                    )}
                  </div>
                </div>

                {/* Noise */}
                <div className="bg-[#1C1C1E] rounded-[20px] p-5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-[#8E8E93]" />
                      <h3 className="text-sm font-bold text-[#8E8E93] uppercase tracking-wider">Noise</h3>
                    </div>
                    <span className="text-xs font-mono text-[#8E8E93]">{noiseTasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {noiseTasks.slice(0, 2).map(task => (
                      <div key={task.id} className="flex items-start gap-3 opacity-70 hover:opacity-100 transition-opacity group">
                        <button onClick={() => handleToggleTask(task.id)} className="mt-0.5 shrink-0 text-zinc-600 hover:text-white transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <p className="text-sm text-[#8E8E93] line-clamp-2 leading-tight group-hover:text-white transition-colors">{task.title}</p>
                      </div>
                    ))}
                    {noiseTasks.length === 0 && (
                      <p className="text-xs text-[#8E8E93] italic">No active noise tasks.</p>
                    )}
                  </div>
                </div>

                <NeuralSoundscape />
              </div>
            </motion.section>
          )}

          {!searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white tracking-tight">Quick Actions</h2>
                <Sparkles className="w-4 h-4 text-brand" />
              </div>
              <div className="space-y-3">
                {[
                  {
                    id: 'mix-1',
                    title: 'Focus Mix',
                    description: `Master ${processedSubjects[0]?.name || 'weak areas'}`,
                    icon: Zap,
                    action: () => startFocusSession(processedSubjects[0]?.id || '', processedSubjects[0]?.topics[0]?.id || ''),
                  },
                  {
                    id: 'mix-5',
                    title: 'Neural Vision',
                    description: 'Synthesize study diagrams',
                    icon: Layers,
                    action: () => {
                      const el = document.getElementById('visual-aid');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    },
                  },
                  {
                    id: 'mix-2',
                    title: 'Review Mix',
                    description: 'Spaced repetition session',
                    icon: Brain,
                    action: () => navigate('/review'),
                  },
                  {
                    id: 'mix-4',
                    title: 'The Grind',
                    description: 'High-intensity practice',
                    icon: Flame,
                    action: () => {},
                  }
                ].map((mix) => (
                  <button 
                    key={mix.id}
                    onClick={mix.action}
                    className="w-full p-4 flex items-center gap-4 bg-[#1C1C1E] rounded-[20px] hover:bg-[#2C2C2E] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                      <mix.icon className="w-5 h-5 text-[#8E8E93] group-hover:text-brand transition-colors" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-base font-semibold text-white">{mix.title}</h4>
                      <p className="text-sm text-[#8E8E93] mt-0.5">{mix.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8E8E93] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
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
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Your Subjects'}
          </h2>
          {!searchQuery && (
            <button 
              onClick={() => navigate('/manage')}
              className="enterprise-button-secondary"
            >
              Manage Syllabus
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubjects.map(subject => (
            <motion.div key={subject.id} variants={itemVariants}>
              <SubjectCard subject={subject} onStartFocus={(subId) => startFocusSession(subId, subjects.find(s => s.id === subId)?.topics[0]?.id || '')} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Visual Study Aid Section */}
      <motion.section id="visual-aid" variants={itemVariants}>
        <VisualStudyAid />
      </motion.section>

      {/* SNR Neural Spectrum Analysis */}
      <motion.section variants={itemVariants} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group">
        <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />
        <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="flex flex-col lg:flex-row gap-12 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Neural Spectrum Analysis</h2>
                <p className="text-xs font-mono text-[#8E8E93] uppercase tracking-widest">Signal-to-Noise Ratio (SNR) Monitoring</p>
              </div>
            </div>
            
            <p className="text-[#8E8E93] text-sm leading-relaxed mb-8 max-w-2xl">
              In the Vector Flow system, <span className="text-brand font-bold">Signal</span> represents high-impact study tasks that directly contribute to your mastery. <span className="text-[#8E8E93] font-bold">Noise</span> represents the background effort and low-impact tasks that consume cognitive energy without significant gains. A high SNR indicates peak efficiency.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider mb-1">Current SNR</p>
                <p className="text-2xl font-black text-white">{snrData.snr.toFixed(2)}</p>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider mb-1">Signal Strength</p>
                <p className="text-2xl font-black text-brand">{Math.round(snrData.signal)}</p>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider mb-1">Noise Floor</p>
                <p className="text-2xl font-black text-[#8E8E93]">{Math.round(snrData.noise)}</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[450px]">
            <SNRVisualizer 
              signal={snrData.signal} 
              noise={snrData.noise} 
              className="h-[250px] shadow-2xl neural-glow"
            />
          </div>
        </div>
      </motion.section>

      {/* Analytics CTA */}
      <motion.section 
        variants={itemVariants}
        className="enterprise-card p-10 relative group overflow-hidden"
      >
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
      </motion.section>
    </motion.div>
  );
}
