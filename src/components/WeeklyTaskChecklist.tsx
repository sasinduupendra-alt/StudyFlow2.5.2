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
          <div className="p-4 bg-brand/20 rounded-[20px] text-brand">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Weekly Objectives</h2>
            <p className="text-sm font-medium text-[#8E8E93] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              Core Requirements Per Subject
            </p>
          </div>
        </div>
        <button 
          onClick={resetAllTasks}
          className="px-6 py-2.5 text-sm font-semibold bg-white/5 text-white hover:bg-white/10 transition-colors rounded-full"
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
              className="bg-[#1C1C1E] border border-white/5 rounded-[32px] overflow-hidden flex flex-col group relative"
            >
              <div className="p-8 border-b border-white/5 relative overflow-hidden bg-white/5">
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">{subject.name}</h3>
                  <span className="text-sm font-semibold text-[#8E8E93] tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="relative z-10 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all duration-1000"
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
                        "w-full flex items-center gap-4 p-4 transition-all group/task rounded-[20px]",
                        task.completed ? "bg-white/5" : "bg-transparent hover:bg-white/5"
                      )}
                    >
                      <button
                        onClick={() => toggleTask(subject.id, task.id)}
                        className="shrink-0 focus:outline-none"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-brand" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#8E8E93] group-hover/task:text-white" />
                        )}
                      </button>
                      
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex items-center gap-3">
                          <input
                            type="text"
                            value={editTaskTitle}
                            onChange={(e) => setEditTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditTask(subject.id, task.id)}
                            className="flex-1 bg-black text-sm font-medium px-4 py-2 outline-none border border-white/10 focus:border-brand transition-colors rounded-full text-white"
                            autoFocus
                          />
                          <button onClick={() => saveEditTask(subject.id, task.id)} className="text-white hover:text-brand"><Check className="w-5 h-5" /></button>
                          <button onClick={() => setEditingTaskId(null)} className="text-[#FF453A] hover:opacity-80"><X className="w-5 h-5" /></button>
                        </div>
                      ) : (
                        <>
                          <span className={cn(
                            "text-sm font-medium flex-1 text-left leading-relaxed",
                            task.completed ? "text-[#8E8E93] line-through" : "text-white"
                          )}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover/task:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditTaskTitle(task.title);
                              }}
                              className="p-2 text-[#8E8E93] hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteTask(subject.id, task.id)}
                              className="p-2 text-[#8E8E93] hover:text-[#FF453A] transition-colors"
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
                  <div className="flex items-center gap-3 p-2 mt-4">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask(subject.id)}
                      placeholder="New Objective..."
                      className="flex-1 bg-black border border-white/10 px-4 py-3 text-sm font-medium focus:border-brand outline-none transition-colors rounded-full text-white"
                      autoFocus
                    />
                    <button 
                      onClick={() => addTask(subject.id)}
                      className="p-3 bg-brand text-white hover:opacity-90 transition-opacity rounded-full"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingSubjectId(null);
                        setNewTaskTitle('');
                      }}
                      className="p-3 bg-white/5 text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSubjectId(subject.id)}
                    className="w-full flex items-center justify-center gap-3 p-4 mt-4 border border-dashed border-white/10 text-[#8E8E93] hover:text-white hover:border-white/30 transition-all text-sm font-semibold rounded-[20px] bg-transparent"
                  >
                    <Plus className="w-5 h-5" />
                    Add Task
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
