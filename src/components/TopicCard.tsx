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
      whileHover={{ y: -10, scale: 1.02, backgroundColor: '#282828' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group bg-[#181818] p-4 rounded-xl transition-all duration-500 relative hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-transparent hover:border-white/10 cursor-pointer"
    >
      <div className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-2xl bg-[#121212]">
        <ImageWithFallback
          src={topic.image}
          alt={topic.title}
          containerClassName="w-full h-full"
          className="opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out"
          fallbackText={topic.title[0]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        {/* Aesthetic Glass Overlay */}
        <div className="absolute inset-0 border border-white/5 rounded-lg pointer-events-none group-hover:border-white/10 transition-colors" />
        
        <motion.button 
          onClick={(e) => {
            e.stopPropagation();
            onStartFocus();
          }}
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute bottom-3 right-3 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(29,185,84,0.4)] md:translate-y-12 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10"
        >
          <Play className="w-6 h-6 text-black fill-current ml-1" />
        </motion.button>

        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {topic.mastery >= 80 && (
            <div className="p-1.5 bg-[#1DB954] rounded-full shadow-lg">
              <CheckCircle2 className="w-3 h-3 text-black" />
            </div>
          )}
          {topic.resources && topic.resources.length > 0 && (
            <div className="p-1.5 bg-black/40 backdrop-blur-md rounded-full shadow-lg flex items-center gap-1 px-2">
              <LinkIcon className="w-3 h-3 text-[#1DB954]" />
              <span className="text-[10px] font-bold text-white">{topic.resources.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[60px]">
        <h4 className="font-bold text-xs md:text-sm mb-1 line-clamp-1 group-hover:text-[#1DB954] transition-colors">{topic.title}</h4>
        <p className="text-[10px] md:text-xs text-gray-400 line-clamp-1">{subjectName}</p>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
          <span>Mastery</span>
          <span>{topic.mastery}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${topic.mastery}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-full bg-[#1DB954]" 
          />
        </div>
      </div>

      <button className="absolute top-4 right-4 p-2 text-white/0 group-hover:text-white transition-colors">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </motion.div>
  );
});

export default TopicCard;

