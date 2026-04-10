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
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1DB954]/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#1DB954]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Weekly Focus Tasks</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Your core requirements for each subject</p>
          </div>
        </div>
        <button 
          onClick={resetAllTasks}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition-colors"
        >
          Reset for New Week
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              className="bg-[#181818] rounded-3xl border border-white/5 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/5 relative overflow-hidden">
                <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", subject.gradient)} />
                <div className="relative z-10 flex items-center justify-between">
                  <h3 className="font-bold text-lg">{subject.name}</h3>
                  <span className="text-xs font-bold text-gray-400">{Math.round(progress)}%</span>
                </div>
                <div className="relative z-10 h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-[#1DB954] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              <div className="p-4 space-y-2 flex-1">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                        task.completed ? "bg-[#1DB954]/10" : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <button
                        onClick={() => toggleTask(subject.id, task.id)}
                        className="shrink-0 focus:outline-none"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                        )}
                      </button>
                      
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editTaskTitle}
                            onChange={(e) => setEditTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditTask(subject.id, task.id)}
                            className="flex-1 bg-black/50 text-sm px-2 py-1 rounded outline-none border border-white/10 focus:border-[#1DB954]"
                            autoFocus
                          />
                          <button onClick={() => saveEditTask(subject.id, task.id)} className="text-[#1DB954] hover:text-white"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingTaskId(null)} className="text-red-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <span className={cn(
                            "text-sm font-medium flex-1 text-left",
                            task.completed ? "text-gray-500 line-through" : "text-white"
                          )}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditTaskTitle(task.title);
                              }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => deleteTask(subject.id, task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/10 rounded-md transition-colors"
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
                  <div className="flex items-center gap-2 p-2 mt-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask(subject.id)}
                      placeholder="New task..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#1DB954] outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={() => addTask(subject.id)}
                      className="p-2 bg-[#1DB954] text-black rounded-lg hover:scale-105 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingSubjectId(null);
                        setNewTaskTitle('');
                      }}
                      className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSubjectId(subject.id)}
                    className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
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
