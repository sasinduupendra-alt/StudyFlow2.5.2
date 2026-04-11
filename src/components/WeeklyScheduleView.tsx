import React, { useState } from 'react';
import { WeeklySchedule, Activity, Task, Subject } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, BookOpen, Zap, CheckCircle2, Circle, ChevronRight, GripVertical, Edit2, Trash2, Save, X as CloseIcon, ListTodo, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { WEEKLY_BASE_SCHEDULE, INITIAL_TASKS } from '../constants';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WeeklyScheduleViewProps {
  schedule: WeeklySchedule;
  onManageSchedule: () => void;
}

interface SortableActivityProps {
  activity: Activity;
  day: keyof WeeklySchedule;
  onEdit: (activity: Activity) => void;
  tasks: Task[];
  subjects: Subject[];
  onToggleTask: (id: string) => void;
}

const SortableActivity = ({ activity, day, onEdit, tasks, subjects, onToggleTask }: SortableActivityProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  // Find relevant tasks for this activity
  const relevantTasks = activity.type === 'study' ? tasks.filter(t => {
    if (t.completed) return false;
    if (!t.subjectId) return false;
    const subject = subjects.find(s => s.id === t.subjectId);
    return subject && activity.description.toLowerCase().includes(subject.name.toLowerCase());
  }).sort((a, b) => (b.impact / b.effort) - (a.impact / a.effort)).slice(0, 2) : [];

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-xl border border-white/5 transition-all group hover:bg-white/5 flex flex-col gap-2",
        activity.type === 'study' ? "bg-white/5 border-[#1DB954]/20" : "opacity-60",
        isDragging && "bg-[#282828] border-[#1DB954] shadow-2xl scale-105"
      )}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 tabular-nums">{activity.time.split(' – ')[0]}</span>
            <div className="flex items-center gap-2">
              {activity.type === 'study' && <BookOpen className="w-3 h-3 text-[#1DB954]" />}
              {activity.type === 'tuition' && <Zap className="w-3 h-3 text-blue-500" />}
              {activity.type === 'break' && <Clock className="w-3 h-3 text-yellow-500" />}
              <button 
                onClick={() => onEdit(activity)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
              >
                <Edit2 className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
          <h4 className="text-sm font-bold truncate group-hover:text-white transition-colors">{activity.description}</h4>
          <p className="text-[10px] text-gray-500 capitalize">{activity.type}</p>
        </div>
      </div>

      {relevantTasks.length > 0 && (
        <div className="mt-1 pl-7 space-y-1">
          <div className="flex items-center gap-1 text-[8px] font-black text-brand/60 uppercase tracking-widest mb-1">
            <Sparkles className="w-2 h-2" />
            Suggested_Objectives
          </div>
          {relevantTasks.map(task => (
            <button
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className="w-full text-left p-1.5 bg-brand/5 border border-brand/10 hover:border-brand/30 transition-all flex items-center gap-2 group/task"
            >
              <Circle className="w-2 h-2 text-brand/40 group-hover/task:text-brand" />
              <span className="text-[9px] font-black uppercase tracking-tight truncate flex-1">{task.title}</span>
              <span className="text-[7px] font-black text-brand/40">SNR: {((task.impact || 5) / (task.effort || 5)).toFixed(1)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function WeeklyScheduleView({ schedule, onManageSchedule }: WeeklyScheduleViewProps) {
  const { reorderSchedule, updateActivity, resetToDefault, user, addToast, tasks, setTasks, toggleTask, subjects, optimizeDaySchedule } = useAppStore();
  const [editingActivity, setEditingActivity] = useState<{ day: keyof WeeklySchedule, activity: Activity } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = React.useRef(true);

  const dailyTasks = tasks
    .filter(t => t.frequency === 'Daily')
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const snrA = (a.impact || 5) / (a.effort || 5);
      const snrB = (b.impact || 5) / (b.effort || 5);
      return snrB - snrA;
    });

  const completedDaily = dailyTasks.filter(t => t.completed).length;
  const dailyProgress = dailyTasks.length > 0 ? (completedDaily / dailyTasks.length) * 100 : 0;

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

  const days: (keyof WeeklySchedule)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const saveScheduleToFirestore = React.useCallback(async (newSchedule: WeeklySchedule) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'config', 'schedule'), newSchedule);
      addToast('Schedule synced to cloud', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/config/schedule`);
    } finally {
      setIsSaving(false);
    }
  }, [user, addToast]);

  // Auto-save schedule when it changes
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveScheduleToFirestore(schedule);
    }, 3000); // 3 second debounce

    return () => clearTimeout(timer);
  }, [schedule, saveScheduleToFirestore]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent, day: keyof WeeklySchedule) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = schedule[day].findIndex(a => a.id === active.id);
      const newIndex = schedule[day].findIndex(a => a.id === over.id);
      reorderSchedule(day, oldIndex, newIndex);
      
      // We need the UPDATED schedule. Since Zustand set is sync, we can't easily get it here 
      // without using the store's getState() or waiting for next render.
      // But we can calculate it or just use a useEffect.
    }
  };

  const handleResetSchedule = async () => {
    if (confirm('Are you sure you want to reset your schedule to the default intensive plan? This will overwrite your current changes.')) {
      resetToDefault();
      setTasks(INITIAL_TASKS as Task[]);
      // The useEffect will handle the save to Firestore for the schedule
      addToast('System reset to defaults', 'success');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight">Weekly Schedule</h2>
          <p className="text-gray-400">Your optimized study routine for the week.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className={cn("w-2 h-2 rounded-full", isSaving ? "bg-yellow-500 animate-pulse" : "bg-[#1DB954]")} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {isSaving ? 'Saving...' : 'Cloud Synced'}
            </span>
          </div>
          <button 
            onClick={() => saveScheduleToFirestore(schedule)}
            disabled={isSaving}
            className="p-3 bg-white/5 text-gray-400 hover:text-white rounded-full border border-white/10 transition-all disabled:opacity-50"
            title="Save to Cloud"
          >
            <Save className="w-4 h-4" />
          </button>
          <button 
            onClick={handleResetSchedule}
            className="px-6 py-3 bg-white/5 text-white rounded-full font-bold hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset to Default
          </button>
          <button 
            onClick={onManageSchedule}
            className="px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-all shadow-xl flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            Manage Schedule
          </button>
        </div>
      </div>

      {/* Daily Tasks Section */}
      <div className="scifi-panel p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 border border-brand/20 text-brand">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tighter">DAILY_MISSION_OBJECTIVES</h3>
              <p className="hud-label !text-gray-600">CRITICAL_TASKS_FOR_CURRENT_CYCLE</p>
            </div>
          </div>
          <div className="text-right">
            <p className="hud-label !text-gray-600">SYNC_STATUS</p>
            <p className="text-xs font-black tabular-nums text-brand">{completedDaily}/{dailyTasks.length} COMPLETED</p>
          </div>
        </div>

        <div className="h-1 w-full bg-black border border-white/5 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgress}%` }}
            className="h-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)] transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dailyTasks.length > 0 ? (
            dailyTasks.map((task) => (
              <div 
                key={task.id}
                className={cn(
                  "p-3 border transition-all flex items-center gap-3",
                  task.completed ? "bg-brand/5 border-brand/10 opacity-60" : "bg-white/5 border-border-dim hover:border-brand/30"
                )}
              >
                <button 
                  onClick={() => handleToggleTask(task.id)}
                  className={cn(
                    "shrink-0 transition-colors",
                    task.completed ? "text-brand" : "text-gray-700 hover:text-brand"
                  )}
                >
                  {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-tight truncate",
                    task.completed ? "line-through text-gray-600" : "text-white"
                  )}>
                    {task.title}
                  </p>
                  {task.subjectId && (
                    <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest">
                      {subjects.find(s => s.id === task.subjectId)?.name}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-[8px] font-black text-gray-700">
                  SNR: {((task.impact || 5) / (task.effort || 5)).toFixed(1)}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 flex flex-col items-center justify-center border border-dashed border-border-dim opacity-40">
              <p className="hud-label">NO_DAILY_TASKS_INITIALIZED</p>
            </div>
          )}
        </div>
      </div>

      {/* Tuition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => {
          const tuitionSessions = schedule[day].filter(a => a.type === 'tuition');
          if (tuitionSessions.length === 0) return null;
          return (
            <div key={`summary-${day}`} className="bg-[#181818] p-4 rounded-2xl border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm">{day} Tuition</h3>
              </div>
              <div className="space-y-2">
                {tuitionSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">{s.description}</span>
                    <span className="text-blue-500 font-bold tabular-nums">{s.time.split(' – ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex lg:grid lg:grid-cols-7 overflow-x-auto pb-8 scrollbar-hide gap-6 snap-x snap-mandatory">
        {days.map((day, dayIndex) => (
          <motion.div 
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.05 }}
            className="min-w-[280px] lg:min-w-0 flex flex-col gap-4 snap-start"
          >
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md py-4 border-b border-white/10 mb-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-[#1DB954]">{day}</h3>
                <button 
                  onClick={() => {
                    optimizeDaySchedule(day);
                    addToast(`${day} schedule optimized`, 'success');
                  }}
                  className="p-1.5 hover:bg-brand/10 text-brand rounded-md transition-colors"
                  title="Optimize Day"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {schedule[day].filter(a => a.type === 'study').length} Study Blocks
              </p>
            </div>

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, day)}
            >
              <SortableContext 
                items={schedule[day].map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {schedule[day].map((activity) => (
                    <SortableActivity 
                      key={activity.id} 
                      activity={activity} 
                      day={day}
                      onEdit={(a) => setEditingActivity({ day, activity: a })}
                      tasks={tasks}
                      subjects={subjects}
                      onToggleTask={handleToggleTask}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        ))}
      </div>

      {/* Edit Activity Modal */}
      <AnimatePresence>
        {editingActivity && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingActivity(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#181818] rounded-3xl p-8 border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black tracking-tight">Edit Activity</h3>
                <button onClick={() => setEditingActivity(null)} className="p-2 hover:bg-white/5 rounded-full">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Description</label>
                  <input 
                    type="text"
                    value={editingActivity.activity.description}
                    onChange={(e) => setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, description: e.target.value }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Start Time</label>
                    <input 
                      type="text"
                      placeholder="08:00 AM"
                      value={editingActivity.activity.time.split(' – ')[0]}
                      onChange={(e) => {
                        const [_, end] = editingActivity.activity.time.split(' – ');
                        setEditingActivity({
                          ...editingActivity,
                          activity: { ...editingActivity.activity, time: `${e.target.value} – ${end}` }
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">End Time</label>
                    <input 
                      type="text"
                      placeholder="09:00 AM"
                      value={editingActivity.activity.time.split(' – ')[1]}
                      onChange={(e) => {
                        const [start, _] = editingActivity.activity.time.split(' – ');
                        setEditingActivity({
                          ...editingActivity,
                          activity: { ...editingActivity.activity, time: `${start} – ${e.target.value}` }
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['study', 'tuition', 'break', 'rest'].map(type => (
                      <button
                        key={type}
                        onClick={() => setEditingActivity({
                          ...editingActivity,
                          activity: { ...editingActivity.activity, type: type as Activity['type'] }
                        })}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold capitalize border transition-all",
                          editingActivity.activity.type === type 
                            ? "bg-[#1DB954] text-black border-[#1DB954]" 
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setEditingActivity(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-black transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      updateActivity(editingActivity.day, editingActivity.activity.id, editingActivity.activity);
                      setEditingActivity(null);
                    }}
                    className="flex-1 py-4 bg-[#1DB954] text-black rounded-full font-black hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
