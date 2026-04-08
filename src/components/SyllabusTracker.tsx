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
    <div className="group bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-sm leading-tight flex-1 pr-4">{topic.title}</h4>
        <div className="flex items-center gap-2">
          {topic.resources && topic.resources.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded text-[8px] font-bold text-gray-500">
              <div className="flex items-center -space-x-0.5">
                {Array.from(new Set(topic.resources.map(r => r.type))).map(type => (
                  <div key={type} className="p-0.5">
                    {type === 'video' ? <Video className="w-2 h-2 text-red-500" /> :
                     type === 'pdf' ? <FileText className="w-2 h-2 text-blue-500" /> :
                     <LinkIcon className="w-2 h-2 text-[#1DB954]" />}
                  </div>
                ))}
              </div>
              <span>{topic.resources.length}</span>
            </div>
          )}
          {topic.mastery >= 80 ? (
            <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
          ) : topic.mastery >= 50 ? (
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
          <span>Mastery Level</span>
          <span className={cn(
            topic.mastery >= 80 ? "text-[#1DB954]" : topic.mastery >= 50 ? "text-yellow-500" : "text-red-500"
          )}>{topic.mastery}%</span>
        </div>
        <input 
          type="range"
          min="0"
          max="100"
          value={topic.mastery}
          onChange={(e) => onUpdateMastery(subject.id, topic.id, parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#1DB954]"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onViewResources(subject, topic)}
          className="text-[10px] font-bold text-[#1DB954] hover:underline uppercase tracking-widest"
        >
          View Resources
        </button>
        <span className="text-gray-700">•</span>
        <button className="text-[10px] font-bold text-[#1DB954] hover:underline uppercase tracking-widest">Past Papers</button>
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={itemVariants}
      ref={innerRef}
      className={cn(
        "bg-[#181818] rounded-3xl border overflow-hidden transition-all duration-500",
        isHighlighted ? "border-[#1DB954] shadow-[0_0_30px_rgba(29,185,84,0.1)] scale-[1.01]" : "border-white/5"
      )}
    >
      <div className={cn("p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r", subject.gradient)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{subject.name}</h3>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{subject.topics.length} Topics Total</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {subject.notes && (
            <div className="hidden md:block max-w-xs text-xs text-white/80 italic border-l-2 border-white/20 pl-3 py-1">
              {subject.notes}
            </div>
          )}
          <div className="text-right">
            <p className="text-2xl font-bold">{Math.round(subject.readiness)}%</p>
            <p className="text-[10px] font-bold text-white/60 uppercase">Subject Mastery</p>
          </div>
        </div>
      </div>
      
      {subject.notes && (
        <div className="md:hidden px-6 pt-4 pb-2 text-xs text-white/80 italic border-l-2 border-[#1DB954] ml-6">
          {subject.notes}
        </div>
      )}

      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-center md:text-left">Syllabus Tracker</h2>
          <p className="text-gray-400 text-sm text-center md:text-left">Track your progress across the A/L Physical Science stream.</p>
        </div>
        <div className="flex items-center justify-center gap-2 md:gap-4 bg-[#181818] p-3 md:p-4 rounded-2xl border border-white/5">
          <div className="text-center px-3 md:px-4 border-r border-white/10">
            <p className="text-xl md:text-2xl font-bold text-[#1DB954]">
              {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.readiness, 0) / subjects.length) : 0}%
            </p>
            <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">Overall Readiness</p>
          </div>
          <div className="text-center px-3 md:px-4">
            <p className="text-xl md:text-2xl font-bold text-blue-500">
              {subjects.reduce((acc, s) => acc + s.topics.filter(t => t.mastery >= 80).length, 0)}
            </p>
            <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">Topics Mastered</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-8"
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
              className="relative w-full max-w-2xl bg-[#181818] rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className={cn("p-6 md:p-8 bg-gradient-to-r relative", selectedTopic.subject.gradient)}>
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5 md:mb-1">{selectedTopic.subject.name}</p>
                    <h3 className="text-xl md:text-2xl font-bold leading-tight">{selectedTopic.topic.title}</h3>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h4 className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Study Resources</h4>
                  {(!selectedTopic.topic.resources || selectedTopic.topic.resources.length === 0) ? (
                    <div className="bg-white/5 rounded-2xl p-6 md:p-8 text-center border border-dashed border-white/10">
                      <LinkIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No resources added for this topic yet.</p>
                      <p className="text-xs text-gray-600 mt-1">Add links, videos, or PDFs in the Manage tab.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedTopic.topic.resources.map(resource => (
                        <a 
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl border transition-all group",
                            resource.type === 'video' ? "border-red-500/10 hover:border-red-500/20" :
                            resource.type === 'pdf' ? "border-blue-500/10 hover:border-blue-500/20" :
                            "border-[#1DB954]/10 hover:border-[#1DB954]/20"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                            resource.type === 'video' ? "bg-red-500/10 text-red-500" :
                            resource.type === 'pdf' ? "bg-blue-500/10 text-blue-500" :
                            "bg-[#1DB954]/10 text-[#1DB954]"
                          )}>
                            {resource.type === 'video' ? <Video className="w-4 h-4 md:w-5 md:h-5" /> :
                             resource.type === 'pdf' ? <FileText className="w-4 h-4 md:w-5 md:h-5" /> :
                             <LinkIcon className="w-4 h-4 md:w-5 md:h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-bold truncate">{resource.title}</p>
                            <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold">{resource.type}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Topic Mastery</h4>
                    <span className="text-sm font-bold text-[#1DB954]">{selectedTopic.topic.mastery}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedTopic.topic.mastery}%` }}
                      className="h-full bg-[#1DB954]"
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
