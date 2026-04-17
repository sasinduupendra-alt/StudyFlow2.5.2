import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, CheckCircle2, Circle, Trash2, Calendar, 
  Clock, AlertCircle, Filter, ChevronRight, ListTodo,
  LayoutGrid, List, MoreVertical, Edit2, Target, Sparkles, RefreshCw, Download
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Task, TaskFrequency, Subject } from '../types';
import { cn, calculateSNR } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { getAI } from '../services/gemini';
import { Type } from '@google/genai';
import WeeklyTaskChecklist from '../components/WeeklyTaskChecklist';

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask, subjects, user, addToast, updateTask, dailyCommits } = useAppStore();
  const [activeTab, setActiveTab] = useState<TaskFrequency>('Daily');
  const [viewMode, setViewMode] = useState<'Cycle' | 'Subject' | 'Optimization' | 'Execution'>('Execution');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskImpact, setNewTaskImpact] = useState(5);
  const [newTaskEffort, setNewTaskEffort] = useState(5);
  const [newTaskDifficulty, setNewTaskDifficulty] = useState(5);
  const [newTaskLastReviewed, setNewTaskLastReviewed] = useState('');
  const [isForTomorrow, setIsForTomorrow] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const filteredTasks = tasks
    .filter(t => t.frequency === activeTab)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const subjectA = subjects.find(s => s.id === a.subjectId);
      const subjectB = subjects.find(s => s.id === b.subjectId);
      const snrA = calculateSNR(a, subjectA);
      const snrB = calculateSNR(b, subjectB);
      return snrB - snrA;
    });

  const executionTasks = tasks.filter(t => 
    !t.completed && 
    (dailyCommits.includes(t.id) || (t.frequency === 'Daily' && (!t.dueDate || t.dueDate <= todayStr)))
  );

  const completedCount = filteredTasks.filter(t => t.completed).length;
  const progress = filteredTasks.length > 0 ? (completedCount / filteredTasks.length) * 100 : 0;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (editingTask) {
      const updatedTask: Partial<Task> = {
        title: newTaskTitle,
        description: newTaskDesc,
        frequency: activeTab,
        subjectId: newTaskSubject || undefined,
        dueDate: isForTomorrow ? tomorrowStr : todayStr,
        impact: newTaskImpact,
        effort: newTaskEffort,
        difficulty: newTaskDifficulty,
        lastReviewed: newTaskLastReviewed || undefined,
      };

      updateTask(editingTask.id, updatedTask);

      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'tasks', editingTask.id), updatedTask, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/tasks/${editingTask.id}`);
        }
      }
    } else {
      const id = Math.random().toString(36).substring(2, 9);
      const createdAt = new Date().toISOString();
      const taskData: Task = {
        id,
        title: newTaskTitle,
        description: newTaskDesc,
        frequency: activeTab,
        subjectId: newTaskSubject || undefined,
        completed: false,
        createdAt,
        dueDate: isForTomorrow ? tomorrowStr : todayStr,
        impact: newTaskImpact,
        effort: newTaskEffort,
        difficulty: newTaskDifficulty,
        lastReviewed: newTaskLastReviewed || undefined,
      };

      // Update local store
      addTask(taskData);

      // Update Firestore if logged in
      if (user) {
        try {
          await setDoc(doc(collection(db, 'users', user.uid, 'tasks'), id), taskData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/tasks/${id}`);
        }
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskSubject('');
    setNewTaskImpact(5);
    setNewTaskEffort(5);
    setNewTaskDifficulty(5);
    setNewTaskLastReviewed('');
    setIsForTomorrow(false);
    setIsAddingTask(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || '');
    setNewTaskSubject(task.subjectId || '');
    setNewTaskImpact(task.impact || 5);
    setNewTaskEffort(task.effort || 5);
    setNewTaskDifficulty(task.difficulty || 5);
    setNewTaskLastReviewed(task.lastReviewed || '');
    setIsForTomorrow(task.dueDate === tomorrowStr);
    setActiveTab(task.frequency as TaskFrequency);
    setIsAddingTask(true);
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    toggleTask(id);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', id), { completed: newCompleted }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/tasks/${id}`);
      }
    }
  };

  const handleAuditTasks = async () => {
    setIsAuditing(true);
    try {
      const ai = getAI();
      const tasksToAudit = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        subject: subjects.find(s => s.id === t.subjectId)?.name || 'Unknown'
      }));

      const prompt = `
        You are an expert academic study planner. Evaluate the following tasks and categorize them as "Signal" or "Noise" based on the following rules:
        
        1. Combined Maths: Signal is problem-solving volume (Timed Practice, Structure Building, Pure Logic Check). Noise is formula listing, reading solved examples, organization.
        2. Physics: Signal is conceptual visualization and unit accuracy (Unit/Dimension Audit, Variable Manipulation, Practical Logic). Noise is passive video watching, definition cramming.
        3. Chemistry: Signal is reaction mechanisms, Inorganic Trends, Calculation Drills. Noise is color-coding notes, general reading, flashcard hoarding.
        4. General: Signal is active recall, problem solving, and application. Noise is passive reading, organizing, making things look pretty, or watching videos without solving.

        For each task, assign an "impact" score from 1 to 10. 
        - Signal tasks MUST have an impact score between 7 and 10.
        - Noise tasks MUST have an impact score between 1 and 6.

        Tasks to evaluate:
        ${JSON.stringify(tasksToAudit, null, 2)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                impact: { type: Type.NUMBER }
              },
              required: ['id', 'impact']
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      
      for (const update of result) {
        updateTask(update.id, { impact: update.impact });
        if (user) {
          setDoc(doc(db, 'users', user.uid, 'tasks', update.id), { impact: update.impact }, { merge: true }).catch(err => console.error(err));
        }
      }

      addToast('Tasks successfully audited and categorized!', 'success');
    } catch (error) {
      console.error('Failed to audit tasks:', error);
      addToast('Failed to audit tasks. Please try again.', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExportTasks = () => {
    if (tasks.length === 0) {
      addToast('No tasks to export.', 'info');
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Description',
      'Frequency',
      'Completed',
      'Subject',
      'Created At',
      'Impact',
      'Effort',
      'Due Date',
      'Difficulty',
      'Last Reviewed',
      'SNR Index'
    ];

    const rows = tasks.map(t => {
      const subject = subjects.find(s => s.id === t.subjectId);
      const snr = calculateSNR(t, subject);
      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.frequency,
        t.completed ? 'TRUE' : 'FALSE',
        subject ? subject.name : 'Uncategorized',
        t.createdAt,
        t.impact,
        t.effort,
        t.dueDate || '',
        t.difficulty || '',
        t.lastReviewed || '',
        snr.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `strategic_objectives_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('Strategic Objectives exported successfully.', 'success');
  };

  const handleDeleteTask = async (id: string) => {
    deleteTask(id);

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
      }
    }
  };

  const tabs: TaskFrequency[] = ['Daily', 'Weekly', 'Monthly'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto relative min-h-screen">
      <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.03]" />

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-12 border-b border-white/10 relative overflow-hidden group"
      >
        <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-1000">
          <img 
            src="https://picsum.photos/seed/neural-tasks/1200/400?grayscale&blur=10" 
            className="w-full h-full object-cover"
            alt=""
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-[0_0_20px_var(--color-brand-glow)] rounded-xl">
              <ListTodo className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-brand uppercase tracking-[0.4em]">Task Management</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">Strategic <span className="text-brand glow-text">Objectives</span></h2>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em] mt-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand-glow)]" />
            Priority SNR Index: Active // System Ready
          </p>
        </div>

        <div className="flex items-center gap-8 relative z-10">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-2">Completion Rate</p>
            <p className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">{Math.round(progress)}%</p>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setIsAddingTask(true)}
              className="enterprise-button px-10 py-5 shadow-[0_0_30px_var(--color-brand-glow)]"
            >
              <Plus className="w-5 h-5" />
              Initialize Objective
            </button>
            {viewMode === 'Execution' && (
              <button 
                onClick={handleAuditTasks}
                disabled={isAuditing}
                className="px-4 py-2 bg-brand/10 text-brand border border-brand/30 hover:bg-brand/20 transition-colors rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isAuditing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Audit Tasks (AI)
              </button>
            )}
            <button 
              onClick={handleExportTasks}
              className="px-4 py-2 bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <Download className="w-3 h-3" />
              Export Data (CSV)
            </button>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/5 overflow-hidden border border-white/10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-brand shadow-[0_0_15px_var(--color-brand-glow)] transition-all duration-1000"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex gap-2 p-1 bg-transparent border border-white/10 rounded-full w-fit">
          {['Execution', 'Cycle', 'Subject', 'Optimization'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={cn(
                "px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative rounded-full",
                viewMode === mode ? "text-black bg-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              {mode} View
            </button>
          ))}
        </div>

        {viewMode === 'Cycle' && (
          <div className="flex gap-2 p-1 bg-transparent border border-white/10 rounded-full w-fit">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative rounded-full",
                  activeTab === tab ? "text-black bg-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-12"
      >
        <AnimatePresence mode="popLayout">
          {viewMode === 'Execution' ? (
            <div className="space-y-8">
              {/* Quick Capture */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-brand" />
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const id = Math.random().toString(36).substring(2, 9);
                        const taskData: Task = {
                          id,
                          title: e.currentTarget.value.trim(),
                          frequency: 'Daily',
                          completed: false,
                          createdAt: new Date().toISOString(),
                          impact: 3, // Default to noise
                          effort: 5,
                        };
                        addTask(taskData);
                        if (user) {
                          setDoc(doc(collection(db, 'users', user.uid, 'tasks'), id), taskData).catch(err => console.error(err));
                        }
                        e.currentTarget.value = '';
                        addToast('Idea captured to Noise column', 'info');
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SIGNAL Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-brand/30 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand/20 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">SIGNAL</h3>
                      <p className="text-[9px] font-mono text-brand uppercase tracking-[0.2em]">Focus here 80%</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{executionTasks.filter(t => t.impact >= 7).length} Tasks</span>
                </div>
                <div className="space-y-4">
                  {executionTasks.filter(t => t.impact >= 7).map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      subjects={subjects} 
                      tomorrowStr={tomorrowStr}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                    />
                  ))}
                  {executionTasks.filter(t => t.impact >= 7).length === 0 && (
                    <div className="p-8 text-center border border-dashed border-white/10 bg-white/5 rounded-xl">
                      <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">No high-signal tasks.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* NOISE Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                      <List className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-zinc-400 uppercase tracking-tighter">NOISE</h3>
                      <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Avoid/Batch 20%</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-zinc-600">{executionTasks.filter(t => t.impact < 7).length} Tasks</span>
                </div>
                <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                  {executionTasks.filter(t => t.impact < 7).map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      subjects={subjects} 
                      tomorrowStr={tomorrowStr}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                    />
                  ))}
                  {executionTasks.filter(t => t.impact < 7).length === 0 && (
                    <div className="p-8 text-center border border-dashed border-white/10 bg-white/5 rounded-xl">
                      <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">No noise tasks.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Signal Check Reference */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-8">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand" />
                  Daily Signal Check
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                    <h5 className="text-xs font-bold text-white mb-2">Combined Maths</h5>
                    <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">Is your pen moving? (If no, it's Noise). Focus on problem-solving volume.</p>
                  </div>
                  <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                    <h5 className="text-xs font-bold text-white mb-2">Physics</h5>
                    <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">Can you explain the concept to a 10-year-old? (If no, it's Noise). Focus on conceptual visualization.</p>
                  </div>
                  <div className="p-4 bg-black/50 rounded-xl border border-white/5">
                    <h5 className="text-xs font-bold text-white mb-2">Chemistry</h5>
                    <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">Can you draw the mechanism/reaction on a blank wall? (If no, it's Noise). Focus on active recall.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'Cycle' ? (
            activeTab === 'Weekly' ? (
              <div className="-mx-6 md:-mx-12 -mt-6 md:-mt-12">
                <WeeklyTaskChecklist />
              </div>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  subjects={subjects} 
                  tomorrowStr={tomorrowStr}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              ))
            ) : (
              <EmptyTasks />
            )
          ) : viewMode === 'Subject' ? (
            subjects.map(subject => {
              const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
              if (subjectTasks.length === 0) return null;
              
              return (
                <div key={subject.id} className="space-y-6">
                  <div className="flex items-center gap-4 border-l-4 border-white pl-6 py-2">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{subject.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{subjectTasks.length} Objectives</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {subjectTasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        subjects={subjects} 
                        tomorrowStr={tomorrowStr}
                        onToggle={handleToggleTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-6">
              <div className="p-6 enterprise-card bg-white/5 border-white/10 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <AlertCircle className="w-6 h-6 text-white" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">SNR Optimization Insights</h3>
                </div>
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-[0.1em] leading-relaxed">
                  The following tasks have a low Signal-to-Noise Ratio (SNR &lt; 2.0). Review these objectives to ensure they are worth your time. Consider increasing their impact or decreasing the effort required.
                </p>
              </div>

              {tasks
                .filter(t => !t.completed)
                .map(t => ({ task: t, snr: calculateSNR(t, subjects.find(s => s.id === t.subjectId)) }))
                .filter(item => item.snr < 2.0)
                .sort((a, b) => a.snr - b.snr)
                .map(({ task, snr }) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="enterprise-card p-6 border-white/10 hover:border-white/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-white/10 text-white text-[9px] font-bold uppercase tracking-[0.2em]">
                            SNR: {snr.toFixed(2)}
                          </span>
                          <h4 className="text-lg font-bold text-white">{task.title}</h4>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono mb-4">{task.description || 'No description provided.'}</p>
                        
                        <div className="flex flex-wrap gap-4 mb-4">
                          <div className="px-3 py-2 bg-black/50 border border-white/5">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] block mb-1">Impact</span>
                            <span className="text-sm font-bold text-white">{task.impact || 5}/10</span>
                          </div>
                          <div className="px-3 py-2 bg-black/50 border border-white/5">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] block mb-1">Effort</span>
                            <span className="text-sm font-bold text-white">{task.effort || 5}/10</span>
                          </div>
                          {task.difficulty && (
                            <div className="px-3 py-2 bg-black/50 border border-white/5">
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] block mb-1">Difficulty</span>
                              <span className="text-sm font-bold text-white">{task.difficulty}/10</span>
                            </div>
                          )}
                          {task.lastReviewed && (
                            <div className="px-3 py-2 bg-black/50 border border-white/5">
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] block mb-1">Last Review</span>
                              <span className="text-sm font-bold text-white">{new Date(task.lastReviewed).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-white/5 p-4 border border-white/10">
                        <h5 className="text-[10px] font-mono text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <div className="w-1 h-1 bg-white rounded-full" />
                          Improvement Suggestions
                        </h5>
                        <ul className="space-y-3">
                          {(task.effort || 5) > 5 && (
                            <li className="text-xs text-zinc-400 font-mono leading-relaxed flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-zinc-600 shrink-0" />
                              <span><strong>High Effort Detected:</strong> Break this task into smaller, manageable sub-tasks. Can you automate or delegate parts of this?</span>
                            </li>
                          )}
                          {(task.impact || 5) < 5 && (
                            <li className="text-xs text-zinc-400 font-mono leading-relaxed flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-zinc-600 shrink-0" />
                              <span><strong>Low Impact Detected:</strong> Re-evaluate the necessity of this task. Does it directly contribute to your core objectives? Consider dropping it if not.</span>
                            </li>
                          )}
                          {task.difficulty && task.difficulty >= 8 && (
                            <li className="text-xs text-zinc-400 font-mono leading-relaxed flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-zinc-600 shrink-0" />
                              <span><strong>High Difficulty:</strong> This is a challenging task. Ensure you schedule it during your peak focus hours and eliminate distractions.</span>
                            </li>
                          )}
                          {task.lastReviewed && Math.ceil((new Date().getTime() - new Date(task.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)) > 14 && (
                            <li className="text-xs text-zinc-400 font-mono leading-relaxed flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-zinc-600 shrink-0" />
                              <span><strong>Spaced Repetition Alert:</strong> It's been over 2 weeks since you last reviewed this. Prioritize it to prevent knowledge decay.</span>
                            </li>
                          )}
                          {(task.effort || 5) <= 5 && (task.impact || 5) >= 5 && (!task.difficulty || task.difficulty < 8) && (!task.lastReviewed || Math.ceil((new Date().getTime() - new Date(task.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)) <= 14) && (
                            <li className="text-xs text-zinc-400 font-mono leading-relaxed flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-zinc-600 shrink-0" />
                              <span><strong>General Optimization:</strong> Review the task's subject alignment. Assigning it to a 'Critical' or 'Weak' subject will boost its strategic value.</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              {tasks.filter(t => !t.completed && calculateSNR(t, subjects.find(s => s.id === t.subjectId)) < 2.0).length === 0 && (
                <div className="p-12 text-center border border-white/10 bg-white/5">
                  <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-sm font-mono text-zinc-400 uppercase tracking-[0.2em]">All active tasks have optimal SNR.</p>
                </div>
              )}
            </div>
          )}
          {viewMode === 'Subject' && tasks.filter(t => !t.subjectId).length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-4 border-zinc-800 pl-6 py-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-500">Uncategorized</h3>
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{tasks.filter(t => !t.subjectId).length} Objectives</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {tasks.filter(t => !t.subjectId).map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    subjects={subjects} 
                    tomorrowStr={tomorrowStr}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                  />
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAddingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingTask(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[320px] enterprise-card-premium p-5 shadow-2xl overflow-hidden rounded-2xl border-white/30"
            >
              <div className="scan-line" />
              
              <div className="relative z-10 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[7px] font-mono text-zinc-500 uppercase tracking-[0.4em] mb-0.5">Initialization</p>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">New {activeTab}</h3>
                </div>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Objective Title</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="enterprise-input py-2 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Description</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="enterprise-input py-2 text-xs min-h-[60px] rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Subject</label>
                    <select 
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                      className="enterprise-input py-2 text-xs rounded-lg"
                    >
                      <option value="">None</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Timing</label>
                    <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsForTomorrow(false)}
                        className={cn(
                          "flex-1 py-1 text-[8px] font-bold uppercase tracking-[0.2em] rounded-md transition-all",
                          !isForTomorrow ? "bg-white text-black" : "bg-transparent text-zinc-500"
                        )}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsForTomorrow(true)}
                        className={cn(
                          "flex-1 py-1 text-[8px] font-bold uppercase tracking-[0.2em] rounded-md transition-all",
                          isForTomorrow ? "bg-white text-black" : "bg-transparent text-zinc-500"
                        )}
                      >
                        Tmrw
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Impact</label>
                      <span className="text-[8px] font-mono text-white">{newTaskImpact}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskImpact}
                      onChange={(e) => setNewTaskImpact(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Effort</label>
                      <span className="text-[8px] font-mono text-white">{newTaskEffort}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskEffort}
                      onChange={(e) => setNewTaskEffort(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-zinc-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Difficulty</label>
                      <span className="text-[8px] font-mono text-white">{newTaskDifficulty}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskDifficulty}
                      onChange={(e) => setNewTaskDifficulty(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-zinc-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Last Reviewed</label>
                    <input 
                      type="date"
                      value={newTaskLastReviewed}
                      onChange={(e) => setNewTaskLastReviewed(e.target.value)}
                      className="enterprise-input py-1 text-[10px] rounded-lg w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2 text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="enterprise-button flex-1 py-2 text-[8px] rounded-lg"
                  >
                    {editingTask ? 'Update' : 'Commit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskItem({ task, subjects, tomorrowStr, onToggle, onDelete, onEdit }: { 
  task: Task, 
  subjects: Subject[], 
  tomorrowStr: string,
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
  onEdit: (task: Task) => void
}) {
  const subject = subjects.find(s => s.id === task.subjectId);
  const snr = calculateSNR(task, subject);
  const todayStr = new Date().toISOString().split('T')[0];

  const getPriorityColor = (impact: number) => {
    if (impact >= 8) return "bg-red-500/20 text-red-500 border-red-500/30";
    if (impact >= 6) return "bg-orange-500/20 text-orange-500 border-orange-500/30";
    if (impact >= 4) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    return "bg-zinc-500/10 text-zinc-500 border-white/5";
  };

  const getPriorityLabel = (impact: number) => {
    if (impact >= 8) return "Critical";
    if (impact >= 6) return "High";
    if (impact >= 4) return "Medium";
    return "Low";
  };

  const isOverdue = task.dueDate && task.dueDate < todayStr && !task.completed;
  const isDueToday = task.dueDate === todayStr;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.002 }}
      className={cn(
        "enterprise-card group transition-all duration-300 relative overflow-hidden backdrop-blur-sm",
        task.completed 
          ? "opacity-60 bg-white/[0.02] border-white/5 grayscale-[0.5]" 
          : "hover:border-white/20 bg-white/[0.05]"
      )}
    >
      <div className={cn(
        "absolute inset-y-0 left-0 w-1",
        task.completed ? "bg-zinc-800" : (task.impact >= 7 ? "bg-brand" : "bg-zinc-600")
      )} />
      
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
        <div className="flex items-start gap-6 w-full md:w-auto">
          <button 
            onClick={() => onToggle(task.id)}
            className={cn(
              "p-1 transition-all transform hover:scale-110 shrink-0",
              task.completed ? "text-brand" : "text-zinc-700 hover:text-white"
            )}
          >
            {task.completed ? (
              <CheckCircle2 className="w-8 h-8 fill-brand/10" />
            ) : (
              <Circle className="w-8 h-8" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className={cn(
                  "text-xl md:text-2xl font-black uppercase tracking-tighter transition-all",
                  task.completed ? "line-through text-zinc-600" : "text-white"
                )}>
                  {task.title}
                </h4>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                    getPriorityColor(task.impact)
                  )}>
                    {getPriorityLabel(task.impact)} Priority
                  </span>
                  
                  {task.completed && (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                      Completed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {task.dueDate && (
                  <div className={cn(
                    "flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border",
                    isOverdue ? "text-red-500 border-red-500/20 bg-red-500/5" : 
                    isDueToday ? "text-yellow-500 border-yellow-500/20 bg-yellow-500/5" :
                    task.dueDate === tomorrowStr ? "text-blue-400 border-blue-400/20 bg-blue-400/5" :
                    "text-zinc-500 border-white/5 bg-white/5"
                  )}>
                    <Calendar className="w-3 h-3" />
                    {isOverdue ? "Overdue: " : isDueToday ? "Today: " : ""}
                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                )}
                
                {subject && (
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" style={{ backgroundColor: subject.gradient.includes('from-') ? subject.gradient.split('from-')[1].split(' ')[0] : undefined }} />
                    {subject.name}
                  </div>
                )}

                <div className={cn(
                  "flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border",
                  snr >= 2 ? "text-brand border-brand/20 bg-brand/5" : "text-zinc-500 border-white/5 bg-white/5"
                )}>
                  SNR {snr.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {task.description && (
                <p className={cn(
                  "text-[10px] font-mono uppercase tracking-[0.2em] leading-relaxed max-w-2xl",
                  task.completed ? "text-zinc-700" : "text-zinc-500"
                )}>
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center gap-8 shrink-0 py-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.3em] font-black">Signal Strength</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-2.5 h-3.5 rounded-sm transition-all duration-700", 
                          i < (task.impact / 2) 
                            ? (task.completed ? "bg-zinc-800" : "bg-white shadow-[0_0_8px_rgba(255,255,255,0.2)]") 
                            : "bg-zinc-900"
                        )} 
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.3em] font-black">Entropy Floor</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-2.5 h-3.5 rounded-sm transition-all duration-700", 
                          i < (task.effort / 2) 
                            ? (task.completed ? "bg-zinc-800" : "bg-zinc-500") 
                            : "bg-zinc-900"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={() => onEdit(task)}
            className="p-3 text-zinc-700 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Edit Task"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Delete Task"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyTasks() {
  return (
    <div className="h-96 flex flex-col items-center justify-center enterprise-card border-dashed border-white/10 opacity-40">
      <div className="p-8 bg-white/5 border border-white/10 mb-8">
        <AlertCircle className="w-12 h-12 text-zinc-700" />
      </div>
      <p className="text-lg font-black text-white uppercase tracking-[0.3em]">No Active Objectives</p>
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-4">Initialize a new task to begin your study cycle.</p>
    </div>
  );
}
