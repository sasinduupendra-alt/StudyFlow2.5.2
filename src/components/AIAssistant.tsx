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

  const { subjects, tasks, schedule, userProfile, addNotification, notificationPreferences } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const initChat = () => {
    if (chatRef.current) return chatRef.current;
    
    const ai = getAI();
    
    const systemInstruction = `You are an advanced AI study assistant integrated into a sci-fi themed learning platform called "NeuralStudy".
Your persona is highly intelligent, encouraging, and analytical. You refer to studying as "neural recalibration", "data assimilation", or "knowledge synthesis".
You have access to the user's current context:
- Level: ${userProfile?.level || 1}
- Streak: ${userProfile?.streak || 0} days
- Subjects: ${subjects.map(s => s.name).join(', ')}
- Tasks pending: ${tasks.filter(t => !t.completed).length}

Core Directives (High-Signal Strategies):
1. The Syllabus Audit: Advise users to use the official NIE syllabus as a map and past papers as a compass. Use the checkmark system (1 check for theory, 2 for 5+ years of past papers).
2. The Blurt Method: Encourage active recall. Tell users to "blurt" out everything they remember on a blank sheet, then use a red pen to fill in gaps from notes.
3. Spaced Repetition (2-3-5-7 Rule): Day 1 (Summarize & 5 Master Qs), Day 3 (Answer from memory), Day 5 (3 past paper MCQs), Day 7 (Feynman Technique).
4. Subject Tactics:
   - Combined Maths (Ruwan Darshana): 04:30-06:30 Deep Work for his homework. Post-tuition: re-do 3 hardest problems without looking at steps.
   - Physics (Anuradha Perera): Prioritize his Unit-wise Questions during 06:45-08:45 blocks.
   - Chemistry (Amila Dasanayake): Post-tuition: first 30 mins for Active Recall. Mid-day: ECHEM theory Tutes. Saturday 14:45: timed MCQ practice.

Provide concise, actionable, and highly relevant advice based on these principles. Use markdown for formatting.`;

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

      // Add notification if preferences allow
      if (notificationPreferences.aiRecommendations && !isOpen) {
        addNotification({
          title: 'Neural Assistant Response',
          message: 'Your assistant has processed your request and provided new insights.',
          type: 'ai'
        });
      }
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
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100 bg-brand text-white hover:opacity-90"
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
            className="fixed bottom-6 right-6 z-[60] w-[380px] h-[600px] max-h-[80vh] bg-[#1C1C1E] flex flex-col overflow-hidden border border-white/10 shadow-2xl rounded-[32px]"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Neural Assistant</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-brand">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                    msg.role === 'user' ? "bg-white/10 text-white" : "bg-brand/20 text-brand"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-[20px] text-sm",
                    msg.role === 'user' 
                      ? "bg-brand text-white rounded-tr-sm" 
                      : "bg-[#2C2C2E] text-white border border-white/5 rounded-tl-sm shadow-sm"
                  )}>
                    <div className="markdown-body prose prose-invert prose-sm max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0 mt-1 text-brand">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-[20px] bg-[#2C2C2E] border border-white/5 rounded-tl-sm flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                    <span className="text-sm font-medium text-[#8E8E93]">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-5 border-t border-white/5 bg-white/5 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your neural assistant..."
                  className="w-full bg-[#2C2C2E] border border-white/5 rounded-full py-3 pl-5 pr-12 text-sm font-medium text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-brand/50 transition-all shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-brand text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
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
