import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStudySession } from '../hooks/useStudySession';
import { useAppStore } from '../store/useAppStore';
import { Clock, BookOpen, Target, ArrowLeft, Sparkles } from 'lucide-react';
import StreamingUI from '../components/StreamingUI';
import { streamStudyAdvice } from '../services/gemini';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading, error } = useStudySession(id);
  const { subjects } = useAppStore();
  const [aiAdvice, setAiAdvice] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const subject = subjects.find(s => s.id === session?.subjectId);
  const topic = subject?.topics.find(t => t.id === session?.topicId);

  const handleGetAdvice = async () => {
    if (!topic) return;
    setIsStreaming(true);
    setAiAdvice('');
    try {
      const stream = streamStudyAdvice(topic.title);
      for await (const chunk of stream) {
        setAiAdvice(prev => prev + chunk);
      }
    } catch (err) {
      console.error('Failed to get AI advice:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Session not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="text-[#1DB954] hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-4xl mx-auto"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="bg-[#181818] rounded-3xl p-8 border border-white/5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#1DB954]/10 text-[#1DB954] rounded-full text-[10px] font-black uppercase tracking-widest">
                Study Session
              </span>
              <span className="text-gray-500 text-xs font-bold">
                {new Date(session.timestamp).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{topic?.title || 'Unknown Topic'}</h1>
            <p className="text-gray-400 font-bold">{subject?.name || 'Unknown Subject'}</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
              </div>
              <p className="text-xl font-black">{session.duration}m</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Target className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Focus</span>
              </div>
              <p className="text-xl font-black">{session.focusLevel}/10</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Notes</h3>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 min-h-[150px]">
              <p className="text-gray-300 leading-relaxed">{session.notes || 'No notes for this session.'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Resources Used</h3>
            <div className="flex flex-wrap gap-2">
              {session.resources?.map((res, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 text-sm font-bold">
                  <BookOpen className="w-3 h-3 text-[#1DB954]" />
                  {res}
                </div>
              )) || <p className="text-gray-500 italic text-sm">No resources logged.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#1DB954]" />
            AI Study Advice
          </h2>
          {!aiAdvice && (
            <button 
              onClick={handleGetAdvice}
              disabled={isStreaming}
              className="px-6 py-2 bg-[#1DB954] text-black rounded-full font-bold hover:scale-105 transition-all disabled:opacity-50"
            >
              Get AI Advice
            </button>
          )}
        </div>

        {(aiAdvice || isStreaming) && (
          <StreamingUI 
            content={aiAdvice} 
            isStreaming={isStreaming} 
          />
        )}
      </div>
    </motion.div>
  );
}
