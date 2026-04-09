import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Send, CheckCircle2, XCircle, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GoogleGenAI } from '@google/genai';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
          <Brain className="w-10 h-10 text-[#1DB954]" />
          AI Practice Mode
        </h2>
        <p className="text-gray-400">Test your knowledge. Our AI tutor will grade your answers and update your mastery levels.</p>
      </div>

      <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subject</label>
            <select 
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjects.find(s => s.id === e.target.value);
                if (sub) setSelectedTopicId(sub.topics[0]?.id || '');
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1DB954] outline-none"
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Topic</label>
            <select 
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1DB954] outline-none"
            >
              {selectedSubject?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={generateQuestion}
          disabled={isGenerating || !selectedTopicId}
          className="w-full py-4 bg-[#1DB954] text-black rounded-xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
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
            className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-6"
          >
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-sm font-bold text-[#1DB954] uppercase tracking-widest mb-2">Question</h3>
              <p className="text-lg leading-relaxed">{question}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Answer</label>
              <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your detailed answer here..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-40 focus:ring-2 focus:ring-[#1DB954] outline-none resize-none"
                disabled={!!feedback || isGrading}
              />
            </div>

            {!feedback && (
              <button 
                onClick={gradeAnswer}
                disabled={!answer.trim() || isGrading}
                className="w-full py-4 bg-white text-black rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
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
            className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-2 h-full ${feedback.score >= 80 ? 'bg-[#1DB954]' : feedback.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            
            <div className="flex items-center justify-between pl-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {feedback.score >= 80 ? <CheckCircle2 className="w-6 h-6 text-[#1DB954]" /> : 
                 feedback.score >= 50 ? <AlertCircle className="w-6 h-6 text-yellow-500" /> : 
                 <XCircle className="w-6 h-6 text-red-500" />}
                AI Feedback
              </h3>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Star className={`w-5 h-5 ${feedback.score >= 80 ? 'text-[#1DB954]' : feedback.score >= 50 ? 'text-yellow-500' : 'text-red-500'} fill-current`} />
                <span className="font-black text-lg">{feedback.score}/100</span>
              </div>
            </div>

            <div className="pl-4 prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{feedback.explanation}</p>
            </div>

            <div className="pl-4 pt-4 border-t border-white/10">
              <button 
                onClick={generateQuestion}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors flex items-center gap-2"
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
