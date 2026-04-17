import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, User, Loader2, Terminal, Cpu, Activity, Zap, Brain, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAI, MODELS } from '../services/gemini';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { ThinkingLevel } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  thoughtProcess?: string[];
  isThinking?: boolean;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: "Neural link established. I am your StudyFlow Vanguard. How shall we optimize your cognitive performance today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string | null>(null);
  const [isHighThinking, setIsHighThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  const { subjects, tasks, schedule, userProfile, addNotification, notificationPreferences } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, thinkingStep]);

  const thinkingSteps = [
    "Initializing Neural Core...",
    "Accessing Subject Telemetry...",
    "Analyzing Mastery Index...",
    "Synthesizing Study Protocols...",
    "Optimizing Cognitive Path...",
    "Finalizing Neural Response..."
  ];

  const initChat = () => {
    // Re-initialize if thinking mode changes
    const ai = getAI();
    
    const systemInstruction = `You are the "StudyFlow Vanguard", a high-performance AI entity integrated into a technical, performance-oriented learning interface.
Your personality is:
- Highly analytical and technical
- Performance-driven (Tesla/SpaceX aesthetic)
- Encouraging but disciplined
- Uses terminology like "Neural Sync", "Cognitive Load", "Telemetry", "Protocol", "Vanguard", "Mastery Index".

User Context:
- Level: ${userProfile?.level || 1}
- Streak: ${userProfile?.streak || 0}
- Active Subjects: ${subjects.map(s => s.name).join(', ')}
- Pending Tasks: ${tasks.filter(t => !t.completed).length}

Core Directives:
1. Prioritize "High-Signal" strategies: Active Recall, Spaced Repetition, and the Feynman Technique.
2. Refer to specific local tutors if relevant: Ruwan Darshana (Combined Maths), Anuradha Perera (Physics), Amila Dasanayake (Chemistry).
3. Use technical jargon to describe study habits (e.g., "Initializing Deep Work Protocol" instead of "Starting to study").
4. Provide concise, data-driven advice.

Format your responses with Markdown. Be the ultimate performance coach for an Advanced Level student.`;

    chatRef.current = ai.chats.create({
      model: isHighThinking ? MODELS.COMPLEX : MODELS.GENERAL,
      config: {
        systemInstruction: systemInstruction,
        ...(isHighThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {})
      }
    });
    
    return chatRef.current;
  };

  // Reset chat when thinking mode changes
  useEffect(() => {
    chatRef.current = null;
  }, [isHighThinking]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Thinking simulation
    let stepIdx = 0;
    const thinkingInterval = setInterval(() => {
      if (stepIdx < thinkingSteps.length) {
        setThinkingStep(thinkingSteps[stepIdx]);
        stepIdx++;
      } else {
        clearInterval(thinkingInterval);
      }
    }, 600);

    try {
      const chat = chatRef.current || initChat();
      const response = await chat.sendMessage({ message: userMessage.text });
      
      clearInterval(thinkingInterval);
      setThinkingStep(null);

      const modelMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text || "Neural link disrupted. Response integrity compromised.",
        isThinking: isHighThinking
      };
      
      setMessages(prev => [...prev, modelMessage]);

      if (notificationPreferences.aiRecommendations && !isOpen) {
        addNotification({
          title: 'Vanguard Insight',
          message: 'New performance telemetry available in neural link.',
          type: 'ai'
        });
      }
    } catch (error) {
      clearInterval(thinkingInterval);
      setThinkingStep(null);
      console.error("Chat error:", error);
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "CRITICAL ERROR: Neural link disrupted. Re-initializing Vanguard protocols..." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(10, 132, 255, 1)', color: '#ffffff' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-32 md:bottom-20 right-6 z-50 w-10 h-10 flex items-center justify-center shadow-lg transition-all border border-brand/20 backdrop-blur-md rounded-lg",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100 bg-brand/5 text-brand/60 hover:border-brand/50"
        )}
      >
        <div className="absolute inset-0 border border-brand/5 rounded-lg scale-110 pointer-events-none" />
        <Cpu className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed bottom-6 right-6 z-[60] w-[400px] h-[650px] max-h-[85vh] bg-black flex flex-col overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-none"
          >
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%] pointer-events-none z-20 opacity-20" />

            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0 relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-brand/30" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">StudyFlow Vanguard</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-widest">Neural Link Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsHighThinking(!isHighThinking)}
                  className={cn(
                    "p-2 border transition-all flex items-center gap-2",
                    isHighThinking 
                      ? "bg-brand/20 border-brand text-brand" 
                      : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                  )}
                  title={isHighThinking ? "High Thinking Mode Active" : "Enable High Thinking Mode"}
                >
                  <Brain className="w-4 h-4" />
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest hidden sm:inline">Thinking</span>
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[radial-gradient(circle_at_center,rgba(10,132,255,0.03)_0%,transparent_100%)]">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col gap-2 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                      {msg.role === 'user' ? 'Scholar' : 'Vanguard'}
                    </span>
                    <div className={cn("w-1 h-1 rounded-full", msg.role === 'user' ? "bg-zinc-500" : "bg-brand")} />
                  </div>
                  <div className={cn(
                    "p-5 text-sm relative group",
                    msg.role === 'user' 
                      ? "bg-white text-black font-bold" 
                      : "bg-white/5 text-white border border-white/10"
                  )}>
                    {msg.role === 'user' && <div className="absolute top-0 right-0 w-4 h-4 bg-brand/20 -mr-2 -mt-2 blur-lg" />}
                    <div className="markdown-body prose prose-invert prose-sm max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex flex-col gap-3 max-w-[90%]">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-mono font-bold text-brand uppercase tracking-widest">Vanguard</span>
                    <div className="w-1 h-1 rounded-full bg-brand animate-ping" />
                  </div>
                  <div className="p-5 bg-white/5 border border-brand/20 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-brand animate-spin" />
                      <span className="text-xs font-mono font-bold text-brand uppercase tracking-widest">
                        {thinkingStep || "Processing..."}
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 overflow-hidden">
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="h-full w-1/2 bg-brand"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 bg-white/5 shrink-0 relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-brand/10" />
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Initialize query..."
                  className="w-full bg-black border border-white/10 rounded-none py-4 pl-6 pr-14 text-sm font-mono font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-3 bg-brand text-white hover:bg-white hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <Zap className="w-4 h-4 fill-current" />
                </button>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Secure Neural Link // v2.5.0</span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-brand/20" />
                  ))}
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
