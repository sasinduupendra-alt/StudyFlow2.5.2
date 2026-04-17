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
  const [energyLevel, setEnergyLevel] = useState<'High' | 'Medium' | 'Low'>('High');

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
        
        Current User Energy Level: ${energyLevel}
        
        IMPORTANT DIRECTIVES (High-Signal Strategies):
        1. The Syllabus Audit: Focus only on topics officially in the NIE syllabus.
        2. The Blurt Method: Suggest active recall sessions where the student "blurts" out memory onto a blank sheet.
        3. Spaced Repetition (2-3-5-7 Rule): Suggest tasks like "Summarize & 5 Master Qs" (Day 1), "Answer from memory" (Day 3), "3 past paper MCQs" (Day 5), or "Feynman Technique" (Day 7).
        4. Combined Maths Signal: Almost exclusively problem-solving volume. Timed Practice (5-10 problems without notes), Structure Building (mapping steps for long-form questions), Pure Logic Check (deriving theorems). Noise: Formula listing, reading solved examples.
        5. Physics Signal: Conceptual visualization and unit accuracy. Unit/Dimension Audit, Variable Manipulation (solving with variables before numbers), Practical Logic (limitations/errors for experiments). Noise: Passive video watching, definition cramming.
        6. Chemistry Signal: Reaction mechanisms (drawing from memory), Inorganic Trends (logical deduction), Calculation Drills (balancing equations, pH). Noise: Color-coding notes, general reading, flashcard hoarding.
        7. 15-Hour Grind Structure: 
           - Morning (0-5 hours): 100% Signal. Hardest Math/Physics problems.
           - Afternoon (5-10 hours): 70% Signal / 30% Noise. Chemistry theory and mid-level problems.
           - Night (10-15 hours): Review "Noise" (organize logs, prep for tomorrow).
        8. Cognitive Load & Energy Levels: Dynamically adjust task duration and time slots based on the user's current energy level (${energyLevel}). 
           - If Energy is High: Schedule high-cognitive-load, high-priority tasks (e.g., Deep Work, difficult topics, long durations).
           - If Energy is Medium: Balance between moderate theory review and standard practice.
           - If Energy is Low: Schedule shorter, lower-cognitive-load tasks (e.g., Active Recall, light review, organizing notes).

        Guidelines:
        1. Prioritize subjects with upcoming exams (closer dates).
        2. Focus on topics with low mastery in subjects where the overall score is low.
        3. Suggest 3-5 specific tasks for today incorporating the strategies above.
        4. Each task should have a clear title, duration (in minutes), a specific startTime (in HH:MM format, 24-hour), priority, and a brief reason why it was chosen and placed at that time.
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
                    startTime: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    reason: { type: Type.STRING }
                  },
                  required: ['title', 'duration', 'startTime', 'priority', 'reason']
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
          let startTime = t.startTime;
          if (!startTime || !startTime.includes(':')) {
            startTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
            currentTime.setMinutes(currentTime.getMinutes() + t.duration);
          }
          
          const [hours, minutes] = startTime.split(':').map(Number);
          const endObj = new Date();
          endObj.setHours(hours, minutes + t.duration, 0, 0);
          const endTime = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            ...t,
            id: Math.random().toString(36).substr(2, 9),
            subjectId: subjects.find(s => (s.name || '').toLowerCase().includes(t.subjectId?.toLowerCase() || ''))?.id || subjects[0].id,
            topicId: t.topicId || '',
            startTime,
            endTime
          };
        }).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand/10 rounded-[16px] flex items-center justify-center">
            <Brain className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Daily Planner</h2>
            <p className="text-sm font-medium text-[#8E8E93]">Personalized study schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <span className="text-xs font-medium text-[#8E8E93]">Energy:</span>
            <select
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
            >
              <option value="High" className="bg-[#1C1C1E]">High ⚡</option>
              <option value="Medium" className="bg-[#1C1C1E]">Medium 🔋</option>
              <option value="Low" className="bg-[#1C1C1E]">Low 🪫</option>
            </select>
          </div>
          <button
            onClick={generatePlan}
            disabled={isGenerating}
            className={cn(
              "px-6 py-2.5 text-sm font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors rounded-full flex items-center shadow-sm",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {aiPlan ? 'Regenerate Plan' : 'Generate Plan'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#1C1C1E] border border-white/5 p-16 flex flex-col items-center justify-center text-center space-y-6 rounded-[32px] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-brand/5 animate-pulse" />
            <div className="relative">
              <div className="w-16 h-16 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-brand animate-pulse" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white tracking-tight">Analyzing Study Data</h3>
              <p className="text-sm text-[#8E8E93] max-w-sm mx-auto mt-2 leading-relaxed font-medium">Gemini is synthesizing mastery metrics and temporal constraints to optimize your study trajectory.</p>
            </div>
          </motion.div>
        ) : aiPlan ? (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#1C1C1E] p-6 border border-white/5 rounded-[24px]">
              <p className="text-sm text-[#8E8E93] leading-relaxed italic font-medium">
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
                  className="bg-[#1C1C1E] border border-white/5 p-6 hover:bg-[#2C2C2E] transition-all group relative rounded-[24px]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {editingTask === task.id ? (
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as any)}
                          className="bg-black border border-white/10 text-xs px-3 py-1.5 rounded-full outline-none font-medium text-white"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      ) : (
                        <span className={cn(
                          "px-3 py-1 text-xs font-semibold rounded-full border",
                          task.priority === 'High' ? "border-brand/30 text-brand bg-brand/10" :
                          task.priority === 'Medium' ? "border-white/20 text-[#8E8E93] bg-white/5" :
                          "border-white/10 text-[#8E8E93] bg-transparent"
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
                            className="bg-black border border-white/10 text-xs px-3 py-1.5 rounded-full outline-none w-24 font-medium text-white"
                          />
                          <input 
                            type="number" 
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number(e.target.value))}
                            className="bg-black border border-white/10 text-xs px-3 py-1.5 rounded-full outline-none w-16 font-medium text-white"
                            min="5"
                            step="5"
                          />
                          <span className="text-xs font-medium text-[#8E8E93]">min</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8E8E93]">
                          <Clock className="w-3.5 h-3.5" />
                          {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : `${task.duration}m`}
                        </div>
                      )}
                    </div>
                    {editingTask === task.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSaveEdit(task.id)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingTask(null)} className="p-2 text-[#FF453A] hover:bg-[#FF453A]/10 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditClick(task)} className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-all opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {editingTask === task.id ? (
                    <div className="space-y-3 mb-5">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3 text-sm font-medium text-white focus:border-brand outline-none transition-all"
                        placeholder="Task Title"
                      />
                      <textarea
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3 text-sm text-[#8E8E93] font-medium focus:border-brand outline-none transition-all min-h-[80px] resize-none"
                        placeholder="Task Description"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="font-bold text-base text-white mb-2 truncate">{task.title}</h4>
                      <p className="text-sm text-[#8E8E93] leading-relaxed mb-6 line-clamp-2 font-medium">{task.reason}</p>
                    </>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => startFocusSession(task.subjectId, task.topicId, task.duration)}
                      className="flex-1 py-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                    >
                      Start Session
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {!editingTask && (
                      <button
                        onClick={() => improveTask(task)}
                        disabled={isImproving === task.id}
                        className="p-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 text-[#8E8E93] hover:text-brand transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Optimize with AI"
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
            className="bg-[#1C1C1E] border border-white/5 p-16 text-center space-y-8 rounded-[32px]"
          >
            <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-[24px] flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-[#8E8E93]" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white tracking-tight">No Active Plan</h3>
              <p className="text-sm text-[#8E8E93] max-w-sm mx-auto leading-relaxed font-medium">
                Initialize the AI planner to generate an optimized study path based on your current progress.
              </p>
            </div>
            <button
              onClick={generatePlan}
              className="px-8 py-3.5 bg-brand text-white font-semibold hover:opacity-90 transition-opacity rounded-full text-sm shadow-sm"
            >
              Initialize Planner
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
