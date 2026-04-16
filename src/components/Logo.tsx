import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className, size = 24 }: LogoProps) {
  const brandColor = "#0A84FF";
  const accentColor = "#5E5CE6";
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={brandColor} />
          <stop offset="100%" stopColor={accentColor} />
        </linearGradient>
      </defs>

      {/* Sharp High-Tech "S" Flow - Inspired by SpaceX/Tesla */}
      <motion.path
        d="M4 18L10 12L4 6H14L20 12L14 18H4Z"
        fill="url(#logo-grad)"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
      />
      
      <motion.path
        d="M20 6L14 12L20 18"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="square"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />

      {/* Speed Lines */}
      <motion.path
        d="M2 12H6"
        stroke="url(#logo-grad)"
        strokeWidth="1"
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 0.5 }}
        transition={{ delay: 1, duration: 0.5 }}
      />
    </svg>
  );
}
