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
        <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-16 h-16 text-gray-600" />
        </div>
        <h2 className="text-3xl font-black tracking-tight">Your Syllabus is Empty</h2>
        <p className="text-gray-400 max-w-md mx-auto">Add your subjects and topics to start tracking your progress and getting AI insights.</p>
        <button 
          onClick={() => navigate('/manage')}
          className="px-8 py-4 bg-[#1DB954] text-black rounded-full font-black hover:scale-105 transition-all"
        >
          Add Your First Subject
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
            <h2 className="text-2xl font-bold tracking-tight">Recently Studied</h2>
            <button className="text-sm font-bold text-gray-400 hover:text-white hover:underline">Show all</button>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          >
            {recentlyStudied.map(topicId => {
              const subject = subjects.find(s => s.topics.some(t => t.id === topicId));
              const topic = subject?.topics.find(t => t.id === topicId);
              if (!topic || !subject) return null;
              return (
                <motion.div 
                  key={topicId} 
                  variants={itemVariants}
                  className="min-w-[180px] w-[180px]"
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
            <h2 className="text-2xl font-bold tracking-tight">Recent Sessions</h2>
            <button onClick={() => navigate('/analytics')} className="text-sm font-bold text-gray-400 hover:text-white hover:underline">View History</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyLogs.slice(0, 3).map((log) => {
              const subject = subjects.find(s => s.id === log.subjectId);
              const topic = subject?.topics.find(t => t.id === log.topicId);
              return (
                <motion.div
                  key={log.id}
                  whileHover={{ scale: 1.02, backgroundColor: '#282828' }}
                  onClick={() => navigate(`/session/${log.id}`)}
                  className="bg-[#181818] p-4 rounded-xl border border-white/5 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1DB954]/10 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-[#1DB954]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate group-hover:text-[#1DB954] transition-colors">{topic?.title || 'Study Session'}</h4>
                      <p className="text-xs text-gray-500 truncate">{subject?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{log.duration}m</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">{new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
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
            <h2 className="text-2xl font-bold tracking-tight">Made For You</h2>
            <button className="text-sm font-bold text-gray-400 hover:text-white hover:underline">See all</button>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
          >
            {[
              {
                id: 'mix-1',
                title: 'Daily Mix 1',
                description: `Focus on ${processedSubjects[0]?.name || 'your weakest area'}`,
                gradient: 'from-[#1DB954] to-[#121212]',
                icon: Zap,
                color: '#1DB954',
                action: () => startFocusSession(processedSubjects[0]?.id || '', processedSubjects[0]?.topics[0]?.id || ''),
                tag: 'WEAK AREAS'
              },
              {
                id: 'mix-2',
                title: 'Review Mix',
                description: 'Spaced repetition for long-term retention.',
                gradient: 'from-[#4d569d] to-[#121212]',
                icon: Clock,
                color: '#4d569d',
                action: () => {},
                tag: 'REPETITION'
              },
              {
                id: 'mix-3',
                title: 'Mastery Mix',
                description: 'Polish your strong areas to reach 100%.',
                gradient: 'from-[#e91e63] to-[#121212]',
                icon: Target,
                color: '#e91e63',
                action: () => {},
                tag: 'POLISH'
              },
              {
                id: 'mix-4',
                title: 'The Grind',
                description: 'High-intensity session for maximum points.',
                gradient: 'from-[#ff5722] to-[#121212]',
                icon: Flame,
                color: '#ff5722',
                action: () => {},
                tag: 'INTENSE'
              },
              {
                id: 'mix-5',
                title: 'Chill Study',
                description: 'Light review and resource browsing.',
                gradient: 'from-[#00bcd4] to-[#121212]',
                icon: Coffee,
                color: '#00bcd4',
                action: () => {},
                tag: 'RELAXED'
              }
            ].slice(0, 5).map((mix) => (
              <motion.div 
                key={mix.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-[#181818] p-4 rounded-2xl transition-all duration-300 hover:bg-[#282828] cursor-pointer shadow-lg border border-white/5 hover:border-white/10 hover:shadow-2xl"
                onClick={mix.action}
              >
                <div className={cn("aspect-square rounded-xl mb-4 relative overflow-hidden bg-gradient-to-br shadow-inner", mix.gradient)}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500">
                    <mix.icon className="w-24 h-24 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-3 right-3 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
                  >
                    <Play className="w-6 h-6 text-black fill-current ml-1" />
                  </motion.div>

                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-black/40 backdrop-blur-md rounded text-[8px] font-black text-white tracking-widest uppercase border border-white/10">
                      {mix.tag}
                    </span>
                  </div>
                </div>
                
                <h3 className="font-bold text-sm mb-1 truncate group-hover:text-[#1DB954] transition-colors">{mix.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {mix.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Your Subjects'}
          </h2>
          {!searchQuery && <button onClick={() => navigate('/manage')} className="text-sm font-bold text-gray-400 hover:text-white hover:underline">Show all</button>}
        </div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
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
        className="relative bg-gradient-to-br from-[#1DB954]/20 via-[#1DB954]/5 to-transparent p-8 md:p-12 rounded-[2rem] border border-[#1DB954]/20 overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1DB954]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-[#1DB954]/20 transition-colors duration-700 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1DB954]/20 rounded-full text-[#1DB954] text-xs font-black tracking-widest uppercase border border-[#1DB954]/30 shadow-[0_0_15px_rgba(29,185,84,0.2)]">
              <Sparkles className="w-4 h-4" />
              AI Analysis Ready
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Deep Dive into Your Progress</h2>
            <p className="text-gray-400 text-lg max-w-xl">Our AI has analyzed your performance. You're showing strong growth in some areas but might need more focus on others.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
              <button 
                onClick={() => navigate('/weak-areas')}
                className="px-8 py-4 bg-[#1DB954] text-black rounded-full font-black hover:scale-105 transition-all shadow-[0_8px_20px_rgba(29,185,84,0.3)] flex items-center gap-2"
              >
                Generate New Insights
              </button>
              <button 
                onClick={() => navigate('/analytics')}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-black transition-all backdrop-blur-md"
              >
                View Full Analytics
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:border-[#1DB954]/30 transition-colors duration-500 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <TrendingUp className="w-32 h-32 text-[#1DB954] animate-pulse drop-shadow-[0_0_30px_rgba(29,185,84,0.5)]" />
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
