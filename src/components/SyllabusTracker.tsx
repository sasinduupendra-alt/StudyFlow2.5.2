import React from 'react';
import { CheckCircle2, Circle, BookOpen, TrendingUp, Target, AlertCircle, ExternalLink, Video, FileText, Link as LinkIcon, X } from 'lucide-react';
import { Subject, Resource, Topic } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SyllabusTrackerProps {
  subjects: Subject[];
  onUpdateMastery: (subjectId: string, topicId: string, mastery: number) => void;
  highlightedSubjectId?: string;
}

interface TopicItemProps {
  subject: Subject;
  topic: Topic;
  onUpdateMastery: (subjectId: string, topicId: string, mastery: number) => void;
  onViewResources: (subject: Subject, topic: Topic) => void;
}

const TopicItem = React.memo(({ subject, topic, onUpdateMastery, onViewResources }: TopicItemProps) => {
  return (
    <div className="group enterprise-card p-6 relative overflow-hidden">
      <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="flex items-start justify-between mb-6 relative z-10">
        <h4 className="font-mono text-sm text-white flex-1 pr-4 uppercase tracking-widest group-hover:text-white transition-colors">{topic.title}</h4>
        <div className="flex items-center gap-3">
          {topic.resources && topic.resources.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-none border border-white/10 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center -space-x-1">
                {Array.from(new Set(topic.resources.map(r => r.type))).map(type => (
                  <div key={type} className="p-0.5">
                    {type === 'video' ? <Video className="w-2.5 h-2.5 text-zinc-400" /> :
                     type === 'pdf' ? <FileText className="w-2.5 h-2.5 text-zinc-400" /> :
                     <LinkIcon className="w-2.5 h-2.5 text-zinc-400" />}
                  </div>
                ))}
              </div>
              <span>{topic.resources.length}</span>
            </div>
          )}
          {topic.mastery >= 80 ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : topic.mastery >= 50 ? (
            <TrendingUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-zinc-600" />
          )}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <span>Mastery Level</span>
          <span className={cn(
            "tabular-nums",
            topic.mastery >= 80 ? "text-white" : topic.mastery >= 50 ? "text-zinc-400" : "text-zinc-600"
          )}>{topic.mastery}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-none relative overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${topic.mastery}%` }}
            className={cn(
              "h-full rounded-none transition-all duration-1000",
              topic.mastery >= 80 ? "bg-white" : topic.mastery >= 50 ? "bg-zinc-400" : "bg-zinc-600"
            )}
          />
        </div>
        <input 
          type="range"
          min="0"
          max="100"
          value={topic.mastery}
          onChange={(e) => onUpdateMastery(subject.id, topic.id, parseInt(e.target.value))}
          className="w-full h-4 opacity-0 absolute inset-0 cursor-pointer z-10"
        />
      </div>

      <div className="mt-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
        <button 
          onClick={() => onViewResources(subject, topic)}
          className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase tracking-widest transition-colors"
        >
          View Resources
        </button>
        <div className="w-1 h-1 bg-white/20 rounded-none" />
        <button className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Past Papers</button>
      </div>
    </div>
  );
});

interface SubjectBlockProps {
  subject: Subject;
  onUpdateMastery: (subjectId: string, topicId: string, mastery: number) => void;
  onViewResources: (subject: Subject, topic: Topic) => void;
  isHighlighted: boolean;
  innerRef: (el: HTMLDivElement | null) => void;
}

const SubjectBlock = React.memo(({ subject, onUpdateMastery, onViewResources, isHighlighted, innerRef }: SubjectBlockProps) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={itemVariants}
      ref={innerRef}
      className={cn(
        "enterprise-card transition-all duration-500 overflow-hidden",
        isHighlighted ? "border-white/50 ring-1 ring-white/20 scale-[1.01] z-10" : ""
      )}
    >
      <div className={cn("p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/[0.02] border-b border-white/10")}>
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 rounded-none bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-widest uppercase leading-none">{subject.name}</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-4">{subject.topics.length} Topics Total</p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          {subject.notes && (
            <div className="hidden lg:block max-w-sm text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-loose border-l border-white/20 pl-6">
              {subject.notes}
            </div>
          )}
          <div className="text-right">
            <p className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">{Math.round(subject.readiness)}%</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-4">Subject Mastery</p>
          </div>
        </div>
      </div>
      
      {subject.notes && (
        <div className="lg:hidden px-10 pt-8 pb-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-loose border-l border-white/20 ml-10">
          {subject.notes}
        </div>
      )}

      <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subject.topics.map((topic) => (
          <TopicItem 
            key={topic.id}
            subject={subject}
            topic={topic}
            onUpdateMastery={onUpdateMastery}
            onViewResources={onViewResources}
          />
        ))}
      </div>
    </motion.div>
  );
});

export const SyllabusTracker = React.memo(({ subjects, onUpdateMastery, highlightedSubjectId }: SyllabusTrackerProps) => {
  const [selectedTopic, setSelectedTopic] = React.useState<{ subject: Subject, topic: Topic } | null>(null);
  const subjectRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleViewResources = React.useCallback((subject: Subject, topic: Topic) => {
    setSelectedTopic({ subject, topic });
  }, []);

  React.useEffect(() => {
    if (highlightedSubjectId && subjectRefs.current[highlightedSubjectId]) {
      subjectRefs.current[highlightedSubjectId]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [highlightedSubjectId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 md:space-y-16">
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8"
      >
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-white tracking-widest uppercase">Syllabus Tracker</h2>
          <p className="text-zinc-500 text-sm max-w-xl leading-relaxed font-mono uppercase tracking-widest">Track your progress across the A/L Physical Science stream. Mission critical data for exam readiness.</p>
        </div>
        <div className="flex items-center justify-center gap-8 md:gap-12 bg-transparent border border-white/10 p-8 md:p-10 rounded-none">
          <div className="text-center px-6 md:px-8 border-r border-white/10">
            <p className="text-3xl md:text-5xl font-mono text-white tabular-nums tracking-widest">
              {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.readiness, 0) / subjects.length) : 0}%
            </p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Overall Readiness</p>
          </div>
          <div className="text-center px-6 md:px-8">
            <p className="text-3xl md:text-5xl font-mono text-white tabular-nums tracking-widest">
              {subjects.reduce((acc, s) => acc + s.topics.filter(t => t.mastery >= 80).length, 0)}
            </p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Topics Mastered</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-10"
      >
        {subjects.map((subject) => (
          <SubjectBlock 
            key={subject.id}
            subject={subject}
            onUpdateMastery={onUpdateMastery}
            onViewResources={handleViewResources}
            isHighlighted={highlightedSubjectId === subject.id}
            innerRef={el => { subjectRefs.current[subject.id] = el; }}
          />
        ))}
      </motion.div>

      {/* Resources Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-black border border-white/20 overflow-hidden shadow-2xl rounded-none"
            >
              <div className={cn("p-8 bg-white/5 border-b border-white/10 relative")}>
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="absolute top-6 right-6 p-2 bg-transparent hover:bg-white/10 transition-colors rounded-none border border-white/20"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-none bg-transparent flex items-center justify-center border border-white/20">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{selectedTopic.subject.name}</p>
                    <h3 className="text-2xl font-bold text-white leading-tight uppercase tracking-widest">{selectedTopic.topic.title}</h3>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Study Resources</h4>
                  {(!selectedTopic.topic.resources || selectedTopic.topic.resources.length === 0) ? (
                    <div className="bg-transparent rounded-none p-10 text-center border border-dashed border-white/20">
                      <LinkIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">No resources added for this topic yet.</p>
                      <p className="text-xs text-zinc-600 mt-1 font-mono uppercase tracking-widest">Add links, videos, or PDFs in the Manage tab.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTopic.topic.resources.map(resource => (
                        <a 
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-4 p-4 bg-transparent hover:bg-white/5 rounded-none border transition-all group",
                            resource.type === 'video' ? "border-white/10 hover:border-white/30" :
                            resource.type === 'pdf' ? "border-white/10 hover:border-white/30" :
                            "border-white/10 hover:border-white/30"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-none flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 border border-white/20",
                            resource.type === 'video' ? "bg-transparent text-white" :
                            resource.type === 'pdf' ? "bg-transparent text-white" :
                            "bg-transparent text-white"
                          )}>
                            {resource.type === 'video' ? <Video className="w-5 h-5" /> :
                             resource.type === 'pdf' ? <FileText className="w-5 h-5" /> :
                             <LinkIcon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono text-white truncate uppercase tracking-widest">{resource.title}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">{resource.type}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Topic Mastery</h4>
                    <span className="text-sm font-mono text-white">{selectedTopic.topic.mastery}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-none overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedTopic.topic.mastery}%` }}
                      className="h-full bg-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SyllabusTracker;
