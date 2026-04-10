import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, AlertCircle, CheckCircle2, RefreshCw, Brain, Target, ArrowRight, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Type } from "@google/genai";
import { getAI } from '../services/gemini';
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
      const ai = getAI();
      
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
      const ai = getAI();
      
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
          <div className="w-10 h-10 bg-brand/10 border border-brand/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tighter uppercase">AI_Daily_Planner</h2>
            <p className="hud-label !text-gray-600">NEURAL_SYNC_READY</p>
          </div>
        </div>
        <button
          onClick={generatePlan}
          disabled={isGenerating}
          className={cn(
            "scifi-button px-6 py-2 text-[10px]",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <RefreshCw className="w-3 h-3 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-3 h-3 mr-2" />
          )}
          {aiPlan ? 'REGENERATE_PLAN' : 'INITIALIZE_PLAN'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="scifi-panel p-12 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="relative">
              <div className="w-12 h-12 border-2 border-brand/20 border-t-brand animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-brand animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tighter">Analyzing_Progress...</h3>
              <p className="hud-label !text-gray-600 max-w-xs mx-auto">Gemini core processing weak areas and exam deadlines for optimal pathing.</p>
            </div>
          </motion.div>
        ) : aiPlan ? (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-brand/5 p-4 border border-brand/20">
              <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest leading-relaxed italic">
                "{aiPlan.summary}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiPlan.tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="scifi-panel-sm p-4 hover:border-brand/30 transition-all group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {editingTask === task.id ? (
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as any)}
                          className="bg-white/5 border border-border-dim text-[9px] px-2 py-1 outline-none font-black uppercase"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      ) : (
                        <span className={cn(
                          "px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest",
                          task.priority === 'High' ? "border-red-500/30 text-red-500 bg-red-500/5" :
                          task.priority === 'Medium' ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5" :
                          "border-blue-500/30 text-blue-500 bg-blue-500/5"
                        )}>
                          {task.priority}_PRIORITY
                        </span>
                      )}
                      {editingTask === task.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="bg-white/5 border border-border-dim text-[9px] px-2 py-1 outline-none w-20 font-black"
                          />
                          <input 
                            type="number" 
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number(e.target.value))}
                            className="bg-white/5 border border-border-dim text-[9px] px-2 py-1 outline-none w-12 font-black"
                            min="5"
                            step="5"
                          />
                          <span className="hud-label">M</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 hud-label">
                          <Clock className="w-2.5 h-2.5" />
                          {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : `${task.duration}M`}
                        </div>
                      )}
                    </div>
                    {editingTask === task.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSaveEdit(task.id)} className="p-1 text-brand hover:bg-white/5"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditingTask(null)} className="p-1 text-red-500 hover:bg-white/5"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditClick(task)} className="p-1 text-gray-700 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {editingTask === task.id ? (
                    <div className="space-y-2 mb-4">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white/5 border border-border-dim px-3 py-1.5 text-[11px] font-black uppercase focus:border-brand outline-none transition-colors"
                        placeholder="TASK_TITLE"
                      />
                      <textarea
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full bg-white/5 border border-border-dim px-3 py-1.5 text-[10px] text-gray-400 font-black uppercase focus:border-brand outline-none transition-colors min-h-[60px] resize-none"
                        placeholder="TASK_DESCRIPTION"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="font-black text-[11px] mb-1 group-hover:text-brand transition-colors uppercase tracking-tight">{task.title}</h4>
                      <p className="text-[9px] text-gray-600 leading-relaxed mb-4 font-black uppercase tracking-tighter">{task.reason}</p>
                    </>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startFocusSession(task.subjectId, task.topicId, task.duration)}
                      className="flex-1 py-2 bg-white/5 border border-border-dim hover:border-brand/50 hover:text-brand text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      INITIALIZE_SESSION
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    {!editingTask && (
                      <button
                        onClick={() => improveTask(task)}
                        disabled={isImproving === task.id}
                        className="py-2 px-3 bg-white/5 border border-border-dim hover:border-purple-500/50 hover:text-purple-400 text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Optimize with AI"
                      >
                        {isImproving === task.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
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
            className="scifi-panel p-12 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-white/5 border border-border-dim flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-gray-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-tighter">No_Plan_Generated</h3>
              <p className="hud-label !text-gray-600 max-w-sm mx-auto">
                Initialize AI analysis to generate an optimized study path based on current mastery metrics and deadlines.
              </p>
            </div>
            <button
              onClick={generatePlan}
              className="scifi-button px-8 py-3"
            >
              GENERATE_TODAY_PLAN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
