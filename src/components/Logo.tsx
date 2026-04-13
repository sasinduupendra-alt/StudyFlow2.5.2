import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className, size = 24 }: LogoProps) {
  const brandColor = "#00e5ff";
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand", className)}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={brandColor} stopOpacity="1" />
          <stop offset="50%" stopColor="#80f2ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor={brandColor} stopOpacity="0.7" />
        </linearGradient>
        
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <radialGradient id="logo-aura" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor={brandColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={brandColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Background Aura */}
      <circle cx="12" cy="12" r="10" fill="url(#logo-aura)" />

      {/* Outer Hexagon / Neural Frame */}
      <motion.path
        d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
        stroke={brandColor}
        strokeWidth="0.5"
        strokeDasharray="2 2"
        className="opacity-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Neural Pathways */}
      <motion.path
        d="M7 8C7 8 9 6.5 12 6.5C15 6.5 17 8 17 11C17 14 14.5 14.5 12 14.5C9.5 14.5 7 15 7 18C7 21 9 22 12 22"
        stroke="url(#logo-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#logo-glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Central Core / Synapse */}
      <motion.circle
        cx="12"
        cy="12"
        r="2.5"
        fill={brandColor}
        filter="url(#logo-glow)"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
          boxShadow: ["0 0 10px #00e5ff", "0 0 20px #00e5ff", "0 0 10px #00e5ff"]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Data Nodes */}
      <motion.circle 
        cx="17" 
        cy="11" 
        r="1" 
        fill="#ffffff" 
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle 
        cx="7" 
        cy="18" 
        r="0.8" 
        fill="#ffffff" 
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
      />
      
      {/* Orbital Ring */}
      <motion.circle
        cx="12"
        cy="12"
        r="6"
        stroke={brandColor}
        strokeWidth="0.25"
        strokeDasharray="1 4"
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Scan Line Effect */}
      <motion.rect
        x="2"
        y="2"
        width="20"
        height="0.5"
        fill={brandColor}
        className="opacity-40"
        animate={{
          y: [0, 20, 0],
          opacity: [0, 0.4, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </svg>
  );
}
