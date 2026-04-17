import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useFocus } from '../lib/focus-context';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Brain, Sparkles, CheckCircle, ChevronRight, Bookmark } from 'lucide-react';
import { generateFeynmanSummary } from '../services/gemini';
import { toast } from 'sonner';

export const RecapMode: React.FC = () => {
  const { mode, currentSession, saveRecap, clearSession } = useFocus();
  const [feynmanInput, setFeynmanInput] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  const handleSynthesize = async () => {
    if (!feynmanInput) return;
    setIsSynthesizing(true);
    // Combine session notes with user feynman explanation for better RAG
    const combinedNotes = `${currentSession?.notes || ''}\n\nFeynman Explanation: ${feynmanInput}`;
    const summary = await generateFeynmanSummary(combinedNotes, currentSession?.task || 'Session');
    setAiSummary(summary);
    setIsSynthesizing(false);
    
    // Save to history via context
    saveRecap(summary);
  };

  if (mode === 'EXTRACT') {
    return (
      <div className="max-w-4xl mx-auto p-8 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex items-center gap-3 text-brand">
            <CheckCircle className="w-6 h-6" />
            <h1 className="text-4xl font-light text-white tracking-tight">Selection Complete</h1>
          </div>
          
          <Card className="p-8 bg-zinc-900/50 border-white/10 space-y-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-brand" />
                    Feynman Output / AI Extraction
                  </h3>
                  <div className="prose prose-invert prose-brand max-w-none text-zinc-300 whitespace-pre-wrap font-light leading-relaxed bg-black/20 p-6 rounded-xl border border-white/5">
                    {aiSummary || "Summary processing..."}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-brand/5 border border-brand/20">
                  <div className="text-xs text-brand font-mono font-bold mb-1 uppercase tracking-widest">Focus Level</div>
                  <div className="text-3xl font-light text-white">{currentSession?.focusScore}%</div>
                  <div className="text-[10px] text-zinc-500 mt-2">SNR RETAINED</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5">
                  <div className="text-xs text-zinc-500 font-mono font-bold mb-1 uppercase tracking-widest">Duration</div>
                  <div className="text-2xl font-light text-white">{formatTime(currentSession?.elapsedSeconds || 0)}</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5">
                  <div className="text-xs text-zinc-500 font-mono font-bold mb-1 uppercase tracking-widest">Interruptions</div>
                  <div className="text-2xl font-light text-white">{currentSession?.interruptions}</div>
                </div>

                <Button onClick={clearSession} className="w-full rounded-full bg-white text-black hover:bg-zinc-200 mt-4">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 pt-40">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-[10px] text-brand uppercase tracking-widest font-bold">
            Phase 3: Extract Value
          </div>
          <h2 className="text-5xl font-light text-white tracking-tight">The Feynman Recap</h2>
          <p className="text-zinc-500 italic max-w-md mx-auto">
            "If you can't explain it simply, you don't understand it well enough."
          </p>
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-400 font-medium">Explain what you worked on/learned:</label>
            <Textarea 
              value={feynmanInput}
              onChange={(e) => setFeynmanInput(e.target.value)}
              placeholder="Synthesize your session into core fundamentals..."
              className="bg-zinc-900/50 border-white/5 rounded-2xl p-6 text-lg min-h-[200px] focus-visible:ring-brand/30"
            />
          </div>

          <Button 
            onClick={handleSynthesize}
            disabled={!feynmanInput || isSynthesizing}
            className="w-full bg-brand hover:bg-brand/90 text-white rounded-full py-6 h-auto text-lg group"
          >
            {isSynthesizing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Brain className="w-5 h-5 mr-3" />
                </motion.div>
                AI Synthesizing Knowledge...
              </>
            ) : (
              <>
                Synthesize Knowledge
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <div className="flex justify-center gap-8 pt-4">
             <div className="flex flex-col items-center gap-1">
               <Bookmark className="w-4 h-4 text-zinc-600" />
               <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Self-Review</span>
             </div>
             <div className="flex flex-col items-center gap-1">
               <Sparkles className="w-4 h-4 text-zinc-600" />
               <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">AI Extraction</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
