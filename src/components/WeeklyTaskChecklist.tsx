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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-transparent border border-white/20 text-white rounded-none">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-white">WEEKLY_FOCUS_TASKS</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">CORE_REQUIREMENTS_PER_NODE</p>
          </div>
        </div>
        <button 
          onClick={resetAllTasks}
          className="px-8 py-3 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors rounded-none"
        >
          RESET_CYCLE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map((subject, sIndex) => {
          const defaultTasks = INITIAL_SUBJECTS.find(s => s.id === subject.id)?.weeklyTasks || [];
          const tasks = subject.weeklyTasks || defaultTasks;
          const progress = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

          return (
            <motion.div 
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIndex * 0.1 }}
              className="bg-transparent border border-white/10 overflow-hidden flex flex-col group rounded-none"
            >
              <div className="p-8 border-b border-white/10 relative overflow-hidden bg-white/5">
                <div className="relative z-10 flex items-center justify-between mb-6">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white">{subject.name}</h3>
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="relative z-10 h-[2px] w-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              <div className="p-6 space-y-3 flex-1">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 transition-all group/task border border-transparent rounded-none",
                        task.completed ? "bg-white/5 border-white/10" : "bg-transparent hover:bg-white/5 border border-white/10"
                      )}
                    >
                      <button
                        onClick={() => toggleTask(subject.id, task.id)}
                        className="shrink-0 focus:outline-none"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 group-hover/task:text-zinc-400" />
                        )}
                      </button>
                      
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex items-center gap-3">
                          <input
                            type="text"
                            value={editTaskTitle}
                            onChange={(e) => setEditTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditTask(subject.id, task.id)}
                            className="flex-1 bg-black text-[10px] font-mono uppercase px-3 py-2 outline-none border border-white/50 focus:border-white transition-colors rounded-none"
                            autoFocus
                          />
                          <button onClick={() => saveEditTask(subject.id, task.id)} className="text-white hover:text-zinc-300"><Check className="w-5 h-5" /></button>
                          <button onClick={() => setEditingTaskId(null)} className="text-red-500 hover:text-red-400"><X className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <>
                          <span className={cn(
                            "text-[10px] font-mono uppercase tracking-widest flex-1 text-left leading-relaxed",
                            task.completed ? "text-zinc-600 line-through" : "text-white"
                          )}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover/task:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditTaskTitle(task.title);
                              }}
                              className="p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteTask(subject.id, task.id)}
                              className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
                      className="flex-1 bg-black border border-white/10 px-4 py-3 text-[10px] font-mono uppercase focus:border-white/50 outline-none transition-colors rounded-none"
                      autoFocus
                    />
                    <button 
                      onClick={() => addTask(subject.id)}
                      className="p-3 bg-white text-black hover:bg-zinc-200 transition-colors rounded-none"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingSubjectId(null);
                        setNewTaskTitle('');
                      }}
                      className="p-3 bg-transparent border border-white/20 text-zinc-500 hover:text-white hover:border-white/50 transition-colors rounded-none"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSubjectId(subject.id)}
                    className="w-full flex items-center justify-center gap-3 p-4 mt-4 border border-dashed border-white/20 text-zinc-500 hover:text-white hover:border-white/50 transition-all text-[10px] font-mono uppercase tracking-widest rounded-none bg-transparent"
                  >
                    <Plus className="w-5 h-5" />
                    INITIALIZE_TASK
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
