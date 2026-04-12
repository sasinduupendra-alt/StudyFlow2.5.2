import React, { useState } from 'react';
import { WeeklySchedule, Activity, Task, Subject } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, BookOpen, Zap, CheckCircle2, Circle, ChevronRight, GripVertical, Edit2, Trash2, Save, X as CloseIcon, ListTodo, Sparkles, Calendar, Plus } from 'lucide-react';
import { cn, calculateSNR } from '../lib/utils';
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

interface ScheduleViewProps {
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
  }).sort((a, b) => {
    const subjectA = subjects.find(s => s.id === a.subjectId);
    const subjectB = subjects.find(s => s.id === b.subjectId);
    return calculateSNR(b, subjectB) - calculateSNR(a, subjectA);
  }).slice(0, 2) : [];

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative p-6 enterprise-card transition-all duration-300 group overflow-hidden",
        activity.type === 'study' 
          ? "bg-brand/5 border-brand/20 hover:border-brand/40" 
          : "bg-zinc-900/50 border-zinc-800/50 opacity-80 hover:opacity-100",
        isDragging && "bg-zinc-900 border-brand shadow-2xl scale-[1.02] z-50"
      )}
    >
      <div className="flex items-start gap-4 relative z-10">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-zinc-700 hover:text-brand transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "badge",
                activity.type === 'study' ? "badge-brand" : "badge-zinc"
              )}>
                {activity.type}
              </div>
              <span className="text-[10px] font-bold text-zinc-500 tabular-nums uppercase tracking-wider">{activity.time}</span>
            </div>
            <div className="flex items-center gap-3">
              {activity.type === 'study' && <BookOpen className="w-4 h-4 text-brand" />}
              {activity.type === 'tuition' && <Zap className="w-4 h-4 text-blue-500" />}
              {activity.type === 'break' && <Clock className="w-4 h-4 text-yellow-500" />}
              <button 
                onClick={() => onEdit(activity)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 rounded-lg transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>
          </div>
          <h4 className="text-lg font-bold text-white group-hover:text-brand transition-colors mb-1">
            {activity.description}
          </h4>
        </div>
      </div>

      {relevantTasks.length > 0 && (
        <div className="mt-4 pl-9 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-brand/60 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Suggested Objectives
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relevantTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className="w-full text-left p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-brand/30 transition-all flex items-center gap-3 group/task"
              >
                <Circle className="w-2 h-2 text-zinc-700 group-hover/task:text-brand" />
                <span className="text-[11px] font-bold text-zinc-400 truncate flex-1">{task.title}</span>
                <span className="text-[9px] font-bold text-brand/40">SNR: {calculateSNR(task, subjects.find(s => s.id === task.subjectId)).toFixed(1)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ScheduleView({ schedule, onManageSchedule }: ScheduleViewProps) {
  const { reorderSchedule, updateActivity, resetToDefault, user, addToast, tasks, setTasks, toggleTask, subjects, optimizeDaySchedule } = useAppStore();
  const [editingActivity, setEditingActivity] = useState<{ day: keyof WeeklySchedule, activity: Activity } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const days: (keyof WeeklySchedule)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule>(days.includes(currentDayName as any) ? currentDayName as any : 'Monday');

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
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    optimizeDaySchedule(selectedDay);
    setIsOptimizing(false);
    addToast(`Neural optimization complete for ${selectedDay}`, 'success');
  };

  const handleOptimizeWeek = async () => {
    setIsOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    days.forEach(day => optimizeDaySchedule(day));
    setIsOptimizing(false);
    addToast('Global mission parameters optimized', 'success');
  };

  return (
    <div className="p-6 md:p-10 space-y-10 pb-32 relative min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Temporal Matrix</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            Daily <span className="text-brand">Schedule</span>
          </h2>
          <p className="text-zinc-500 text-sm max-w-xl leading-relaxed">
            Neural-synchronized study protocols and tuition alignment for the current operational cycle.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Daily Progress</p>
              <p className="text-xl font-bold text-white tabular-nums">{Math.round(dailyProgress)}%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-zinc-800 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-brand"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * dailyProgress) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-brand rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="enterprise-button px-8 py-4"
          >
            <Sparkles className={cn("w-4 h-4", isOptimizing && "animate-spin")} />
            {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
          </button>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex overflow-x-auto scrollbar-hide gap-3 p-1.5 bg-zinc-900/30 border border-zinc-800/50 rounded-[28px] w-fit max-w-full">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-8 py-3.5 rounded-[22px] text-sm font-bold transition-all whitespace-nowrap relative overflow-hidden group",
              selectedDay === day 
                ? "text-white bg-zinc-900 border border-zinc-800 shadow-xl" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
            )}
          >
            {selectedDay === day && (
              <motion.div 
                layoutId="dayGlow"
                className="absolute inset-0 bg-brand/5 blur-xl"
              />
            )}
            <span className="relative z-10">{day}</span>
            {day === currentDayName && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Daily Tasks Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="enterprise-card p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand mb-0.5">Mission Objectives</h3>
                <p className="text-xl font-bold text-white tracking-tight">Daily Protocols</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between mb-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sync Status</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums text-brand">{completedDaily}</span>
                  <span className="text-xs font-bold text-zinc-500">/ {dailyTasks.length}</span>
                </div>
              </div>
              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgress}%` }}
                  className="h-full bg-brand"
                />
              </div>
            </div>

            <div className="space-y-2">
              {dailyTasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex items-center gap-4 group/task",
                    task.completed 
                      ? "bg-brand/5 border-brand/10 opacity-50" 
                      : "bg-zinc-900/50 border-zinc-800 hover:border-brand/30"
                  )}
                >
                  <button 
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "shrink-0 transition-transform group-hover/task:scale-110",
                      task.completed ? "text-brand" : "text-zinc-700 hover:text-brand"
                    )}
                  >
                    {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-xs font-bold truncate",
                      task.completed ? "line-through text-zinc-600" : "text-zinc-300"
                    )}>
                      {task.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tuition Summary for Day */}
          {schedule[selectedDay].filter(a => a.type === 'tuition').length > 0 && (
            <div className="enterprise-card p-8 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Tuition Sync</h3>
              </div>
              <div className="space-y-2">
                {schedule[selectedDay].filter(a => a.type === 'tuition').map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <span className="text-xs font-bold text-zinc-400 truncate max-w-[150px]">{s.description}</span>
                    <span className="text-[10px] font-bold text-blue-500 tabular-nums">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Schedule Timeline */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-3xl font-bold text-white tracking-tight">{selectedDay}</h3>
              <div className="h-6 w-[1px] bg-zinc-800" />
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {schedule[selectedDay].length} Active Blocks
              </p>
            </div>
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="enterprise-button px-5 py-2.5 text-[10px] flex items-center gap-2"
            >
              <Sparkles className={cn("w-4 h-4", isOptimizing && "animate-spin")} />
              {isOptimizing ? 'Analyzing...' : 'Neural Optimize'}
            </button>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, selectedDay)}
          >
            <SortableContext 
              items={schedule[selectedDay].map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 relative">
                {/* Timeline Line */}
                <div className="absolute left-[1.5rem] top-0 bottom-0 w-[1px] bg-zinc-800" />
                
                {schedule[selectedDay].map((activity) => (
                  <SortableActivity 
                    key={activity.id} 
                    activity={activity} 
                    day={selectedDay}
                    onEdit={(a) => setEditingActivity({ day: selectedDay, activity: a })}
                    tasks={tasks}
                    subjects={subjects}
                    onToggleTask={handleToggleTask}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
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
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl enterprise-card p-10 bg-zinc-950 border-zinc-800 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-[2px] bg-brand rounded-full" />
                    <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Protocol Adjustment</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Edit Activity</h3>
                </div>
                <button onClick={() => setEditingActivity(null)} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors">
                  <CloseIcon className="w-6 h-6 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Description Identifier</label>
                  <input 
                    type="text"
                    value={editingActivity.activity.description}
                    onChange={(e) => setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, description: e.target.value }
                    })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand transition-all font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Start Time</label>
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
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand transition-all tabular-nums font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">End Time</label>
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
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-brand transition-all tabular-nums font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Activity Classification</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['study', 'tuition', 'break', 'rest'].map(type => (
                      <button
                        key={type}
                        onClick={() => setEditingActivity({
                          ...editingActivity,
                          activity: { ...editingActivity.activity, type: type as Activity['type'] }
                        })}
                        className={cn(
                          "px-4 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all",
                          editingActivity.activity.type === type 
                            ? "bg-brand text-black border-brand" 
                            : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setEditingActivity(null)}
                    className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all font-bold uppercase tracking-wider text-[10px] rounded-xl border border-zinc-800"
                  >
                    Abort Changes
                  </button>
                  <button 
                    onClick={() => {
                      updateActivity(editingActivity.day, editingActivity.activity.id, editingActivity.activity);
                      setEditingActivity(null);
                    }}
                    className="flex-1 py-4 bg-brand text-black font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-[10px] rounded-xl"
                  >
                    <Save className="w-4 h-4" />
                    Commit Protocols
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
