import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StreamingUIProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

export default function StreamingUI({ content, isStreaming, className }: StreamingUIProps) {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    setDisplayedContent(content);
  }, [content]);

  return (
    <div className={cn("relative group", className)}>
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-8 left-0 flex items-center gap-2 text-[#1DB954] text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            AI is thinking...
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "bg-[#181818] rounded-2xl p-6 border border-white/5 transition-all duration-500",
        isStreaming ? "border-[#1DB954]/30 shadow-[0_0_30px_rgba(29,185,84,0.1)]" : "hover:border-white/10"
      )}>
        <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-[#1DB954] prose-code:text-[#1DB954] prose-code:bg-[#1DB954]/10 prose-code:px-1 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
          <ReactMarkdown>{displayedContent || (isStreaming ? '...' : 'No content generated yet.')}</ReactMarkdown>
        </div>
        
        {isStreaming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex justify-end"
          >
            <Loader2 className="w-4 h-4 text-[#1DB954] animate-spin" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
