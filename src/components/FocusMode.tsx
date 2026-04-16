import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, RotateCcw, Zap, Volume2, VolumeX, 
  Maximize2, Minimize2, Activity, Cpu, Gauge, 
  Shield, Terminal, Layers, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { Subject } from '../types';

interface FocusModeProps {
  subject: Subject;
  session: {
    id: string;
    subjectId: string;
    topicId: string;
    elapsedSeconds: number;
    totalSeconds: number;
  };
  isPaused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  onFinish?: () => void;
}

export default function FocusMode({ subject, session, isPaused, onTogglePause, onExit, onFinish }: FocusModeProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [cognitiveLoad, setCognitiveLoad] = useState(42);
  const [retentionIndex, setRetentionIndex] = useState(88);
  const [intensity, setIntensity] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setGlitch(true);
    const timer = setTimeout(() => setGlitch(false), 150);
    return () => clearTimeout(timer);
  }, [isPaused]);

  // Simulate dynamic technical data
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCognitiveLoad(prev => Math.min(100, Math.max(20, prev + (Math.random() * 4 - 2))));
      setRetentionIndex(prev => Math.min(100, Math.max(70, prev + (Math.random() * 2 - 1))));
      setIntensity(prev => Math.min(100, prev + 0.1));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  // Neural Sync Visualization (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = 'rgba(10, 132, 255, ' + (Math.random() * 0.3 + 0.1) + ')';
      }

      update() {
        if (isPaused) return;
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      // Draw connections
      if (!isPaused) {
        ctx.strokeStyle = 'rgba(10, 132, 255, 0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleImmersive = () => {
    setIsImmersive(!isImmersive);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);
  };

  const progress = (session.elapsedSeconds / session.totalSeconds) * 100;
  const timeLeft = session.totalSeconds - session.elapsedSeconds;

  const activeTopic = subject.topics.find(t => t.id === session.topicId);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        backgroundColor: isPaused ? 'rgba(0,0,0,0.98)' : 'rgba(0,0,0,1)',
        x: glitch ? [0, -4, 4, -2, 2, 0] : 0,
        filter: glitch ? 'hue-rotate(90deg) contrast(1.2)' : 'hue-rotate(0deg) contrast(1)'
      }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none opacity-40 z-10"
      />

      {/* Background Illustration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
        <img 
          src="https://picsum.photos/seed/neural-focus/1920/1080?grayscale&blur=5" 
          className="w-full h-full object-cover"
          alt=""
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-10" />

      {/* Visual Confirmation Flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Neural Link</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-zinc-600" : "bg-brand animate-pulse shadow-[0_0_8px_var(--color-brand-glow)]")} />
              <span className="text-xs font-bold text-white uppercase tracking-widest">{isPaused ? 'Standby' : 'Active'}</span>
            </div>
          </div>
          
          {!isImmersive && (
            <div className="hidden md:flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Cognitive Load</span>
                <span className="text-xs font-bold text-white tabular-nums tracking-widest">{Math.round(cognitiveLoad)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Retention Index</span>
                <span className="text-xs font-bold text-white tabular-nums tracking-widest">{Math.round(retentionIndex)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleImmersive}
            className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 border border-white/5 transition-all group relative"
          >
            {isImmersive ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={onExit}
            className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Side HUD - Technical Readouts */}
      <AnimatePresence>
        {!isImmersive && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-12 z-40"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-brand" />
                <span className="text-[10px] font-mono text-white uppercase tracking-widest">Telemetry</span>
              </div>
              <div className="space-y-6 border-l border-white/10 pl-4">
                {[
                  { label: 'Sync Rate', value: '1.2gb/s', icon: Zap },
                  { label: 'Buffer', value: '0.04ms', icon: Cpu },
                  { label: 'Integrity', value: '99.9%', icon: Shield },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{item.label}</span>
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Gauge className="w-4 h-4 text-brand" />
                <span className="text-[10px] font-mono text-white uppercase tracking-widest">Intensity</span>
              </div>
              <div className="w-1 h-32 bg-white/5 relative">
                <motion.div 
                  animate={{ height: `${intensity}%` }}
                  className="absolute bottom-0 left-0 right-0 bg-brand shadow-[0_0_15px_var(--color-brand-glow)]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Focus Area */}
      <div className={cn(
        "relative z-10 flex flex-col items-center text-center max-w-4xl w-full transition-all duration-1000 ease-in-out",
        isImmersive ? "scale-110" : "scale-100"
      )}>
        <AnimatePresence mode="wait">
          {!isImmersive && (
            <motion.div
              key="header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-brand/10 border border-brand/30 flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-brand" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-brand uppercase">Protocol: Deep Work</span>
                </div>
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-white uppercase italic">{subject.name}</h2>
              <div className="flex items-center gap-4">
                <div className="w-8 h-[1px] bg-brand" />
                <p className="text-xs md:text-sm font-mono font-bold text-zinc-500 uppercase tracking-[0.4em]">{activeTopic?.title || 'Neural Sync'}</p>
                <div className="w-8 h-[1px] bg-brand" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "relative mb-12 transition-all duration-1000 ease-in-out flex items-center justify-center",
          isImmersive ? "w-80 h-80 md:w-[600px] md:h-[600px]" : "w-64 h-64 md:w-96 md:h-96"
        )}>
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none z-20 opacity-20" />
          
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-white/5"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="48%"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="100 100"
              strokeDashoffset={100 - progress}
              pathLength="100"
              className={cn("text-brand transition-all duration-1000", !isPaused && "drop-shadow-[0_0_15px_var(--color-brand-glow)]")}
            />
            
            {/* Milestone Markers */}
            {[25, 50, 75].map(m => (
              <circle
                key={m}
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke={progress >= m ? "var(--color-brand)" : "rgba(255,255,255,0.1)"}
                strokeWidth="4"
                strokeDasharray="0.5 99.5"
                strokeDashoffset={-m}
                pathLength="100"
                className="transition-colors duration-500"
              />
            ))}
          </svg>

          <div className="flex flex-col items-center justify-center z-10">
            <motion.span 
              layout
              className={cn(
                "font-black tabular-nums tracking-tighter transition-all duration-1000 ease-in-out italic",
                isImmersive ? "text-9xl md:text-[220px] leading-none text-white" : "text-7xl md:text-9xl text-white"
              )}
            >
              {formatTime(timeLeft)}
            </motion.span>
            
            <AnimatePresence>
              {!isImmersive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center mt-4"
                >
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.5em]">Remaining Time</span>
                  <div className="flex items-center gap-3 mt-6">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isPaused ? "bg-zinc-600" : "bg-brand animate-ping")} />
                    <span className="text-[9px] font-mono font-bold text-brand uppercase tracking-[0.3em]">{isPaused ? 'Paused' : 'Synchronizing'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className={cn(
          "flex items-center gap-12 transition-all duration-700",
          isImmersive ? "mt-16" : "mt-4"
        )}>
          <button 
            className={cn(
              "p-4 text-zinc-500 hover:text-white transition-all border border-white/5 hover:bg-white/5",
              isImmersive && "opacity-20 hover:opacity-100"
            )}
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          <button 
            onClick={onTogglePause}
            className={cn(
              "w-24 h-24 flex items-center justify-center transition-all relative group",
              isPaused ? "bg-white text-black" : "bg-brand text-white shadow-[0_0_30px_var(--color-brand-glow)]"
            )}
          >
            <div className="absolute inset-0 border border-white/20 scale-110 group-hover:scale-125 transition-transform" />
            {!isPaused ? (
              <Pause className="w-10 h-10 fill-current" />
            ) : (
              <Play className="w-10 h-10 fill-current ml-1" />
            )}
          </button>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-4 text-zinc-500 hover:text-white transition-all border border-white/5 hover:bg-white/5",
              isImmersive && "opacity-20 hover:opacity-100"
            )}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>

        {/* Footer Stats */}
        <AnimatePresence>
          {!isImmersive && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-20 grid grid-cols-3 gap-12 w-full max-w-2xl"
            >
              <div className="p-6 border border-white/5 bg-white/5 flex flex-col gap-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Elapsed</span>
                <span className="text-2xl font-black text-white italic">{Math.floor(session.elapsedSeconds / 60)}m</span>
              </div>
              <div className="p-6 border border-white/5 bg-white/5 flex flex-col gap-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Progress</span>
                <span className="text-2xl font-black text-white italic">{Math.floor(progress)}%</span>
              </div>
              <div className="p-6 border border-white/5 bg-white/5 flex flex-col gap-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">State</span>
                <span className={cn(
                  "text-2xl font-black italic transition-colors duration-500",
                  isPaused ? "text-zinc-500" : progress > 75 ? "text-brand" : "text-white"
                )}>
                  {isPaused ? 'IDLE' : progress > 75 ? 'DEEP' : 'INIT'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Immersive HUD Overlay */}
      <AnimatePresence>
        {isImmersive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            <div className="absolute bottom-12 left-12 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-brand" />
                <span className="text-[10px] font-mono text-white uppercase tracking-[0.4em]">Neural Overlay Active</span>
              </div>
              <div className="w-48 h-[1px] bg-brand/30" />
            </div>
            
            <div className="absolute bottom-12 right-12 flex flex-col items-end gap-2">
              <span className="text-[10px] font-mono text-brand uppercase tracking-[0.4em]">Optimizing Retention</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    className="w-1 h-3 bg-brand"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
