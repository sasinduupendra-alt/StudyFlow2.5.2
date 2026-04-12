import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Send, CheckCircle2, XCircle, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAI } from '../services/gemini';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
      const prompt = `Generate a challenging practice question for an Advanced Level student studying ${selectedSubject.name}, specifically focusing on the topic: ${selectedTopic.title}. The question should test deep understanding, not just memorization. Return ONLY the question text, nothing else.`;
      
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setQuestion(response.text || 'Could not generate a question. Please try again.');
    } catch (error) {
      console.error('Failed to generate question:', error);
      addToast('Failed to generate question', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const gradeAnswer = async () => {
    if (!question || !answer || !selectedSubject || !selectedTopic) return;
    setIsGrading(true);

    try {
      const prompt = `You are an expert tutor grading an Advanced Level student's answer.
Subject: ${selectedSubject.name}
Topic: ${selectedTopic.title}
Question: ${question}
Student's Answer: ${answer}

Evaluate the answer and provide a JSON response with the following schema:
{
  "score": number (0 to 100, where 100 is perfect),
  "explanation": "string (Detailed feedback explaining what is correct, what is wrong, and how to improve)"
}
Return ONLY valid JSON.`;

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      <div>
        <h2 className="text-4xl font-mono text-white uppercase tracking-widest flex items-center gap-4">
          <Brain className="w-10 h-10 text-white" />
          AI Practice Mode
        </h2>
        <p className="text-zinc-500 mt-2 font-mono uppercase tracking-widest text-xs">Test your knowledge. Our AI tutor will grade your answers and update your mastery levels.</p>
      </div>

      <div className="bg-transparent border border-white/10 p-8 space-y-8 rounded-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Subject</label>
            <select 
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjects.find(s => s.id === e.target.value);
                if (sub) setSelectedTopicId(sub.topics[0]?.id || '');
              }}
              className="w-full bg-black border border-white/20 rounded-none px-4 py-3 text-sm text-white font-mono uppercase tracking-widest focus:border-white outline-none transition-colors appearance-none"
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Topic</label>
            <select 
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-black border border-white/20 rounded-none px-4 py-3 text-sm text-white font-mono uppercase tracking-widest focus:border-white outline-none transition-colors appearance-none"
            >
              {selectedSubject?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={generateQuestion}
          disabled={isGenerating || !selectedTopicId}
          className="w-full py-4 bg-white text-black rounded-none font-mono uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          {isGenerating ? 'Generating Question...' : 'Generate Practice Question'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {question && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-transparent border border-white/10 p-8 space-y-8 rounded-none"
          >
            <div className="p-6 bg-transparent rounded-none border border-white/20">
              <h3 className="text-[10px] font-mono text-white uppercase tracking-widest mb-3">Question</h3>
              <p className="text-lg text-white leading-relaxed font-mono">{question}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Your Answer</label>
              <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="TYPE YOUR DETAILED ANSWER HERE..."
                className="w-full bg-black border border-white/20 rounded-none px-6 py-5 h-48 text-white font-mono focus:border-white outline-none resize-none transition-colors"
                disabled={!!feedback || isGrading}
              />
            </div>

            {!feedback && (
              <button 
                onClick={gradeAnswer}
                disabled={!answer.trim() || isGrading}
                className="w-full py-4 bg-white text-black rounded-none font-mono uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isGrading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isGrading ? 'Grading...' : 'Submit Answer'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-transparent border border-white/10 p-8 space-y-8 relative overflow-hidden rounded-none"
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${feedback.score >= 80 ? 'bg-white' : feedback.score >= 50 ? 'bg-zinc-400' : 'bg-zinc-600'}`} />
            
            <div className="flex items-center justify-between pl-4">
              <h3 className="text-2xl font-mono uppercase tracking-widest text-white flex items-center gap-3">
                {feedback.score >= 80 ? <CheckCircle2 className="w-7 h-7 text-white" /> : 
                 feedback.score >= 50 ? <AlertCircle className="w-7 h-7 text-zinc-400" /> : 
                 <XCircle className="w-7 h-7 text-zinc-600" />}
                AI Feedback
              </h3>
              <div className="flex items-center gap-3 bg-transparent border border-white/20 px-5 py-2.5 rounded-none">
                <Star className={`w-5 h-5 ${feedback.score >= 80 ? 'text-white' : feedback.score >= 50 ? 'text-zinc-400' : 'text-zinc-600'} fill-current`} />
                <span className="font-mono text-xl text-white">{feedback.score}/100</span>
              </div>
            </div>

            <div className="pl-4 prose prose-invert max-w-none">
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-base font-mono">{feedback.explanation}</p>
            </div>

            <div className="pl-4 pt-6 border-t border-white/10">
              <button 
                onClick={generateQuestion}
                className="px-6 py-3 bg-transparent hover:bg-white/5 text-white rounded-none font-mono uppercase tracking-widest transition-colors flex items-center gap-3 border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                Try Another Question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
