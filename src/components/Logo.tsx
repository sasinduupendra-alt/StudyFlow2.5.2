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
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
        
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <radialGradient id="aura" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#1DB954" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Background Aura */}
      <circle cx="12" cy="12" r="10" fill="url(#aura)" />

      {/* Outer Ring / Flow */}
      <motion.circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="url(#logo-gradient)" 
        strokeWidth="1" 
        strokeDasharray="4 2"
        className="opacity-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* The "S" Flow Path - Enhanced for more "flow" */}
      <motion.path
        d="M7 8C7 8 9 6.5 12 6.5C15 6.5 17 8 17 11C17 14 14.5 14.5 12 14.5C9.5 14.5 7 15 7 18C7 21 9 22 12 22C15 22 17 20.5 17 20.5"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* Play / Focus Indicator - Centered and more prominent */}
      <motion.path
        d="M10.5 10.5L14.5 12.5L10.5 14.5V10.5Z"
        fill="#1DB954"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5, type: "spring" }}
      />
      
      {/* Sparkle / Insight - Multiple sparkles for a "flow" feel */}
      <motion.circle 
        cx="18" 
        cy="6" 
        r="1.2" 
        fill="#1DB954" 
        animate={{ 
          scale: [1, 1.5, 1], 
          opacity: [0.3, 1, 0.3],
          y: [0, -2, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle 
        cx="6" 
        cy="18" 
        r="0.8" 
        fill="#1DB954" 
        animate={{ 
          scale: [1, 1.3, 1], 
          opacity: [0.2, 0.8, 0.2],
          y: [0, 2, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </svg>
  );
}
