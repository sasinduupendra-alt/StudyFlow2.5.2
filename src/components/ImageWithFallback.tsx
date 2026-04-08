import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackGradient?: string;
  fallbackText?: string;
  showBlur?: boolean;
}

export default function ImageWithFallback({
  src,
  alt,
  className,
  containerClassName,
  fallbackGradient = "from-gray-800 to-gray-900",
  fallbackText,
  showBlur = true
}: ImageWithFallbackProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');

  const handleLoad = () => setStatus('loaded');
  const handleError = () => setStatus('error');

  return (
    <div className={cn("relative overflow-hidden bg-white/5", containerClassName)}>
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-white/5 animate-pulse flex items-center justify-center"
          >
            <div className="w-6 h-6 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
          </motion.div>
        )}

        {status === 'error' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
              fallbackGradient
            )}
          >
            {fallbackText ? (
              <span className="text-xl font-black text-white/20 select-none uppercase tracking-tighter">
                {fallbackText}
              </span>
            ) : (
              <ImageOff className="w-1/3 h-1/3 text-white/10" />
            )}
          </motion.div>
        ) : (
          <motion.img
            key="image"
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: status === 'loaded' ? 1 : 0,
              scale: status === 'loaded' ? 1 : 1.1
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
              "w-full h-full object-cover",
              showBlur && status === 'loading' && "blur-sm",
              className
            )}
            referrerPolicy="no-referrer"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
