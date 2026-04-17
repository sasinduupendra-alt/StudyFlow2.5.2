import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface SNRVisualizerProps {
  signal: number;
  noise: number;
  className?: string;
}

export default function SNRVisualizer({ signal, noise, className }: SNRVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Draw Background Grid (Technical Style)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw Center Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const signalAmp = Math.min(height * 0.3, signal * 4);
      const noiseAmp = Math.max(2, noise * 1.5);
      const centerY = height / 2;

      // 1. Draw Noise Floor (Subtle background)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(142, 142, 147, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x++) {
        const n = (Math.random() - 0.5) * noiseAmp * 2;
        const y = centerY + n + (height * 0.3); // Offset to bottom
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Draw Clean Signal (Ghostly reference)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(10, 132, 255, 0.15)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x++) {
        const s = Math.sin((x + offset) * 0.04) * signalAmp;
        const y = centerY + s;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Draw Combined Signal (The "Real" data)
      ctx.beginPath();
      ctx.strokeStyle = '#0A84FF';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(10, 132, 255, 0.4)';
      
      for (let x = 0; x < width; x++) {
        const s = Math.sin((x + offset) * 0.04) * signalAmp;
        const n = (Math.random() - 0.5) * noiseAmp;
        const y = centerY + s + n;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw "Data Points" (Technical look)
      if (offset % 20 === 0) {
        ctx.fillStyle = '#0A84FF';
        for (let x = 0; x < width; x += 60) {
          const s = Math.sin((x + offset) * 0.04) * signalAmp;
          const n = (Math.random() - 0.5) * noiseAmp;
          ctx.beginPath();
          ctx.arc(x, centerY + s + n, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      offset += 1.5;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [signal, noise]);

  return (
    <div className={`relative bg-black/40 rounded-2xl border border-white/10 overflow-hidden ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={150} 
        className="w-full h-full"
      />
      <div className="absolute top-3 left-4 flex flex-col">
        <span className="text-[10px] font-mono text-brand uppercase tracking-widest">Neural Signal Spectrum</span>
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--color-brand-glow)]" />
            <span className="text-[9px] font-mono text-white/70 uppercase">Signal: High-Impact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-[9px] font-mono text-white/40 uppercase">Noise: Cognitive Overhead</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-3 right-4 flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-mono text-brand/50 uppercase">Sampling Rate</span>
          <span className="text-[10px] font-mono text-white/70 uppercase">60Hz / Real-time</span>
        </div>
        <div className="h-8 w-[1px] bg-white/10" />
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-mono text-brand/50 uppercase">Status</span>
          <span className="text-[10px] font-mono text-brand uppercase animate-pulse">Optimal</span>
        </div>
      </div>
    </div>
  );
}
