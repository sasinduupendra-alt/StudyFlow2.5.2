import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFocus } from '../lib/focus-context';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { X, Shield, Lock, Wind, BellOff, Play, Pause, Zap, AlertCircle, LogOut, ChevronRight, Activity, Cpu } from 'lucide-react';
import { toast } from 'sonner';

const FocusParticles: React.FC<{ focusLevel: number; isPaused: boolean; interruptions: number }> = ({ focusLevel, isPaused, interruptions }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const particleCount = Math.floor(focusLevel / 1.5);

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2,
          alpha: Math.random() * 0.5,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const speedFactor = isPaused ? 0.1 : (focusLevel / 100) * 2;
      const color = focusLevel > 80 ? '10, 132, 255' : focusLevel > 50 ? '234, 179, 8' : '239, 68, 68';

      particles.forEach((p, i) => {
        if (!isPaused) {
          // Gravitate towards center
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = 0.00001 * focusLevel;
          
          p.vx += dx * force;
          p.vy += dy * force;
        }

        p.x += p.vx * speedFactor;
        p.y += p.vy * speedFactor;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.fill();
        
        // Connect nearby particles if focus is high
        if (focusLevel > 90 && i % 4 === 0) {
          particles.slice(i + 1, i + 10).forEach(other => {
            const dx = p.x - other.x;
            const dy = p.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - dist / 100)})`;
              ctx.stroke();
            }
          });
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener('resize', init);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', init);
    };
  }, [focusLevel, isPaused]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-40" />;
};

export const FocusMode: React.FC = () => {
  const { currentSession, endSession, updateNotes, interruptionOccurred, clearSession } = useFocus();
  const isPaused = useAppStore(state => state.isPaused);
  const setIsPaused = useAppStore(state => state.setIsPaused);
  
  const [notes, setNotes] = useState(currentSession?.notes || '');
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [batchedNotifications, setBatchedNotifications] = useState<string[]>([]);
  const [interruptionWarnings, setInterruptionWarnings] = useState(0);

  const timeLeft = Math.max(0, (currentSession?.duration || 0) - (currentSession?.elapsedSeconds || 0));

  useEffect(() => {
    // Simulate incoming notifications being "held"
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && !isPaused) {
        const msgs = ["System: Study schedule updated", "Review: Algebra topics ready", "Engine: Efficiency peak reached"];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        setBatchedNotifications(prev => [...prev, msg]);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Flow Shield logic
  useEffect(() => {
    const handleBlur = () => {
      if (isShieldActive && !isPaused) {
        setInterruptionWarnings(prev => {
          const next = prev + 1;
          if (next === 2) toast.warning("Stay focused?");
          if (next === 3) toast.error("Flow dropping ⚠️", { description: "You are being distracted." });
          if (next >= 3) interruptionOccurred();
          return next;
        });
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isShieldActive, interruptionOccurred, isPaused]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  const progress = currentSession?.duration 
    ? ((currentSession.elapsedSeconds || 0) / currentSession.duration) * 100 
    : 0;

  const focusLevel = currentSession?.focusScore || 100;
  const interruptions = currentSession?.interruptions || 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#020202] z-50 flex flex-col overflow-hidden font-sans text-zinc-100"
    >
      <FocusParticles focusLevel={focusLevel} isPaused={isPaused} interruptions={interruptions} />

      {/* Atmospheric Breathing Light */}
      <motion.div 
        animate={{ 
          opacity: isPaused ? 0.05 : [0.1, 0.15, 0.1],
          scale: isPaused ? 1 : [1, 1.1, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 -z-10 pointer-events-none"
      >
        <div className={cn(
          "absolute inset-0 transition-colors duration-2000",
          focusLevel > 80 ? "bg-[radial-gradient(circle_at_50%_50%,rgba(10,132,255,0.2),transparent_70%)]" :
          focusLevel > 50 ? "bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.15),transparent_70%)]" :
          "bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.15),transparent_70%)]"
        )} />
      </motion.div>

      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-50" />
      <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-brand/10 to-transparent opacity-30" />

      <header className="p-10 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-8">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col"
          >
            <div className="text-brand font-mono text-[9px] uppercase tracking-[0.5em] flex items-center gap-2 mb-2">
              <div className="relative">
                <Shield className="w-3.5 h-3.5" />
                {!isPaused && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-brand rounded-full -z-10" />}
              </div>
              Vanguard Protocol // Deployment: Active
            </div>
            <div className="flex items-baseline gap-4">
              <h1 className="text-2xl font-light tracking-tight text-white/90">
                {currentSession?.task}
              </h1>
              <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                <Cpu className="w-3 h-3 text-zinc-500" />
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Instance.01</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-6">
          <AnimatePresence>
            {batchedNotifications.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="flex items-center gap-3 bg-brand/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-brand/20 shadow-[0_0_20px_rgba(10,132,255,0.1)]"
              >
                <div className="relative">
                  <BellOff className="w-3.5 h-3.5 text-brand" />
                  <motion.div animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-brand rounded-full -z-10" />
                </div>
                <span className="text-[10px] text-brand uppercase tracking-[0.2em] font-black">
                  {batchedNotifications.length} Signal{batchedNotifications.length > 1 ? 's' : ''} Buffered
                </span>
                <ChevronRight className="w-3 h-3 text-brand/40" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-8 px-8 py-3 bg-zinc-900/40 rounded-3xl border border-white/5 backdrop-blur-2xl shadow-inner">
             <div className="flex flex-col items-center gap-0.5">
                <span className="text-[7px] text-zinc-600 uppercase tracking-[0.3em] font-black">Cohesion</span>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-lg font-mono font-bold tracking-tighter", focusLevel > 80 ? "text-brand" : focusLevel > 50 ? "text-yellow-500" : "text-red-500")}>
                    {focusLevel}
                  </span>
                  <span className="text-[8px] text-zinc-700 font-mono">%</span>
                </div>
             </div>
             <div className="w-px h-8 bg-zinc-800/50" />
             <div className="flex flex-col items-center gap-0.5">
                <span className="text-[7px] text-zinc-600 uppercase tracking-[0.3em] font-black">Entropy</span>
                <span className={cn("text-lg font-mono font-bold tracking-tighter", interruptions === 0 ? "text-zinc-500" : "text-red-500")}>
                   {interruptions.toString().padStart(2, '0')}
                </span>
             </div>
             <div className="w-px h-8 bg-zinc-800/50" />
             <div className="flex flex-col items-center gap-0.5">
                <span className="text-[7px] text-zinc-600 uppercase tracking-[0.3em] font-black">Stability</span>
                <Activity className={cn("w-4 h-4 mt-1", isPaused ? "text-yellow-500/50" : "text-brand animate-pulse")} />
             </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
               if (confirm("Deactivate Protocol? Current buffer will be cleared.")) {
                  clearSession();
               }
            }}
            className="w-12 h-12 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all border border-transparent hover:border-red-500/20"
            title="Deactivate Protocol"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-24 items-center">
          
          {/* Progress Section */}
          <div className="flex flex-col items-center space-y-20">
            <div className="relative w-[420px] h-[420px] flex items-center justify-center group select-none">
               {/* Decorative background circle */}
               <div className="absolute inset-0 bg-brand/5 rounded-full blur-[100px] opacity-20 pointer-events-none" />
               
               {/* Pulse waves */}
               {!isPaused && (
                 <motion.div 
                   animate={{ scale: [1, 1.4, 1.2], opacity: [0.3, 0, 0.3] }}
                   transition={{ duration: 3, repeat: Infinity }}
                   className="absolute inset-0 border border-brand/20 rounded-full pointer-events-none"
                 />
               )}

               {/* Outer ring */}
              <svg className="w-full h-full -rotate-90 absolute inset-0">
                <defs>
                  <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(10, 132, 255)" />
                    <stop offset="100%" stopColor="rgb(88, 86, 214)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="210"
                  cy="210"
                  r="200"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="transparent"
                  className="text-zinc-900/50"
                  strokeDasharray="4 4"
                />
                <motion.circle
                  cx="210"
                  cy="210"
                  r="200"
                  stroke="url(#brand-grad)"
                  strokeWidth={isPaused ? 2 : 4}
                  fill="transparent"
                  strokeDasharray="1257"
                  animate={{ 
                    strokeDashoffset: 1257 - (1257 * progress) / 100,
                    opacity: isPaused ? 0.3 : 0.8
                  }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_15px_rgba(10,132,255,0.4)]"
                />
              </svg>

              {/* Inner Focus Score Ring */}
              <svg className="w-[88%] h-[88%] -rotate-90 absolute">
                <circle
                  cx="185"
                  cy="185"
                  r="175"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="transparent"
                  className="text-white/5"
                  strokeDasharray="2 6"
                />
                <motion.circle
                  cx="185"
                  cy="185"
                  r="175"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="1099"
                  initial={{ strokeDashoffset: 1099 }}
                  animate={{ strokeDashoffset: 1099 - (1099 * focusLevel) / 100 }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className={cn(
                     "transition-colors duration-2000 opacity-20",
                     focusLevel > 80 ? "text-brand" : focusLevel > 50 ? "text-yellow-500" : "text-red-500"
                  )}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div 
                   animate={{ scale: isPaused ? 0.98 : 1 }}
                   className="text-9xl font-black text-white font-mono tracking-tighter flex items-baseline gap-1"
                >
                  <span className="drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {formatTime(timeLeft)}
                  </span>
                  <motion.span 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-2xl text-zinc-700"
                  >
                    :
                  </motion.span>
                </motion.div>
                
                <div className="flex flex-col items-center gap-4 mt-8">
                   <div className="flex items-center gap-3 px-6 py-2 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-md">
                      <div className={cn("w-1.5 h-1.5 rounded-full", isPaused ? "bg-yellow-500" : "bg-brand animate-ping")} />
                      <span className="text-[10px] text-zinc-500 uppercase tracking-[0.5em] font-black">
                        {isPaused ? 'Engine: Suspended' : 'Flow: Locked'}
                      </span>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-12">
               <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPaused(!isPaused)}
                  className={cn(
                     "w-24 h-24 rounded-full border flex items-center justify-center transition-all duration-700 group relative overflow-hidden",
                     isPaused 
                        ? "bg-brand text-white border-brand shadow-[0_0_40px_rgba(10,132,255,0.4)]" 
                        : "bg-zinc-900/40 text-zinc-500 border-white/10 hover:border-brand/40 hover:text-brand backdrop-blur-xl shadow-2xl"
                  )}
               >
                  <div className="scan-line-v opacity-0 group-hover:opacity-100 transition-opacity" />
                  <AnimatePresence mode="wait">
                     {isPaused ? (
                        <motion.div key="play" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                           <Play className="w-10 h-10 fill-current" />
                        </motion.div>
                     ) : (
                        <motion.div key="pause" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                           <Pause className="w-10 h-10 fill-current" />
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.button>

               <div className="h-12 w-px bg-zinc-800/50" />

               <div className="flex gap-4">
                  <motion.button
                    whileHover={{ border: "1px solid rgba(10,132,255,0.4)" }}
                    onClick={() => setIsShieldActive(!isShieldActive)}
                    className={cn(
                      "flex items-center gap-4 px-8 py-4 rounded-[28px] border-2 transition-all duration-700 backdrop-blur-xl",
                      isShieldActive ? "bg-brand/10 border-brand/30 text-brand shadow-[0_0_30px_rgba(10,132,255,0.15)]" : "bg-white/[0.02] border-white/5 text-zinc-600"
                    )}
                  >
                    <div className="relative">
                      <Shield className="w-5 h-5" />
                      {isShieldActive && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-brand rounded-full -z-10" />}
                    </div>
                    <div className="flex flex-col items-start">
                       <span className="text-[10px] uppercase font-black tracking-[0.2em]">Flow Shield</span>
                       <span className="text-[9px] font-mono opacity-60 tracking-widest">{isShieldActive ? 'ENFORCED' : 'OFFLINE'}</span>
                    </div>
                  </motion.button>
                  
                  <div className="flex items-center gap-4 px-8 py-4 rounded-[28px] bg-zinc-900/50 border-2 border-white/5 text-zinc-400 backdrop-blur-xl">
                    <Zap className={cn("w-5 h-5", focusLevel > 80 ? "text-brand" : "text-zinc-700")} />
                    <div className="flex flex-col items-start leading-tight">
                       <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-600">Cognitive Output</span>
                       <span className="text-[14px] font-mono font-bold text-zinc-300">{focusLevel}%</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Notes Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full space-y-10"
          >
            <div className="flex items-center justify-between px-4">
               <div className="flex items-center gap-4 text-zinc-500">
                  <Cpu className="w-5 h-5" />
                  <h3 className="text-xs uppercase tracking-[0.4em] font-black">Neural.Buffer.Stream</h3>
               </div>
               <div className="flex gap-2">
                 {isPaused && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full"
                    >
                       <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                       <span className="text-[9px] text-yellow-500 uppercase font-black tracking-widest">Buffer Sync Halted</span>
                    </motion.div>
                 )}
                 <div className="px-4 py-1.5 bg-zinc-900 border border-white/5 rounded-full flex items-center gap-2 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                    Secure Link Ready
                 </div>
               </div>
            </div>
            
            <div className="relative group/notes">
               <div className="absolute inset-0 bg-brand/5 blur-[120px] opacity-0 group-focus-within/notes:opacity-100 transition-all duration-2000 pointer-events-none" />
               <div className="scan-line absolute top-0 left-0 right-0 h-px bg-brand/10 z-20 pointer-events-none group-focus-within/notes:bg-brand/30" />
               
               <Textarea 
                  value={notes}
                  onChange={(e) => {
                     setNotes(e.target.value);
                     updateNotes(e.target.value);
                  }}
                  placeholder="Capture architectural fragments, high-entropy insights, or mission-critical blockers..."
                  className="relative z-10 w-full bg-[#050505] border-white/5 border-2 text-zinc-100 resize-none px-12 py-14 text-2xl font-light tracking-tight leading-relaxed focus-visible:ring-brand/20 focus-visible:border-brand/40 rounded-[60px] min-h-[520px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-all duration-1000 scrollbar-hide placeholder:text-zinc-800 placeholder:italic"
               />
               
               <div className="absolute bottom-12 right-12 z-20 flex flex-col items-end gap-3 select-none">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-zinc-700 font-mono uppercase tracking-[0.3em] font-black mb-1">Data Volume</span>
                    <span className="text-[12px] text-zinc-500 font-mono font-bold">{(notes.length * 0.001).toFixed(2)} KB</span>
                  </div>
                  <div className="w-40 h-1 bg-zinc-900/50 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, notes.length / 20)}%` }}
                        className="h-full bg-gradient-to-r from-brand to-brand/50"
                      />
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-center p-8 bg-zinc-900/40 rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl">
               <div className="grid grid-cols-2 gap-12">
                  <div className="flex flex-col gap-1">
                     <span className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.3em]">Protocol Hash</span>
                     <span className="text-zinc-300 font-mono text-xs font-bold truncate max-w-[120px]">{currentSession?.id}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.3em]">Temporal Scope</span>
                     <span className="text-zinc-300 font-mono text-xs font-bold">{Math.floor((currentSession?.duration || 0) / 60)}m Burst</span>
                  </div>
               </div>
               <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: "white", color: "black", boxShadow: "0 0 30px rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => endSession()}
                  className="px-8 py-4 bg-white/5 border border-white/10 text-zinc-400 transition-all duration-500 rounded-full text-[11px] uppercase font-black tracking-[0.4em] flex items-center gap-3"
               >
                  <Activity className="w-4 h-4" />
                  Extract Phase
                  <ChevronRight className="w-4 h-4 opacity-50" />
               </motion.button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
    </motion.div>
  );
};
