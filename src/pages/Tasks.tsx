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
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskImpact, setNewTaskImpact] = useState(5);
  const [newTaskEffort, setNewTaskEffort] = useState(5);
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
            <div className="w-12 h-12 bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <ListTodo className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-white uppercase tracking-[0.4em]">Task Management</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">Strategic <span className="text-white">Objectives</span></h2>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em] mt-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-white animate-pulse" />
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
          className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-1000"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-transparent border border-white/10 rounded-none w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative rounded-none",
              activeTab === tab ? "text-black bg-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
          >
            {tab} Cycle
          </button>
        ))}
      </div>

      {/* Task List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  "enterprise-card group transition-all duration-500 relative overflow-hidden",
                  task.completed ? "opacity-40 border-zinc-900" : "hover:border-white/40"
                )}
              >
                <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="p-8 flex items-start gap-8 relative z-10">
                  <button 
                    onClick={() => handleToggleTask(task.id)}
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
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-3 text-zinc-800 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-96 flex flex-col items-center justify-center enterprise-card border-dashed border-white/10 opacity-40">
              <div className="p-8 bg-white/5 border border-white/10 mb-8">
                <AlertCircle className="w-12 h-12 text-zinc-700" />
              </div>
              <p className="text-lg font-black text-white uppercase tracking-[0.3em]">No Active Objectives</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mt-4">Initialize a new task to begin your study cycle.</p>
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
              className="relative w-full max-w-2xl enterprise-card-premium p-12 shadow-2xl overflow-hidden"
            >
              <div className="scan-line" />
              
              <div className="relative z-10 flex items-center gap-8 mb-16">
                <div className="w-20 h-20 bg-white flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  <Plus className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] mb-4">Objective Initialization</p>
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">New {activeTab} Cycle</h3>
                </div>
              </div>

              <form onSubmit={handleAddTask} className="space-y-12 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Objective Title</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Define your strategic goal..."
                    className="enterprise-input text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Operational Details</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Provide context for this objective..."
                    className="enterprise-input h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Subject Association</label>
                    <select 
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                      className="enterprise-input appearance-none cursor-pointer"
                    >
                      <option value="">No Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-bold">Execution Timing</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setIsForTomorrow(false)}
                        className={cn(
                          "flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all",
                          !isForTomorrow ? "bg-white text-black border-white" : "bg-transparent text-zinc-500 border-white/10 hover:border-white/30"
                        )}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsForTomorrow(true)}
                        className={cn(
                          "flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all",
                          isForTomorrow ? "bg-white text-black border-white" : "bg-transparent text-zinc-500 border-white/10 hover:border-white/30"
                        )}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white/[0.02] border border-white/10 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Priority SNR</span>
                      <span className={cn(
                        "text-3xl font-black tabular-nums tracking-tighter",
                        calculateSNR({ impact: newTaskImpact, effort: newTaskEffort, frequency: activeTab, subjectId: newTaskSubject } as Task, subjects.find(s => s.id === newTaskSubject)) >= 2 ? "text-white" : "text-zinc-600"
                      )}>
                        {calculateSNR({ impact: newTaskImpact, effort: newTaskEffort, frequency: activeTab, subjectId: newTaskSubject } as Task, subjects.find(s => s.id === newTaskSubject)).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 overflow-hidden">
                      <motion.div 
                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        animate={{ width: `${Math.min(100, calculateSNR({ impact: newTaskImpact, effort: newTaskEffort, frequency: activeTab, subjectId: newTaskSubject } as Task, subjects.find(s => s.id === newTaskSubject)) * 20)}%` }}
                      />
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Impact Value</label>
                      <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{newTaskImpact}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskImpact}
                      onChange={(e) => setNewTaskImpact(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-none appearance-none cursor-pointer accent-white"
                    />
                  </div>
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Effort Required</label>
                      <span className="text-2xl font-black text-zinc-500 tabular-nums tracking-tighter">{newTaskEffort}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskEffort}
                      onChange={(e) => setNewTaskEffort(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-none appearance-none cursor-pointer accent-zinc-500"
                    />
                  </div>
                </div>

                <div className="flex gap-8 pt-12">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="flex-1 py-5 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="enterprise-button flex-1 py-5"
                  >
                    Commit Protocol
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
