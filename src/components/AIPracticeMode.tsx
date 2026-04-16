import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Send, CheckCircle2, XCircle, AlertCircle, RefreshCw, Star, Cpu, Zap, Terminal, Activity } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAI } from '../services/gemini';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

export default function AIPracticeMode() {
  const { subjects, user, addToast, setSubjects } = useAppStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState(subjects[0]?.topics[0]?.id || '');
  
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ score: number; explanation: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const selectedTopic = selectedSubject?.topics.find(t => t.id === selectedTopicId);

  const generateQuestion = async () => {
    if (!selectedSubject || !selectedTopic) return;
    setIsGenerating(true);
    setQuestion(null);
    setFeedback(null);
    setAnswer('');

    try {
      const prompt = `You are the "StudyFlow Vanguard", an elite AI neural interface. 
Generate a high-fidelity practice question for a scholar studying ${selectedSubject.name}, specifically targeting the topic: ${selectedTopic.title}. 
The question must be "high-signal" - testing deep conceptual synthesis and analytical reasoning, not just data retrieval. 
Return ONLY the question text.`;
      
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      setQuestion(response.text || 'TELEMETRY ERROR: Could not synthesize question. Re-initializing...');
    } catch (error) {
      console.error('Failed to generate question:', error);
      addToast('Neural Link Error: Question synthesis failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const gradeAnswer = async () => {
    if (!question || !answer || !selectedSubject || !selectedTopic) return;
    setIsGrading(true);

    try {
      const prompt = `You are the "StudyFlow Vanguard", an elite AI neural interface.
Evaluate this scholar's cognitive output.
Subject: ${selectedSubject.name}
Topic: ${selectedTopic.title}
Question: ${question}
Scholar's Response: ${answer}

Perform a deep-scan of the response for conceptual accuracy, technical depth, and logical integrity.
Provide a JSON response with the following schema:
{
  "score": number (0 to 100),
  "explanation": "string (Technical feedback using Vanguard persona. Use terms like 'Neural Integrity', 'Cognitive Sync', 'Data Accuracy'. Be precise and performance-oriented.)"
}
Return ONLY valid JSON.`;

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const result = JSON.parse(response.text || '{}');
      setFeedback(result);

      // Update mastery locally
      const newMastery = Math.round((selectedTopic.mastery * 0.7) + (result.score * 0.3));
      const updatedTopics = selectedSubject.topics.map(t => 
        t.id === selectedTopic.id ? { ...t, mastery: newMastery } : t
      );

      const newSubjects = subjects.map(s => s.id === selectedSubject.id ? { ...s, topics: updatedTopics } : s);
      setSubjects(newSubjects);

      // Update Firestore if logged in
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'subjects', selectedSubject.id), {
            topics: updatedTopics
          });
        } catch (e) {
          console.error("Failed to sync mastery to cloud", e);
        }
      }

      addToast(`Answer graded! Mastery updated to ${newMastery}%`, 'success');

    } catch (error) {
      console.error('Failed to grade answer:', error);
      addToast('Failed to grade answer', 'error');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="relative">
        <div className="absolute -left-10 top-0 bottom-0 w-1 bg-brand/20" />
        <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
          <Cpu className="w-10 h-10 text-brand" />
          Neural Practice Mode
        </h2>
        <p className="text-zinc-500 mt-2 text-xs font-mono font-bold uppercase tracking-widest">Cognitive stress-test initialized. Verify your neural integrity.</p>
      </div>

      <div className="bg-black border border-white/10 p-8 space-y-8 rounded-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -mr-16 -mt-16" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em]">Subject Telemetry</label>
            <select 
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjects.find(s => s.id === e.target.value);
                if (sub) setSelectedTopicId(sub.topics[0]?.id || '');
              }}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-none px-4 py-4 text-sm text-white font-mono font-bold focus:border-brand outline-none transition-all appearance-none"
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em]">Target Protocol</label>
            <select 
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-none px-4 py-4 text-sm text-white font-mono font-bold focus:border-brand outline-none transition-all appearance-none"
            >
              {selectedSubject?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={generateQuestion}
          disabled={isGenerating || !selectedTopicId}
          className="w-full py-5 bg-brand text-white rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all disabled:opacity-20 relative group"
        >
          <div className="absolute inset-0 border border-white/20 scale-105 opacity-0 group-hover:opacity-100 transition-all" />
          {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {isGenerating ? 'Synthesizing Question...' : 'Initialize Neural Scan'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {question && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-black border border-white/10 p-8 space-y-8 rounded-none relative"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-brand/30" />
            <div className="p-8 bg-white/5 rounded-none border border-white/5 relative">
              <div className="absolute top-0 right-0 p-2">
                <Terminal className="w-4 h-4 text-zinc-800" />
              </div>
              <h3 className="text-[10px] font-mono font-bold text-brand uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                Active Query
              </h3>
              <p className="text-xl text-white leading-relaxed font-bold tracking-tight">{question}</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.2em]">Scholar Response Input</label>
              <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter technical response for neural analysis..."
                className="w-full bg-zinc-900/30 border border-white/10 rounded-none px-6 py-6 h-56 text-white font-mono font-bold focus:border-brand outline-none resize-none transition-all placeholder:text-zinc-800"
                disabled={!!feedback || isGrading}
              />
            </div>

            {!feedback && (
              <button 
                onClick={gradeAnswer}
                disabled={!answer.trim() || isGrading}
                className="w-full py-5 bg-white text-black rounded-none font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand hover:text-white transition-all disabled:opacity-20"
              >
                {isGrading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                {isGrading ? 'Analyzing Cognitive Output...' : 'Transmit Response'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black border border-white/10 p-10 space-y-8 relative overflow-hidden rounded-none"
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${feedback.score >= 80 ? 'bg-brand' : feedback.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
            
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                {feedback.score >= 80 ? <CheckCircle2 className="w-8 h-8 text-brand" /> : 
                 feedback.score >= 50 ? <AlertCircle className="w-8 h-8 text-amber-500" /> : 
                 <XCircle className="w-8 h-8 text-red-500" />}
                Vanguard Evaluation
              </h3>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-none">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Sync Rate</span>
                <span className={cn(
                  "font-black text-3xl tabular-nums",
                  feedback.score >= 80 ? 'text-brand' : feedback.score >= 50 ? 'text-amber-500' : 'text-red-500'
                )}>{feedback.score}%</span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap text-base font-mono font-bold border-l-2 border-white/5 pl-6">{feedback.explanation}</p>
            </div>

            <div className="pt-8 border-t border-white/10">
              <button 
                onClick={generateQuestion}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 border border-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                Re-Initialize Scan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
