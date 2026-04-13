import React, { useState } from 'react';
import { WeeklySchedule, Activity, Task, Subject } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, BookOpen, Zap, CheckCircle2, Circle, ChevronRight, GripVertical, Edit2, Trash2, Save, X as CloseIcon, ListTodo, Sparkles, Calendar, Plus, Download } from 'lucide-react';
import { cn, calculateSNR } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { auth, db, handleFirestoreError, OperationType, googleProvider, signInWithPopup } from '../firebase';
import { GoogleAuthProvider } from 'firebase/auth';
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
          ? "bg-white/[0.02] border-white/20 hover:border-white/40" 
          : "bg-transparent border-white/5 opacity-60 hover:opacity-100",
        isDragging && "bg-black border-white shadow-2xl scale-[1.02] z-50"
      )}
    >
      <div className="flex items-start gap-6 relative z-10">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-zinc-800 hover:text-white transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "badge",
                activity.type === 'study' ? "badge-brand" : "badge-zinc"
              )}>
                {activity.type}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums uppercase tracking-[0.2em]">{activity.time}</span>
            </div>
            <div className="flex items-center gap-4">
              {activity.type === 'study' && <BookOpen className="w-4 h-4 text-brand" />}
              {activity.type === 'tuition' && <Zap className="w-4 h-4 text-brand" />}
              {activity.type === 'break' && <Clock className="w-4 h-4 text-zinc-500" />}
              <button 
                onClick={() => onEdit(activity)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-none transition-all border border-white/10"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>
          </div>
          <h4 className="text-lg font-black text-white group-hover:text-white transition-colors mb-1 uppercase tracking-widest">
            {activity.description}
          </h4>
        </div>
      </div>

      {relevantTasks.length > 0 && (
        <div className="mt-6 pl-11 space-y-4">
          <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            Suggested Objectives
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className="w-full text-left p-4 bg-transparent border border-white/5 rounded-none hover:border-white/20 transition-all flex items-center gap-4 group/task"
              >
                <Circle className="w-2 h-2 text-zinc-800 group-hover/task:text-white" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate flex-1">{task.title}</span>
                <span className="text-[9px] font-mono text-zinc-700 tabular-nums">SNR: {calculateSNR(task, subjects.find(s => s.id === task.subjectId)).toFixed(1)}</span>
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
  const [isSyncing, setIsSyncing] = useState(false);
  
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

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
      
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("Failed to get Google Calendar access token.");
      }

      const today = new Date();
      const currentDayOfWeek = today.getDay() || 7; // 1 (Mon) to 7 (Sun)
      const monday = new Date(today);
      monday.setDate(today.getDate() - currentDayOfWeek + 1);

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      for (let i = 0; i < daysOfWeek.length; i++) {
        const dayName = daysOfWeek[i] as keyof WeeklySchedule;
        const activities = schedule[dayName];
        if (!activities || activities.length === 0) continue;

        const dateForDay = new Date(monday);
        dateForDay.setDate(monday.getDate() + i);
        const dateString = dateForDay.toISOString().split('T')[0];

        for (const activity of activities) {
          const timeMatch = activity.time.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/);
          if (!timeMatch) continue;

          const startTimeStr = timeMatch[1];
          const endTimeStr = timeMatch[2];

          const startDateTime = `${dateString}T${startTimeStr}:00`;
          const endDateTime = `${dateString}T${endTimeStr}:00`;

          const event = {
            summary: `[StudyFlow] ${activity.description}`,
            description: `Type: ${activity.type}`,
            start: {
              dateTime: new Date(startDateTime).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: new Date(endDateTime).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          };

          await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          });
        }
      }

      addToast('Successfully synced to Google Calendar', 'success');
    } catch (error) {
      console.error("Calendar sync error:", error);
      addToast('Failed to sync to Google Calendar', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportText = () => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let content = "=========================================\n";
    content += "        STUDYFLOW NEURAL SCHEDULE        \n";
    content += "=========================================\n\n";

    daysOfWeek.forEach(day => {
      const activities = schedule[day as keyof WeeklySchedule];
      if (activities && activities.length > 0) {
        content += `[ ${day.toUpperCase()} ]\n`;
        content += "-----------------------------------------\n";
        activities.forEach(act => {
          content += `${act.time.padEnd(15)} | ${act.type.toUpperCase().padEnd(8)} | ${act.description}\n`;
        });
        content += "\n";
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'StudyFlow_Schedule.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Schedule exported as text document', 'success');
  };

  return (
    <div className="p-8 md:p-12 space-y-12 pb-32 relative min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-none bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-[0_0_20px_var(--color-brand-glow)]">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono text-brand uppercase tracking-[0.4em]">Temporal Matrix</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">
            Daily <span className="text-brand drop-shadow-[0_0_15px_var(--color-brand-glow)]">Schedule</span>
          </h2>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em] max-w-xl leading-relaxed">
            Neural-synchronized study protocols and tuition alignment for the current operational cycle.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-6 px-8 py-4 bg-transparent border border-white/5 rounded-none">
            <div className="text-right">
              <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">Progress</p>
              <p className="text-2xl font-black text-white tabular-nums tracking-tighter">{Math.round(dailyProgress)}%</p>
            </div>
            <div className="w-12 h-12 rounded-none border border-white/10 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-white/5"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * dailyProgress) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="enterprise-button px-10 py-4"
            >
              <Sparkles className={cn("w-4 h-4", isOptimizing && "animate-spin")} />
              {isOptimizing ? 'Optimizing...' : 'Neural Optimize'}
            </button>
            <div className="flex gap-4">
              <button 
                onClick={handleSyncCalendar}
                disabled={isSyncing}
                className="enterprise-button-secondary flex-1 py-4"
              >
                <Calendar className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                {isSyncing ? 'Syncing...' : 'Sync Calendar'}
              </button>
              <button 
                onClick={handleExportText}
                className="enterprise-button-secondary flex-1 py-4"
              >
                <Download className="w-4 h-4" />
                Export TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 p-1 bg-transparent border border-white/5 rounded-full w-fit max-w-full">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-6 py-3 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] transition-all whitespace-nowrap relative overflow-hidden group",
              selectedDay === day 
                ? "text-black bg-white" 
                : "text-zinc-600 hover:text-white hover:bg-white/5"
            )}
          >
            <span className="relative z-10">{day}</span>
            {day === currentDayName && selectedDay !== day && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-none shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Daily Tasks Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <div className="enterprise-card p-10 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.02] blur-3xl -mr-24 -mt-24" />
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-12 h-12 rounded-none bg-transparent border border-white/10 flex items-center justify-center text-white">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-1">Mission Objectives</h3>
                <p className="text-xl font-black text-white tracking-widest uppercase">Daily Protocols</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-end justify-between mb-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">Sync Status</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tabular-nums text-white tracking-tighter">{completedDaily}</span>
                  <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">/ {dailyTasks.length}</span>
                </div>
              </div>
              <div className="h-[2px] w-full bg-white/5 rounded-none overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgress}%` }}
                  className="h-full bg-white"
                />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              {dailyTasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-5 rounded-none border transition-all flex items-center gap-6 group/task",
                    task.completed 
                      ? "bg-white/[0.02] border-white/5 opacity-40" 
                      : "bg-transparent border-white/5 hover:border-white/20"
                  )}
                >
                  <button 
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "shrink-0 transition-transform group-hover/task:scale-110",
                      task.completed ? "text-white" : "text-zinc-800 hover:text-white"
                    )}
                  >
                    {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-[10px] font-mono uppercase tracking-[0.15em] truncate",
                      task.completed ? "line-through text-zinc-700" : "text-zinc-400"
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
            <div className="enterprise-card p-10 border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-10 h-10 rounded-none bg-transparent border border-white/10 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600">Tuition Sync</h3>
              </div>
              <div className="space-y-3">
                {schedule[selectedDay].filter(a => a.type === 'tuition').map(s => (
                  <div key={s.id} className="flex items-center justify-between p-5 bg-transparent border border-white/5 rounded-none hover:border-white/20 transition-all">
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-400 truncate max-w-[150px]">{s.description}</span>
                    <span className="text-[10px] font-mono text-white tabular-nums tracking-tighter">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Schedule Timeline */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{selectedDay}</h3>
              <div className="h-8 w-[1px] bg-white/10" />
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                {schedule[selectedDay].length} Active Blocks
              </p>
            </div>
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="enterprise-button px-6 py-3 text-[9px] flex items-center gap-3"
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
              <div className="space-y-6 relative">
                {/* Timeline Line */}
                <div className="absolute left-[1.5rem] top-0 bottom-0 w-[1px] bg-white/5" />
                
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
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-[320px] enterprise-card p-5 bg-black border-white/20 shadow-2xl rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-[1px] bg-white" />
                    <span className="text-[7px] font-mono text-white uppercase tracking-[0.4em]">Adjustment</span>
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tighter uppercase">Edit Activity</h3>
                </div>
                <button onClick={() => setEditingActivity(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                  <CloseIcon className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-600 block">Description</label>
                  <input 
                    type="text"
                    value={editingActivity.activity.description}
                    onChange={(e) => setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, description: e.target.value }
                    })}
                    className="enterprise-input py-2 text-xs rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-600 block">Start Time</label>
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
                      className="enterprise-input py-2 text-xs rounded-lg tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-600 block">End Time</label>
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
                      className="enterprise-input py-2 text-xs rounded-lg tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-600 block">Classification</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['study', 'tuition', 'break', 'rest'].map(type => (
                      <button
                        key={type}
                        onClick={() => setEditingActivity({
                          ...editingActivity,
                          activity: { ...editingActivity.activity, type: type as Activity['type'] }
                        })}
                        className={cn(
                          "px-2 py-1 text-[8px] font-mono uppercase tracking-[0.2em] rounded-md border transition-all",
                          editingActivity.activity.type === type 
                            ? "bg-white text-black border-white font-bold" 
                            : "bg-transparent text-zinc-600 border-white/10 hover:border-white/30"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setEditingActivity(null)}
                    className="flex-1 py-2 bg-transparent hover:bg-white/5 text-zinc-600 hover:text-white transition-all font-mono uppercase tracking-[0.2em] text-[8px] rounded-lg border border-white/10"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={() => {
                      updateActivity(editingActivity.day, editingActivity.activity.id, editingActivity.activity);
                      setEditingActivity(null);
                    }}
                    className="flex-1 py-2 bg-white text-black font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[8px] rounded-lg"
                  >
                    <Save className="w-3 h-3" />
                    Commit
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
