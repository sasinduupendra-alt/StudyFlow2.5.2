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
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="scifi-panel-sm p-4 group cursor-pointer transition-all duration-500 hover:bg-white/5"
      onClick={onStartFocus}
    >
      <div className="relative aspect-square mb-4 overflow-hidden bg-surface border border-border-dim group-hover:border-brand/30 transition-colors">
        <ImageWithFallback
          src={topic.image}
          alt={topic.title}
          containerClassName="w-full h-full"
          className="opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-1000 ease-out"
          fallbackText={topic.title[0]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-brand/10 backdrop-blur-sm transition-all"
        >
          <Play className="w-8 h-8 text-brand fill-current" />
        </motion.div>

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {topic.mastery >= 80 && (
            <div className="p-1 bg-brand shadow-[0_0_10px_var(--color-brand-glow)]">
              <CheckCircle2 className="w-3 h-3 text-black" />
            </div>
          )}
          {topic.resources && topic.resources.length > 0 && (
            <div className="bg-black/60 border border-white/10 flex items-center gap-1 px-1.5 py-0.5">
              <LinkIcon className="w-2.5 h-2.5 text-brand" />
              <span className="text-[8px] font-black text-white tabular-nums">{topic.resources.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[60px]">
        <h4 className="font-black text-[11px] mb-1 line-clamp-1 group-hover:text-brand transition-colors uppercase tracking-tight">{topic.title}</h4>
        <p className="hud-label !text-gray-600 line-clamp-1">{subjectName}</p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="hud-label">MASTERY_LVL</span>
          <span className="text-[10px] font-black tabular-nums">{topic.mastery}%</span>
        </div>
        <div className="h-[2px] bg-white/5 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${topic.mastery}%` }}
            transition={{ duration: 1.2, delay: 0.2, ease: "circOut" }}
            className="h-full bg-brand shadow-[0_0_5px_var(--color-brand-glow)]"
          />
        </div>
      </div>
    </motion.div>
  );
});

export default TopicCard;

