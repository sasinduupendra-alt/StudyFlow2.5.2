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

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-white">
              <ListTodo className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-white uppercase tracking-[0.3em]">Task Management</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-[0.15em]">Strategic <span className="text-white">Objectives</span></h2>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest mt-4">Manage and prioritize your study tasks with AI-driven SNR analysis.</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-white tabular-nums">{Math.round(progress)}%</p>
          </div>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="enterprise-button px-8 py-3"
          >
            <Plus className="w-4 h-4" />
            Add New Task
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-zinc-900 overflow-hidden border border-white/10">
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
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  "enterprise-card group transition-all duration-300",
                  task.completed ? "opacity-60 border-zinc-900" : "hover:border-brand/30"
                )}
              >
                <div className="p-5 flex items-start gap-5">
                  <button 
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "mt-1 p-1 transition-all transform hover:scale-110",
                      task.completed ? "text-brand" : "text-zinc-700 hover:text-brand"
                    )}
                  >
                    {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 className={cn(
                        "text-base font-bold uppercase tracking-widest truncate",
                        task.completed ? "line-through text-zinc-600" : "text-white"
                      )}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {task.subjectId && (
                          <span className="px-2.5 py-0.5 bg-transparent border border-white/20 rounded-none text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                            {subjects.find(s => s.id === task.subjectId)?.name}
                          </span>
                        )}
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-widest border",
                          calculateSNR(task, subjects.find(s => s.id === task.subjectId)) >= 2 
                            ? "bg-transparent border-white/30 text-white" 
                            : "bg-transparent border-white/10 text-zinc-500"
                        )}>
                          SNR: {calculateSNR(task, subjects.find(s => s.id === task.subjectId)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {task.description && (
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest line-clamp-1 flex-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Impact</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={cn("w-1.5 h-3 rounded-none", i < (task.impact / 2) ? "bg-white" : "bg-zinc-800")} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Effort</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={cn("w-1.5 h-3 rounded-none", i < (task.effort / 2) ? "bg-zinc-400" : "bg-zinc-800")} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-none transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-zinc-800 border border-dashed border-white/10 rounded-none">
              <div className="p-6 bg-transparent border border-white/5 rounded-none mb-6">
                <AlertCircle className="w-10 h-10 opacity-20 text-white" />
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-[0.2em]">No Active Objectives</p>
              <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mt-2">Initialize a new task to begin your study cycle.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg enterprise-card p-10 border-white/20 bg-black shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-transparent border border-white/20 flex items-center justify-center text-white">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white uppercase tracking-[0.3em] mb-1">Task Initialization</p>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-[0.15em]">New {activeTab} Objective</h3>
                </div>
              </div>

              <form onSubmit={handleAddTask} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Task Title</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="enterprise-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Detailed Description</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Add more details about this task..."
                    className="enterprise-input h-32 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Subject Association</label>
                  <select 
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="enterprise-input appearance-none"
                  >
                    <option value="">No Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Impact</label>
                      <span className="text-xs font-bold text-white">{newTaskImpact}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskImpact}
                      onChange={(e) => setNewTaskImpact(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-none appearance-none cursor-pointer accent-white"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Effort</label>
                      <span className="text-xs font-bold text-zinc-400">{newTaskEffort}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskEffort}
                      onChange={(e) => setNewTaskEffort(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-none appearance-none cursor-pointer accent-zinc-400"
                    />
                  </div>
                </div>

                <div className="p-5 bg-transparent border border-white/10 rounded-none">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Priority SNR Index</span>
                    <span className={cn(
                      "text-lg font-bold tabular-nums",
                      calculateSNR({ impact: newTaskImpact, effort: newTaskEffort, frequency: activeTab, subjectId: newTaskSubject } as Task, subjects.find(s => s.id === newTaskSubject)) >= 2 ? "text-white" : "text-zinc-500"
                    )}>
                      {calculateSNR({ impact: newTaskImpact, effort: newTaskEffort, frequency: activeTab, subjectId: newTaskSubject } as Task, subjects.find(s => s.id === newTaskSubject)).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-2">
                    High Signal / Low Noise ratio indicates a strategic must-do task.
                  </p>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="enterprise-button flex-1 py-4"
                  >
                    Commit Task
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
