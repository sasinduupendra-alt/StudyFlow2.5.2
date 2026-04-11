import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, CheckCircle2, Circle, Trash2, Calendar, 
  Clock, AlertCircle, Filter, ChevronRight, ListTodo,
  LayoutGrid, List, MoreVertical, Edit2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Task, TaskFrequency } from '../types';
import { cn } from '../lib/utils';
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
      const snrA = (a.impact || 5) / (a.effort || 5);
      const snrB = (b.impact || 5) / (b.effort || 5);
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand/10 border border-brand/20 text-brand">
              <ListTodo className="w-5 h-5" />
            </div>
            <span className="hud-label">TASK_COMMAND_CENTER</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Strategic_Objectives</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="hud-label !text-gray-600">COMPLETION_RATE</p>
            <p className="text-xl font-black tabular-nums">{Math.round(progress)}%</p>
          </div>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="scifi-button px-6"
          >
            <Plus className="w-4 h-4" />
            INITIALIZE_TASK
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="scifi-panel-sm p-1 overflow-hidden">
        <div 
          className="h-1 bg-brand shadow-[0_0_15px_var(--color-brand-glow)] transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-black/40 border border-border-dim w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
              activeTab === tab ? "text-brand bg-brand/5" : "text-gray-600 hover:text-white hover:bg-white/5"
            )}
          >
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTaskTab"
                className="absolute inset-0 border border-brand/30"
              />
            )}
            {tab}_CYCLE
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "scifi-panel group transition-all duration-300",
                  task.completed ? "opacity-50 border-border-dim" : "hover:border-brand/30"
                )}
              >
                <div className="p-4 flex items-start gap-4">
                  <button 
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "mt-1 p-1 transition-colors",
                      task.completed ? "text-brand" : "text-gray-700 hover:text-brand"
                    )}
                  >
                    {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={cn(
                        "text-sm font-black uppercase tracking-tight truncate",
                        task.completed && "line-through text-gray-600"
                      )}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {task.subjectId && (
                          <span className="px-2 py-0.5 bg-white/5 border border-border-dim text-[8px] font-black text-gray-500 uppercase tracking-widest">
                            {subjects.find(s => s.id === task.subjectId)?.name}
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 border text-[8px] font-black uppercase tracking-widest",
                          (task.impact / task.effort) >= 2 ? "bg-brand/10 border-brand/30 text-brand" : "bg-white/5 border-border-dim text-gray-500"
                        )}>
                          SNR: {((task.impact || 5) / (task.effort || 5)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {task.description && (
                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-tighter line-clamp-1 flex-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="hud-label !text-[7px]">SIG</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={cn("w-1 h-2", i < (task.impact / 2) ? "bg-brand" : "bg-white/10")} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="hud-label !text-[7px]">NSE</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={cn("w-1 h-2", i < (task.effort / 2) ? "bg-red-500/50" : "bg-white/10")} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-700 border border-dashed border-border-dim">
              <AlertCircle className="w-8 h-8 mb-4 opacity-20" />
              <p className="hud-label !text-gray-800 uppercase">NO_OBJECTIVES_ACTIVE</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2">INITIALIZE NEW TASK TO BEGIN CYCLE</p>
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
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md scifi-panel p-6 md:p-8 border-brand/30"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-brand/10 border border-brand/20 text-brand">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <label className="hud-label !text-gray-600">OBJECTIVE_INITIALIZATION</label>
                  <h3 className="text-sm font-black uppercase tracking-tighter">New_{activeTab}_Task</h3>
                </div>
              </div>

              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="hud-label !text-gray-600">TASK_IDENTIFIER</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="ENTER MISSION OBJECTIVE..."
                    className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="hud-label !text-gray-600">DETAILED_INTEL</label>
                  <textarea 
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="ADDITIONAL PARAMETERS..."
                    className="w-full bg-black/40 border border-border-dim px-4 py-3 h-24 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="hud-label !text-gray-600">SUBJECT_LINKAGE</label>
                  <select 
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors"
                  >
                    <option value="">NONE</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="hud-label !text-gray-600">SIGNAL (IMPACT)</label>
                      <span className="text-[10px] font-black text-brand">{newTaskImpact}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskImpact}
                      onChange={(e) => setNewTaskImpact(parseInt(e.target.value))}
                      className="w-full accent-brand bg-white/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="hud-label !text-gray-600">NOISE (EFFORT)</label>
                      <span className="text-[10px] font-black text-red-500">{newTaskEffort}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={newTaskEffort}
                      onChange={(e) => setNewTaskEffort(parseInt(e.target.value))}
                      className="w-full accent-red-500 bg-white/5"
                    />
                  </div>
                </div>

                <div className="p-3 bg-brand/5 border border-brand/10">
                  <div className="flex justify-between items-center">
                    <span className="hud-label !text-gray-500">PRIORITY_SNR_INDEX</span>
                    <span className={cn(
                      "text-sm font-black",
                      (newTaskImpact / newTaskEffort) >= 2 ? "text-brand" : "text-white"
                    )}>
                      {(newTaskImpact / newTaskEffort).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[8px] text-gray-600 font-black uppercase mt-1">
                    High Signal / Low Noise = Strategic Must-Do
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:text-white transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    type="submit"
                    className="scifi-button flex-1 py-3"
                  >
                    COMMIT_TASK
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
