import React from 'react';
import { Play, MoreHorizontal, CheckCircle2, Clock, Link as LinkIcon } from 'lucide-react';
import { Topic } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import ImageWithFallback from './ImageWithFallback';

interface TopicCardProps {
  topic: Topic;
  subjectName: string;
  onStartFocus: () => void;
}

export const TopicCard = React.memo(({ topic, subjectName, onStartFocus }: TopicCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="enterprise-card p-4 group cursor-pointer relative overflow-hidden"
      onClick={onStartFocus}
    >
      <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative aspect-video mb-4 overflow-hidden rounded-none bg-transparent border border-white/10 group-hover:border-white/30 transition-colors">
        <ImageWithFallback
          src={topic.image}
          alt={topic.title}
          containerClassName="w-full h-full"
          className="opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 ease-out"
          fallbackText={topic.title[0]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-[2px] transition-all"
        >
          <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <Play className="w-4 h-4 text-black fill-current ml-0.5" />
          </div>
        </motion.div>

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {topic.mastery >= 80 && (
            <div className="w-6 h-6 rounded-none bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
            </div>
          )}
          {topic.resources && topic.resources.length > 0 && (
            <div className="bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1.5 px-2 py-1 rounded-none">
              <LinkIcon className="w-3 h-3 text-white" />
              <span className="text-[10px] font-mono text-white tabular-nums">{topic.resources.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[48px] mb-4">
        <h4 className="font-mono text-xs text-white mb-1 line-clamp-1 uppercase tracking-[0.15em] group-hover:text-white transition-colors">{topic.title}</h4>
        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] line-clamp-1">{subjectName}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Mastery</span>
          <span className="text-[9px] font-mono text-white tabular-nums tracking-tighter">{topic.mastery}%</span>
        </div>
        <div className="h-[2px] bg-white/5 rounded-none overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${topic.mastery}%` }}
            transition={{ duration: 1.2, delay: 0.2, ease: "circOut" }}
            className="h-full bg-white rounded-none"
          />
        </div>
      </div>
    </motion.div>
  );
});

export default TopicCard;

