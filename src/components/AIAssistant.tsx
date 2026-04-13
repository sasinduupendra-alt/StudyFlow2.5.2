import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAI } from '../services/gemini';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: "Hello! I'm your Neural Study Assistant. How can I help you optimize your learning today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  const { subjects, tasks, schedule, userProfile } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const initChat = () => {
    if (chatRef.current) return chatRef.current;
    
    const ai = getAI();
    
    const systemInstruction = `You are an advanced AI study assistant integrated into a sci-fi themed learning platform called "StudyFlow Neural Interface".
Your persona is highly intelligent, encouraging, and analytical. You refer to studying as "neural recalibration", "data assimilation", or "knowledge synthesis".
You have access to the user's current context:
- Level: ${userProfile?.level || 1}
- Streak: ${userProfile?.streak || 0} days
- Subjects: ${subjects.map(s => s.name).join(', ')}
- Tasks pending: ${tasks.filter(t => !t.completed).length}

Provide concise, actionable, and highly relevant advice. Use markdown for formatting.`;

    chatRef.current = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    return chatRef.current;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = initChat();
      const response = await chat.sendMessage({ message: userMessage.text });
      
      const modelMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text || "I was unable to process that request." 
      };
      
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "Error: Neural link disrupted. Please try again." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--color-brand-glow)] transition-all",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100 bg-brand text-black hover:bg-brand-bright"
        )}
      >
        <Bot className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[60] w-[380px] h-[600px] max-h-[80vh] enterprise-card-premium flex flex-col overflow-hidden border-brand/30 shadow-[0_10px_40px_var(--color-brand-glow)]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-brand/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand border border-brand/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Neural Assistant</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand-glow)]" />
                    <span className="text-[9px] font-mono text-brand uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1",
                    msg.role === 'user' ? "bg-white/10 text-white" : "bg-brand/20 text-brand border border-brand/30"
                  )}>
                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-white/10 text-white rounded-tr-sm" 
                      : "bg-brand/10 text-zinc-200 border border-brand/20 rounded-tl-sm"
                  )}>
                    <div className="markdown-body prose prose-invert prose-sm max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center shrink-0 mt-1 text-brand border border-brand/30">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div className="p-3 rounded-2xl bg-brand/5 border border-brand/10 rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                    <span className="text-[10px] font-mono text-brand uppercase tracking-widest">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your neural assistant..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-brand text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-bright transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
