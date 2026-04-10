import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock, Target, Flame, Coffee, Play, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
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
        <div className="w-24 h-24 bg-white/5 border border-border-dim flex items-center justify-center mb-4 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand/40" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-brand/40" />
          <BookOpen className="w-10 h-10 text-gray-600" />
        </div>
        <h2 className="text-2xl font-black tracking-tighter uppercase">System_Empty</h2>
        <p className="text-gray-500 max-w-md mx-auto text-xs font-black uppercase tracking-widest leading-relaxed">No subject data detected in current database. Initialize syllabus to begin tracking.</p>
        <button 
          onClick={() => navigate('/manage')}
          className="scifi-button"
        >
          INITIALIZE_SYLLABUS
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
      className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto"
    >
      <motion.section variants={itemVariants}>
        <CurrentScheduleBlock 
          schedule={schedule} 
          onViewFullSchedule={() => navigate('/schedule')} 
        />
      </motion.section>

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
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-brand shadow-[0_0_10px_var(--color-brand-glow)]" />
              <h2 className="text-lg font-black tracking-tighter uppercase">Recent_Cache</h2>
            </div>
            <button className="hud-label hover:text-brand transition-colors">ACCESS_ALL</button>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide"
          >
            {recentlyStudied.map(topicId => {
              const subject = subjects.find(s => s.topics.some(t => t.id === topicId));
              const topic = subject?.topics.find(t => t.id === topicId);
              if (!topic || !subject) return null;
              return (
                <motion.div 
                  key={topicId} 
                  variants={itemVariants}
                  className="min-w-[220px] w-[220px]"
                >
                  <TopicCard 
                    topic={topic} 
                    subjectName={subject.name} 
                    onStartFocus={() => startFocusSession(subject.id, topic.id)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>
      )}

      {studyLogs.length > 0 && !searchQuery && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-brand shadow-[0_0_10px_var(--color-brand-glow)]" />
              <h2 className="text-lg font-black tracking-tighter uppercase">Log_History</h2>
            </div>
            <button onClick={() => navigate('/analytics')} className="hud-label hover:text-brand transition-colors">ANALYZE_DATA</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyLogs.slice(0, 3).map((log) => {
              const subject = subjects.find(s => s.id === log.subjectId);
              const topic = subject?.topics.find(t => t.id === log.topicId);
              return (
                <motion.div
                  key={log.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/session/${log.id}`)}
                  className="scifi-panel-sm p-4 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand/5 border border-brand/20 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[11px] uppercase truncate group-hover:text-brand transition-colors">{topic?.title || 'Study Session'}</h4>
                      <p className="hud-label !text-gray-600 truncate">{subject?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black tabular-nums">{log.duration}M</p>
                      <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">{new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {!searchQuery && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-brand shadow-[0_0_10px_var(--color-brand-glow)]" />
              <h2 className="text-lg font-black tracking-tighter uppercase">AI_Generation</h2>
            </div>
            <button className="hud-label hover:text-brand transition-colors">REFRESH_MIX</button>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {[
              {
                id: 'mix-1',
                title: 'Daily Mix 1',
                description: `Focus on ${processedSubjects[0]?.name || 'your weakest area'}`,
                gradient: 'from-brand/20 to-transparent',
                icon: Zap,
                color: '#1DB954',
                action: () => startFocusSession(processedSubjects[0]?.id || '', processedSubjects[0]?.topics[0]?.id || ''),
                tag: 'WEAK_AREAS'
              },
              {
                id: 'mix-2',
                title: 'Review Mix',
                description: 'Spaced repetition for long-term retention.',
                gradient: 'from-blue-500/20 to-transparent',
                icon: Clock,
                color: '#4d569d',
                action: () => {},
                tag: 'REPETITION'
              },
              {
                id: 'mix-3',
                title: 'Mastery Mix',
                description: 'Polish your strong areas to reach 100%.',
                gradient: 'from-purple-500/20 to-transparent',
                icon: Target,
                color: '#e91e63',
                action: () => {},
                tag: 'POLISH'
              },
              {
                id: 'mix-4',
                title: 'The Grind',
                description: 'High-intensity session for maximum points.',
                gradient: 'from-orange-500/20 to-transparent',
                icon: Flame,
                color: '#ff5722',
                action: () => {},
                tag: 'INTENSE'
              },
              {
                id: 'mix-5',
                title: 'Chill Study',
                description: 'Light review and resource browsing.',
                gradient: 'from-cyan-500/20 to-transparent',
                icon: Coffee,
                color: '#00bcd4',
                action: () => {},
                tag: 'RELAXED'
              }
            ].slice(0, 5).map((mix) => (
              <motion.div 
                key={mix.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="scifi-panel-sm p-4 transition-all duration-500 hover:bg-white/5 cursor-pointer group"
                onClick={mix.action}
              >
                <div className={cn("aspect-square mb-4 relative overflow-hidden bg-surface border border-border-dim group-hover:border-brand/30 transition-colors", mix.gradient)}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700">
                    <mix.icon className="w-16 h-16 text-white" />
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-brand/10 backdrop-blur-sm transition-all"
                  >
                    <Play className="w-8 h-8 text-brand fill-current" />
                  </motion.div>
 
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 bg-black/60 border border-white/10 text-[7px] font-black text-white tracking-[0.2em] uppercase">
                      {mix.tag}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-black text-[11px] mb-1 truncate group-hover:text-brand transition-colors uppercase tracking-tight">{mix.title}</h3>
                <p className="text-[9px] text-gray-600 line-clamp-2 leading-relaxed font-black uppercase tracking-tighter">
                  {mix.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-brand shadow-[0_0_10px_var(--color-brand-glow)]" />
            <h2 className="text-lg font-black tracking-tighter uppercase">
              {searchQuery ? `Search_Results: "${searchQuery}"` : 'Subject_Database'}
            </h2>
          </div>
          {!searchQuery && <button onClick={() => navigate('/manage')} className="hud-label hover:text-brand transition-colors">EXPAND_ALL</button>}
        </div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredSubjects.map(subject => (
            <motion.div key={subject.id} variants={itemVariants}>
              <SubjectCard subject={subject} onStartFocus={(subId) => startFocusSession(subId, subjects.find(s => s.id === subId)?.topics[0]?.id || '')} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section 
        variants={itemVariants}
        className="scifi-panel p-8 md:p-12 group"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-brand/10 transition-colors duration-1000 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-brand/10 border border-brand/20 text-brand text-[9px] font-black tracking-[0.3em] uppercase shadow-[0_0_15px_rgba(29,185,84,0.1)]">
              <Sparkles className="w-3 h-3" />
              AI_ANALYSIS_ACTIVE
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">Deep_Dive_Analytics</h2>
            <p className="text-gray-500 text-sm max-w-xl font-black uppercase tracking-widest leading-relaxed">Neural network processing complete. Performance metrics indicate growth potential in core modules. Initialize deep scan for detailed insights.</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => navigate('/weak-areas')}
                className="scifi-button px-8 py-4"
              >
                GENERATE_INSIGHTS
              </button>
              <button 
                onClick={() => navigate('/analytics')}
                className="scifi-button-outline px-8 py-4"
              >
                VIEW_FULL_DATA
              </button>
            </div>
          </div>
          <div className="w-full lg:w-1/4 aspect-square bg-white/5 border border-border-dim flex items-center justify-center relative overflow-hidden group-hover:border-brand/30 transition-all duration-700 shadow-2xl scale-95 group-hover:scale-100">
            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <TrendingUp className="w-24 h-24 text-brand animate-pulse drop-shadow-[0_0_20px_rgba(29,185,84,0.4)]" />
            <div className="absolute bottom-2 left-2 hud-label !text-gray-700">SCAN_ACTIVE</div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
