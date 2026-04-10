import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-black", className)}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Outer Ring / Flow */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="url(#logo-gradient)" 
        strokeWidth="1.5" 
        strokeDasharray="3 2"
        className="opacity-20"
      />
      
      {/* The "S" Flow Path */}
      <motion.path
        d="M8 8C8 8 10 7 12 7C14 7 16 8 16 8C16 8 17 9 17 11C17 13 15 14 12 14C9 14 7 15 7 17C7 19 8 20 8 20"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      {/* Play / Focus Indicator */}
      <path
        d="M11 11.5L14 13L11 14.5V11.5Z"
        fill="currentColor"
        className="text-[#1DB954]"
      />
      
      {/* Sparkle / Insight */}
      <motion.circle 
        cx="17" 
        cy="7" 
        r="1.5" 
        fill="#1DB954" 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}
