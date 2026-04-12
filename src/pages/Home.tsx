import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock, Target, Flame, Coffee, Play, Sparkles, TrendingUp, BookOpen, Brain, ChevronRight, Trophy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import CurrentScheduleBlock from '../components/CurrentScheduleBlock';
import Planner from '../components/Planner';
import AIStudyPlanner from '../components/AIStudyPlanner';
import TopicCard from '../components/TopicCard';
import SubjectCard from '../components/SubjectCard';
import { useNavigate } from 'react-router-dom';

import { CardSkeleton } from '../components/ui/Skeleton';

export default function Home() {
  const navigate = useNavigate();
  const { 
    subjects, 
    schedule, 
    recentlyStudied, 
    searchQuery, 
    setIsFocusMode, 
    setIsPaused, 
    setActiveSession,
    addToast,
    isAuthReady,
    user,
    userProfile,
    studyLogs,
    startFocusSession
  } = useAppStore();

  const processedSubjects = useMemo(() => {
    return subjects.map(s => {
      const avgMastery = s.topics.length > 0 
        ? s.topics.reduce((acc, t) => acc + t.mastery, 0) / s.topics.length
        : 0;
      const readiness = (s.score * 0.4) + (avgMastery * 0.6);
      const priorityScore = (100 - readiness) * (s.focus / 5) * (s.weakCount + 1);
      
      return { ...s, readiness, priorityScore };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return processedSubjects;
    return processedSubjects.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [processedSubjects, searchQuery]);

  const dueTopicsCount = useMemo(() => {
    const now = new Date();
    return subjects.flatMap(s => s.topics).filter(t => {
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
        <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 rounded-3xl">
          <BookOpen className="w-10 h-10 text-zinc-600" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">No Subjects Detected</h2>
        <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">Your study flow is currently empty. Initialize your syllabus to begin tracking your progress and generating AI insights.</p>
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

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 space-y-10 max-w-7xl mx-auto"
    >
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-white uppercase tracking-[0.3em]">Cognitive Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-[0.15em]">Welcome back, <span className="text-white">{user?.displayName?.split(' ')[0] || 'Scholar'}</span></h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest mt-4">System Status: Nominal. Ready for study flow.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-transparent border border-white/10 flex items-center gap-4 group hover:border-white/30 transition-all">
            <Flame className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Current Streak</p>
              <p className="text-xl font-bold text-white tabular-nums leading-none">{userProfile?.streak || 0} Days</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-transparent border border-white/10 flex items-center gap-4 group hover:border-white/30 transition-all">
            <Trophy className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">Current Level</p>
              <p className="text-xl font-bold text-white tabular-nums leading-none">{userProfile?.level || 1}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          className="enterprise-card p-6 bg-transparent border-white/10 flex flex-col justify-between group cursor-pointer"
          onClick={() => navigate('/review')}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-transparent border border-white/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="badge badge-brand">Review Due</span>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest">{dueTopicsCount} Topics</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Ready for neural recalibration</p>
          </div>
          <div className="mt-8 flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
            Start Review Session
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2">
          <CurrentScheduleBlock 
            schedule={schedule} 
            onViewFullSchedule={() => navigate('/schedule')} 
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Continue Studying</h2>
                <button className="text-xs font-bold text-zinc-500 hover:text-brand transition-colors">View All</button>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {recentlyStudied.map(topicId => {
                  const subject = subjects.find(s => s.topics.some(t => t.id === topicId));
                  const topic = subject?.topics.find(t => t.id === topicId);
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

        <div className="space-y-10">
          {!searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">AI Mixes</h2>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-4">
                {[
                  {
                    id: 'mix-1',
                    title: 'Focus Mix',
                    description: `Master ${processedSubjects[0]?.name || 'weak areas'}`,
                    icon: Zap,
                    color: 'text-white',
                    bg: 'bg-transparent border border-white/20',
                    action: () => startFocusSession(processedSubjects[0]?.id || '', processedSubjects[0]?.topics[0]?.id || ''),
                  },
                  {
                    id: 'mix-2',
                    title: 'Review Mix',
                    description: 'Spaced repetition session',
                    icon: Brain,
                    color: 'text-white',
                    bg: 'bg-transparent border border-white/20',
                    action: () => navigate('/review'),
                  },
                  {
                    id: 'mix-4',
                    title: 'The Grind',
                    description: 'High-intensity practice',
                    icon: Flame,
                    color: 'text-white',
                    bg: 'bg-transparent border border-white/20',
                    action: () => {},
                  }
                ].map((mix) => (
                  <button 
                    key={mix.id}
                    onClick={mix.action}
                    className="w-full enterprise-card p-4 flex items-center gap-4 hover:bg-white/5 group transition-all"
                  >
                    <div className={cn("w-10 h-10 flex items-center justify-center shrink-0", mix.bg)}>
                      <mix.icon className={cn("w-5 h-5", mix.color)} />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest group-hover:text-zinc-300 transition-colors">{mix.title}</h4>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{mix.description}</p>
                    </div>
                    <Play className="w-4 h-4 text-zinc-700 group-hover:text-white fill-current" />
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {studyLogs.length > 0 && !searchQuery && (
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Recent Activity</h2>
                <button onClick={() => navigate('/analytics')} className="text-xs font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">History</button>
              </div>
              <div className="space-y-3">
                {studyLogs.slice(0, 4).map((log) => {
                  const subject = subjects.find(s => s.id === log.subjectId);
                  const topic = subject?.topics.find(t => t.id === log.topicId);
                  return (
                    <div
                      key={log.id}
                      onClick={() => navigate(`/session/${log.id}`)}
                      className="flex items-center gap-4 p-3 rounded-none hover:bg-white/5 cursor-pointer group transition-all border border-transparent hover:border-white/10"
                    >
                      <div className="w-8 h-8 rounded-none bg-transparent border border-white/20 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest truncate">{topic?.title || 'Study Session'}</h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate">{subject?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-white">{log.duration}m</p>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
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

      {/* Analytics CTA */}
      <motion.section 
        variants={itemVariants}
        className="enterprise-card p-12 relative group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 group-hover:bg-white/10 transition-all duration-1000 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-transparent border border-white/30 rounded-none text-white text-[10px] font-mono uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Advanced Insights
            </div>
            <h2 className="text-4xl font-bold text-white uppercase tracking-[0.15em]">Deep Dive Analytics</h2>
            <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest max-w-xl leading-relaxed">Our AI has processed your recent study patterns. We've identified several areas where you can optimize your focus for maximum retention.</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => navigate('/weak-areas')}
                className="enterprise-button px-8 py-3"
              >
                Generate Insights
              </button>
              <button 
                onClick={() => navigate('/analytics')}
                className="enterprise-button-secondary px-8 py-3"
              >
                View Full Data
              </button>
            </div>
          </div>
          <div className="w-full lg:w-1/3 aspect-square bg-transparent border border-white/20 rounded-none flex items-center justify-center relative overflow-hidden group-hover:border-white/50 transition-all duration-700 shadow-2xl">
            <TrendingUp className="w-24 h-24 text-white animate-pulse" />
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
