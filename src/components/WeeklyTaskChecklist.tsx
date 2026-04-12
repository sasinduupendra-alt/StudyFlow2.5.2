import React, { useState } from 'react';
import { CheckCircle2, Circle, BookOpen, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WeeklyTask } from '../types';
import { INITIAL_SUBJECTS } from '../constants';

export default function WeeklyTaskChecklist() {
  const { subjects, setSubjects, user, addToast } = useAppStore();
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  const updateSubjectTasks = async (subjectId: string, newTasks: WeeklyTask[]) => {
    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, weeklyTasks: newTasks } : s);
    setSubjects(newSubjects);

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'subjects', subjectId), {
          weeklyTasks: newTasks
        });
      } catch (error) {
        console.error('Failed to update tasks in cloud:', error);
        addToast('Failed to sync tasks to cloud', 'error');
      }
    }
  };

  const toggleTask = (subjectId: string, taskId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const defaultTasks = INITIAL_SUBJECTS.find(s => s.id === subjectId)?.weeklyTasks || [];
    const currentTasks = subject.weeklyTasks || defaultTasks;

    const newTasks = currentTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateSubjectTasks(subjectId, newTasks);
  };

  const addTask = (subjectId: string) => {
    if (!newTaskTitle.trim()) return;
    
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const defaultTasks = INITIAL_SUBJECTS.find(s => s.id === subjectId)?.weeklyTasks || [];
    const currentTasks = subject.weeklyTasks || defaultTasks;

    const newTasks = [...currentTasks, {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle.trim(),
      completed: false
    }];

    updateSubjectTasks(subjectId, newTasks);
    setNewTaskTitle('');
    setEditingSubjectId(null);
  };

  const deleteTask = (subjectId: string, taskId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const defaultTasks = INITIAL_SUBJECTS.find(s => s.id === subjectId)?.weeklyTasks || [];
    const currentTasks = subject.weeklyTasks || defaultTasks;

    const newTasks = currentTasks.filter(t => t.id !== taskId);
    updateSubjectTasks(subjectId, newTasks);
  };

  const saveEditTask = (subjectId: string, taskId: string) => {
    if (!editTaskTitle.trim()) return;

    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const defaultTasks = INITIAL_SUBJECTS.find(s => s.id === subjectId)?.weeklyTasks || [];
    const currentTasks = subject.weeklyTasks || defaultTasks;

    const newTasks = currentTasks.map(t => 
      t.id === taskId ? { ...t, title: editTaskTitle.trim() } : t
    );
    updateSubjectTasks(subjectId, newTasks);
    setEditingTaskId(null);
  };

  const resetAllTasks = async () => {
    const newSubjects = subjects.map(s => {
      const defaultTasks = INITIAL_SUBJECTS.find(is => is.id === s.id)?.weeklyTasks || [];
      const currentTasks = s.weeklyTasks || defaultTasks;
      return {
        ...s,
        weeklyTasks: currentTasks.map(t => ({ ...t, completed: false }))
      };
    });
    setSubjects(newSubjects);

    if (user) {
      try {
        for (const subject of newSubjects) {
          await updateDoc(doc(db, 'users', user.uid, 'subjects', subject.id), {
            weeklyTasks: subject.weeklyTasks
          });
        }
        addToast('All tasks reset for the new week!', 'success');
      } catch (error) {
        console.error('Failed to reset tasks in cloud:', error);
        addToast('Failed to sync reset to cloud', 'error');
      }
    } else {
      addToast('All tasks reset for the new week!', 'success');
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8"
      >
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white leading-none">Weekly Objectives</h2>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white animate-pulse" />
              Core Requirements Per Node
            </p>
          </div>
        </div>
        <button 
          onClick={resetAllTasks}
          className="px-8 py-3 text-[10px] font-mono uppercase tracking-[0.2em] bg-white text-black hover:bg-zinc-200 transition-colors rounded-none font-bold"
        >
          Reset Cycle
        </button>
      </motion.div>

      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {subjects.map((subject) => {
          const defaultTasks = INITIAL_SUBJECTS.find(s => s.id === subject.id)?.weeklyTasks || [];
          const tasks = subject.weeklyTasks || defaultTasks;
          const progress = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

          return (
            <motion.div 
              key={subject.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="enterprise-card overflow-hidden flex flex-col group relative"
            >
              <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="p-8 border-b border-white/5 relative overflow-hidden bg-white/[0.02]">
                <div className="relative z-10 flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-white font-bold">{subject.name}</h3>
                  <span className="text-[10px] font-mono text-zinc-600 tabular-nums tracking-tighter">{Math.round(progress)}%</span>
                </div>
                <div className="relative z-10 h-[2px] w-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              <div className="p-6 space-y-2 flex-1">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 transition-all group/task border rounded-none",
                        task.completed ? "bg-white/[0.02] border-white/5" : "bg-transparent hover:bg-white/5 border-white/5"
                      )}
                    >
                      <button
                        onClick={() => toggleTask(subject.id, task.id)}
                        className="shrink-0 focus:outline-none"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-800 group-hover/task:text-zinc-600" />
                        )}
                      </button>
                      
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex items-center gap-3">
                          <input
                            type="text"
                            value={editTaskTitle}
                            onChange={(e) => setEditTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditTask(subject.id, task.id)}
                            className="flex-1 bg-black text-[10px] font-mono uppercase px-3 py-2 outline-none border border-white/30 focus:border-white transition-colors rounded-none text-white"
                            autoFocus
                          />
                          <button onClick={() => saveEditTask(subject.id, task.id)} className="text-white hover:text-zinc-300"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingTaskId(null)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <span className={cn(
                            "text-[10px] font-mono uppercase tracking-[0.15em] flex-1 text-left leading-relaxed",
                            task.completed ? "text-zinc-700 line-through" : "text-zinc-300"
                          )}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover/task:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditTaskTitle(task.title);
                              }}
                              className="p-2 text-zinc-700 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => deleteTask(subject.id, task.id)}
                              className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {editingSubjectId === subject.id ? (
                  <div className="flex items-center gap-3 p-3 mt-4">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask(subject.id)}
                      placeholder="NEW_OBJECTIVE..."
                      className="flex-1 bg-black border border-white/10 px-4 py-3 text-[10px] font-mono uppercase focus:border-white/30 outline-none transition-colors rounded-none text-white"
                      autoFocus
                    />
                    <button 
                      onClick={() => addTask(subject.id)}
                      className="p-3 bg-white text-black hover:bg-zinc-200 transition-colors rounded-none"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingSubjectId(null);
                        setNewTaskTitle('');
                      }}
                      className="p-3 bg-transparent border border-white/10 text-zinc-700 hover:text-white hover:border-white/30 transition-colors rounded-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSubjectId(subject.id)}
                    className="w-full flex items-center justify-center gap-3 p-4 mt-4 border border-dashed border-white/10 text-zinc-700 hover:text-white hover:border-white/30 transition-all text-[10px] font-mono uppercase tracking-[0.2em] rounded-none bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Initialize Task
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
