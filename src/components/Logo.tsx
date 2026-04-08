import React from 'react';
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
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      
      {/* Dynamic Flow Paths */}
      <path
        d="M4 12C4 12 7 9 12 9C17 9 20 12 20 12"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M4 16C4 16 7 13 12 13C17 13 20 16 20 16"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="opacity-60"
      />
      <path
        d="M4 8C4 8 7 5 12 5C17 5 20 8 20 8"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="opacity-30"
      />
      
      {/* Play / Forward Indicator */}
      <path
        d="M11 18L14 20L11 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-20"
      />
      
      {/* Central Focus Point */}
      <circle cx="12" cy="11" r="1.5" fill="currentColor" className="opacity-80" />
    </svg>
  );
}
