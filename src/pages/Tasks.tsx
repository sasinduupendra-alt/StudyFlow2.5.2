import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, CheckCircle2, Circle, Trash2, Calendar, 
  Clock, AlertCircle, Filter, ChevronRight, ListTodo,
  LayoutGrid, List, MoreVertical, Edit2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Task, TaskFrequency, Subject } from '../types';
import { cn, calculateSNR } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection } from 'firebase/firestore';

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask, subjects, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<TaskFrequency>('Daily');
  const [viewMode, setViewMode] = useState<'Cycle' | 'Subject' | 'Optimization'>('Cycle');
  const [isAddingTask, setIsAddingTask] = useState(false);
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

  const completedCount = filteredTasks.filter(t => t.completed).length;
  const progress = filteredTasks.length > 0 ? (completedCount / filteredTasks.length) * 100 : 0;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

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

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskSubject('');
    setNewTaskImpact(5);
    setNewTaskEffort(5);
    setNewTaskDifficulty(5);
    setNewTaskLastReviewed('');
    setIsForTomorrow(false);
    setIsAddingTask(false);
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    toggleTask(id);

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { completed: newCompleted });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/tasks/${id}`);
      }
    }
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
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-12"
      >
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-[0_0_20px_var(--color-brand-glow)] rounded-xl">
              <ListTodo className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-brand uppercase tracking-[0.4em]">Task Management</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">Strategic <span className="text-brand drop-shadow-[0_0_15px_var(--color-brand-glow)]">Objectives</span></h2>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em] mt-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand-glow)]" />
            Priority SNR Index: Active // System Ready
          </p>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-2">Completion Rate</p>
            <p className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">{Math.round(progress)}%</p>
          </div>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="enterprise-button px-10 py-5"
          >
            <Plus className="w-5 h-5" />
            Initialize Objective
          </button>
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
          {['Cycle', 'Subject', 'Optimization'].map((mode) => (
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
          {viewMode === 'Cycle' ? (
            filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  subjects={subjects} 
                  tomorrowStr={tomorrowStr}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
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
                    placeholder="Enter Protocol..."
                    className="enterprise-input py-2 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Description</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Optional parameters..."
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
                    onClick={() => setIsAddingTask(false)}
                    className="flex-1 py-2 text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="enterprise-button flex-1 py-2 text-[8px] rounded-lg"
                  >
                    Commit
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

function TaskItem({ task, subjects, tomorrowStr, onToggle, onDelete }: { 
  task: Task, 
  subjects: Subject[], 
  tomorrowStr: string,
  onToggle: (id: string) => void,
  onDelete: (id: string) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "enterprise-card group transition-all duration-500 relative overflow-hidden",
        task.completed ? "opacity-40 border-zinc-900" : "hover:border-white/40"
      )}
    >
      <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="p-8 flex items-start gap-8 relative z-10">
        <button 
          onClick={() => onToggle(task.id)}
          className={cn(
            "mt-1 p-1 transition-all transform hover:scale-125",
            task.completed ? "text-white" : "text-zinc-800 hover:text-white"
          )}
        >
          {task.completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h4 className={cn(
              "text-xl font-black uppercase tracking-tighter truncate leading-none",
              task.completed ? "line-through text-zinc-600" : "text-white"
            )}>
              {task.title}
            </h4>
            <div className="flex items-center gap-3">
              {task.dueDate === tomorrowStr && (
                <span className="badge bg-white/10 text-white border-white/20">
                  Tomorrow
                </span>
              )}
              {task.subjectId && (
                <span className="badge badge-zinc">
                  {subjects.find(s => s.id === task.subjectId)?.name}
                </span>
              )}
              <span className={cn(
                "badge",
                calculateSNR(task, subjects.find(s => s.id === task.subjectId)) >= 2 
                  ? "badge-brand" 
                  : "badge-zinc"
              )}>
                SNR: {calculateSNR(task, subjects.find(s => s.id === task.subjectId)).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-12">
            {task.description && (
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] line-clamp-1 flex-1">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-8 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Impact</span>
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={cn("w-2 h-4 transition-all duration-500", i < (task.impact / 2) ? "bg-white" : "bg-zinc-900")} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Effort</span>
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={cn("w-2 h-4 transition-all duration-500", i < (task.effort / 2) ? "bg-zinc-500" : "bg-zinc-900")} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <button 
            onClick={() => onDelete(task.id)}
            className="p-3 text-zinc-800 hover:text-white hover:bg-white/5 transition-all"
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
