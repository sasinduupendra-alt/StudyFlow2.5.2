import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, AlertCircle, CheckCircle2, RefreshCw, Brain, Target, ArrowRight, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';
import { AIStudyPlan, AIPlanTask } from '../types';

export default function AIStudyPlanner() {
  const { subjects, aiPlan, setAIPlan, updateAIPlanTask, addToast, startFocusSession } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const handleEditClick = (task: AIPlanTask) => {
    setEditingTask(task.id);
    setEditDuration(task.duration);
    setEditStartTime(task.startTime || '');
    setEditTitle(task.title);
    setEditReason(task.reason);
    setEditPriority(task.priority);
  };

  const handleSaveEdit = (taskId: string) => {
    updateAIPlanTask(taskId, { 
      duration: editDuration, 
      startTime: editStartTime,
      title: editTitle,
      reason: editReason,
      priority: editPriority
    });
    setEditingTask(null);
    addToast('Task updated successfully', 'success');
  };

  const improveTask = async (task: AIPlanTask) => {
    setIsImproving(task.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        You are an expert academic study planner.
        I have a study task that needs to be improved, made more specific, actionable, and motivating.
        
        Current Task Title: ${task.title}
        Current Task Reason/Description: ${task.reason}
        Duration: ${task.duration} minutes
        Priority: ${task.priority}
        
        Please rewrite the title to be more engaging and actionable.
        Rewrite the reason/description to provide a clear, step-by-step approach on how to tackle this task effectively within the given duration.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ['title', 'reason']
          }
        }
      });

      const result = JSON.parse(response.text);
      updateAIPlanTask(task.id, { title: result.title, reason: result.reason });
      addToast('Task improved successfully!', 'success');
    } catch (error) {
      console.error('Failed to improve task:', error);
      addToast('Failed to improve task', 'error');
    } finally {
      setIsImproving(null);
    }
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const subjectData = subjects.map(s => ({
        name: s.name,
        score: s.score,
        weakCount: s.weakCount,
        examDate: s.examDate,
        topics: s.topics.map(t => ({ title: t.title, mastery: t.mastery }))
      }));

      const prompt = `
        You are an expert academic study planner. 
        Based on the following student data, generate a highly effective daily study plan for TODAY (${new Date().toLocaleDateString()}).
        
        Student Data:
        ${JSON.stringify(subjectData, null, 2)}
        
        Guidelines:
        1. Prioritize subjects with upcoming exams (closer dates).
        2. Focus on topics with low mastery in subjects where the overall score is low.
        3. Suggest 3-5 specific tasks for today.
        4. Each task should have a clear title, duration (in minutes), priority, and a brief reason why it was chosen.
        5. Provide a short encouraging summary for the day.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subjectId: { type: Type.STRING },
                    topicId: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                    priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    reason: { type: Type.STRING }
                  },
                  required: ['title', 'duration', 'priority', 'reason']
                }
              }
            },
            required: ['summary', 'tasks']
          }
        }
      });

      const result = JSON.parse(response.text);
      
      let currentTime = new Date();
      // Start the plan from the next hour or half-hour
      currentTime.setMinutes(Math.ceil(currentTime.getMinutes() / 30) * 30);
      currentTime.setSeconds(0);
      currentTime.setMilliseconds(0);

      const newPlan: AIStudyPlan = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        summary: result.summary,
        tasks: result.tasks.map((t: any) => {
          const startTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
          currentTime.setMinutes(currentTime.getMinutes() + t.duration);
          const endTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            ...t,
            id: Math.random().toString(36).substr(2, 9),
            subjectId: subjects.find(s => s.name.toLowerCase().includes(t.subjectId?.toLowerCase() || ''))?.id || subjects[0].id,
            topicId: t.topicId || '',
            startTime,
            endTime
          };
        })
      };

      setAIPlan(newPlan);
      addToast('AI Study Plan generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating AI plan:', error);
      addToast('Failed to generate AI plan. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1DB954]/20 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-[#1DB954]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">AI Daily Planner</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Personalized for your goals</p>
          </div>
        </div>
        <button
          onClick={generatePlan}
          disabled={isGenerating}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all",
            isGenerating 
              ? "bg-white/5 text-gray-500 cursor-not-allowed" 
              : "bg-[#1DB954] text-black hover:scale-105 active:scale-95"
          )}
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {aiPlan ? 'Regenerate Plan' : 'Generate Daily Plan'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#181818] rounded-2xl p-12 border border-white/5 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#1DB954]/20 border-t-[#1DB954] rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#1DB954] animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Analyzing Your Progress...</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">Gemini is looking at your weak areas and upcoming exams to build the perfect plan.</p>
            </div>
          </motion.div>
        ) : aiPlan ? (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-[#1DB954]/10 to-transparent p-6 rounded-2xl border border-[#1DB954]/20">
              <p className="text-gray-300 italic leading-relaxed">
                "{aiPlan.summary}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiPlan.tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#181818] p-5 rounded-xl border border-white/5 hover:border-[#1DB954]/30 transition-all group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {editingTask === task.id ? (
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as any)}
                          className="bg-white/10 text-xs px-2 py-1 rounded outline-none"
                        >
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                      ) : (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                          task.priority === 'High' ? "bg-red-500/20 text-red-500" :
                          task.priority === 'Medium' ? "bg-yellow-500/20 text-yellow-500" :
                          "bg-blue-500/20 text-blue-500"
                        )}>
                          {task.priority} Priority
                        </span>
                      )}
                      {editingTask === task.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="bg-white/10 text-xs px-2 py-1 rounded outline-none w-20"
                          />
                          <input 
                            type="number" 
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number(e.target.value))}
                            className="bg-white/10 text-xs px-2 py-1 rounded outline-none w-16"
                            min="5"
                            step="5"
                          />
                          <span className="text-xs text-gray-400">m</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500 text-[10px] font-bold uppercase">
                          <Clock className="w-3 h-3" />
                          {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : `${task.duration}m`}
                        </div>
                      )}
                    </div>
                    {editingTask === task.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSaveEdit(task.id)} className="p-1 text-[#1DB954] hover:bg-white/10 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingTask(null)} className="p-1 text-red-500 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditClick(task)} className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {editingTask === task.id ? (
                    <div className="space-y-3 mb-4">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:border-[#1DB954] outline-none transition-colors"
                        placeholder="Task Title"
                      />
                      <textarea
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-[#1DB954] outline-none transition-colors min-h-[80px] resize-none"
                        placeholder="Task Description/Reason"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="font-bold text-lg mb-2 group-hover:text-[#1DB954] transition-colors">{task.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed mb-4">{task.reason}</p>
                    </>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startFocusSession(task.subjectId, task.topicId, task.duration)}
                      className="flex-1 py-2 bg-white/5 hover:bg-[#1DB954] hover:text-black rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      Start This Task
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    {!editingTask && (
                      <button
                        onClick={() => improveTask(task)}
                        disabled={isImproving === task.id}
                        className="py-2 px-3 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Improve task with AI"
                      >
                        {isImproving === task.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#181818] rounded-2xl p-12 border border-white/5 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-gray-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No Plan Generated Yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Let our AI analyze your syllabus, exam dates, and current mastery to create a custom study path for today.
              </p>
            </div>
            <button
              onClick={generatePlan}
              className="px-8 py-3 bg-white text-black rounded-full font-black hover:scale-105 transition-all"
            >
              Create Today's Plan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
