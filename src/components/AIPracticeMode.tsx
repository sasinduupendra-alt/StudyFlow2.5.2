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
        <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
          <Brain className="w-10 h-10 text-white" />
          AI Practice Mode
        </h2>
        <p className="text-[#8E8E93] mt-2 text-sm font-medium">Test your knowledge. Our AI tutor will grade your answers and update your mastery levels.</p>
      </div>

      <div className="bg-[#1C1C1E] border border-white/5 p-8 space-y-8 rounded-[32px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Subject</label>
            <select 
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const sub = subjects.find(s => s.id === e.target.value);
                if (sub) setSelectedTopicId(sub.topics[0]?.id || '');
              }}
              className="w-full bg-black border border-white/5 rounded-[20px] px-4 py-3 text-sm text-white font-medium focus:border-brand outline-none transition-colors appearance-none"
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Topic</label>
            <select 
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-black border border-white/5 rounded-[20px] px-4 py-3 text-sm text-white font-medium focus:border-brand outline-none transition-colors appearance-none"
            >
              {selectedSubject?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={generateQuestion}
          disabled={isGenerating || !selectedTopicId}
          className="w-full py-4 bg-brand text-white rounded-full font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
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
            className="bg-[#1C1C1E] border border-white/5 p-8 space-y-8 rounded-[32px]"
          >
            <div className="p-6 bg-white/5 rounded-[24px] border border-white/5">
              <h3 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-3">Question</h3>
              <p className="text-lg text-white leading-relaxed font-medium">{question}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Your Answer</label>
              <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your detailed answer here..."
                className="w-full bg-black border border-white/5 rounded-[24px] px-6 py-5 h-48 text-white font-medium focus:border-brand outline-none resize-none transition-colors"
                disabled={!!feedback || isGrading}
              />
            </div>

            {!feedback && (
              <button 
                onClick={gradeAnswer}
                disabled={!answer.trim() || isGrading}
                className="w-full py-4 bg-white text-black rounded-full font-semibold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors disabled:opacity-50"
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
            className="bg-[#1C1C1E] border border-white/5 p-8 space-y-8 relative overflow-hidden rounded-[32px]"
          >
            <div className={`absolute top-0 left-0 w-2 h-full ${feedback.score >= 80 ? 'bg-[#32D74B]' : feedback.score >= 50 ? 'bg-[#FF9F0A]' : 'bg-[#FF453A]'}`} />
            
            <div className="flex items-center justify-between pl-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                {feedback.score >= 80 ? <CheckCircle2 className="w-7 h-7 text-[#32D74B]" /> : 
                 feedback.score >= 50 ? <AlertCircle className="w-7 h-7 text-[#FF9F0A]" /> : 
                 <XCircle className="w-7 h-7 text-[#FF453A]" />}
                AI Feedback
              </h3>
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-5 py-2.5 rounded-full">
                <Star className={`w-5 h-5 ${feedback.score >= 80 ? 'text-[#32D74B]' : feedback.score >= 50 ? 'text-[#FF9F0A]' : 'text-[#FF453A]'} fill-current`} />
                <span className="font-bold text-xl text-white tabular-nums">{feedback.score}/100</span>
              </div>
            </div>

            <div className="pl-6 prose prose-invert max-w-none">
              <p className="text-[#8E8E93] leading-relaxed whitespace-pre-wrap text-base font-medium">{feedback.explanation}</p>
            </div>

            <div className="pl-6 pt-6 border-t border-white/5">
              <button 
                onClick={generateQuestion}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold transition-colors flex items-center gap-3"
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
