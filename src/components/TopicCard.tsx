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
      className="bg-[#1C1C1E] border border-white/5 shadow-sm rounded-[24px] p-4 group cursor-pointer relative overflow-hidden"
      onClick={onStartFocus}
    >
      <div className="relative aspect-video mb-4 overflow-hidden rounded-2xl bg-[#2C2C2E] border border-white/5 group-hover:border-white/10 transition-colors">
        <ImageWithFallback
          src={topic.image}
          alt={topic.title}
          containerClassName="w-full h-full"
          className="opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 ease-out"
          fallbackText={topic.title[0]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-black fill-current ml-1" />
          </div>
        </motion.div>

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {topic.mastery >= 80 && (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-4 h-4 text-[#32D74B]" />
            </div>
          )}
          {topic.resources && topic.resources.length > 0 && (
            <div className="bg-black/60 backdrop-blur-md flex items-center gap-1.5 px-2.5 py-1 rounded-full">
              <LinkIcon className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">{topic.resources.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[48px] mb-4">
        <h4 className="font-semibold text-base text-white mb-1 line-clamp-1 tracking-tight">{topic.title}</h4>
        <p className="text-sm text-[#8E8E93] line-clamp-1">{subjectName}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#8E8E93]">Mastery</span>
          <span className="text-xs font-semibold text-white">{topic.mastery}%</span>
        </div>
        <div className="h-1.5 bg-[#2C2C2E] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${topic.mastery}%` }}
            transition={{ duration: 1.2, delay: 0.2, ease: "circOut" }}
            className="h-full bg-brand rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
});

export default TopicCard;

