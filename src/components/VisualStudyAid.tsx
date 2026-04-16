import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Zap, Download, RefreshCw, Maximize2, Layers, Cpu, Activity, Key, ExternalLink } from 'lucide-react';
import { generateStudyImage } from '../services/gemini';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function VisualStudyAid() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const { addToast } = useAppStore();

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const aspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
  const sizes = ['1K', '2K', '4K'];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    if (!hasApiKey && window.aistudio) {
      addToast('API Key Required for High-Quality Synthesis', 'error');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateStudyImage(prompt, aspectRatio, imageSize);
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        addToast('Neural Visualization Synthesized', 'success');
      } else {
        addToast('Synthesis Failed: Neural link disrupted', 'error');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      if (error.message?.includes('403') || error.message?.includes('permission')) {
        setHasApiKey(false);
        addToast('Permission Denied: Please select a valid API key', 'error');
      } else {
        addToast('Critical Error: Visualization engine failure', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `studyflow-visualization-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-10">
      <div className="relative">
        <div className="absolute -left-10 top-0 bottom-0 w-1 bg-brand/20" />
        <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
          <Layers className="w-10 h-10 text-brand" />
          Neural Visualization
        </h2>
        <p className="text-zinc-500 mt-2 text-xs font-mono font-bold uppercase tracking-widest">Synthesize high-fidelity study diagrams and conceptual illustrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-black border border-white/10 p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -mr-16 -mt-16" />
            
            <div className="space-y-4 relative z-10">
              <label className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em]">Visualization Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the technical concept (e.g., 'A neural network architecture diagram with glowing nodes')..."
                className="w-full bg-zinc-900/30 border border-white/10 rounded-none px-6 py-6 h-40 text-white font-mono font-bold focus:border-brand outline-none resize-none transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-4 relative z-10">
              <label className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em]">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {aspectRatios.map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={cn(
                      "py-2 text-[10px] font-mono font-bold border transition-all",
                      aspectRatio === ratio 
                        ? "bg-brand text-white border-brand" 
                        : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20"
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <label className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em]">Output Resolution</label>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={cn(
                      "py-2 text-[10px] font-mono font-bold border transition-all",
                      imageSize === size 
                        ? "bg-white text-black border-white" 
                        : "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-5 bg-brand text-white rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all disabled:opacity-20 relative group"
            >
              <div className="absolute inset-0 border border-white/20 scale-105 opacity-0 group-hover:opacity-100 transition-all" />
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {isGenerating ? 'Synthesizing...' : 'Initialize Synthesis'}
            </button>

            {!hasApiKey && window.aistudio && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-brand/10 border border-brand/30 space-y-4"
              >
                <div className="flex items-center gap-3 text-brand">
                  <Key className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">API Key Required</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  High-quality image synthesis requires a paid Gemini API key. Please select a key from a billing-enabled project.
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleSelectKey}
                    className="w-full py-3 bg-brand text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    Select API Key
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-[9px] text-zinc-500 hover:text-white transition-colors uppercase font-mono"
                  >
                    Billing Docs <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-black border border-white/10 h-full min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%] pointer-events-none z-20 opacity-20" />
            
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="w-20 h-20 border-2 border-brand/20 border-t-brand animate-spin rounded-none" />
                  <div className="text-center space-y-2">
                    <p className="text-xs font-mono font-bold text-brand uppercase tracking-[0.3em] animate-pulse">Neural Rendering in Progress</p>
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Allocating GPU Clusters...</p>
                  </div>
                </motion.div>
              ) : generatedImage ? (
                <motion.div 
                  key="image"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-full p-8 flex items-center justify-center"
                >
                  <img 
                    src={generatedImage} 
                    alt="Neural Visualization" 
                    className="max-w-full max-h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                  />
                  <div className="absolute bottom-12 right-12 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={handleDownload}
                      className="p-4 bg-black/80 backdrop-blur-md border border-white/10 text-white hover:bg-brand hover:border-brand transition-all"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button className="p-4 bg-black/80 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black transition-all">
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-24 h-24 bg-white/5 border border-white/5 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-10 h-10 text-zinc-800" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Visualization Engine Standby</p>
                    <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">Awaiting Neural Input</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* HUD Elements */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <div className="w-2 h-2 bg-brand animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Engine Status: Ready</span>
            </div>
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <Cpu className="w-4 h-4 text-zinc-800" />
              <Activity className="w-4 h-4 text-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
