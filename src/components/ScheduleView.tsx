import React, { useState, useEffect } from 'react';
import { WeeklySchedule, Activity, Task, Subject } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, BookOpen, Zap, CheckCircle2, Circle, ChevronRight, GripVertical, Edit2, Trash2, Save, X as CloseIcon, ListTodo, Sparkles, Calendar, Plus, Download } from 'lucide-react';
import { cn, calculateSNR } from '../lib/utils';
import { parseTimeStr } from '../lib/timeUtils';
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
        "relative p-6 bg-[#1C1C1E] border border-white/5 rounded-[24px] transition-all duration-300 group overflow-hidden",
        activity.type === 'study' 
          ? "hover:bg-[#2C2C2E]" 
          : "opacity-80 hover:opacity-100",
        isDragging && "bg-[#2C2C2E] border-white/20 shadow-2xl scale-[1.02] z-50"
      )}
    >
      <div className="flex items-start gap-6 relative z-10">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-[#8E8E93] hover:text-white transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full",
                activity.type === 'study' ? "bg-brand/20 text-brand" : "bg-white/10 text-white"
              )}>
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              </div>
              {activity.focusMode && (
                <div className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse">
                  Focus Mode
                </div>
              )}
              <span className="text-sm font-medium text-[#8E8E93] tabular-nums">{activity.time}</span>
            </div>
            <div className="flex items-center gap-4">
              {activity.type === 'study' && <BookOpen className="w-4 h-4 text-brand" />}
              {activity.type === 'tuition' && <Zap className="w-4 h-4 text-brand" />}
              {activity.type === 'break' && <Clock className="w-4 h-4 text-[#8E8E93]" />}
              <button 
                onClick={() => onEdit(activity)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <Edit2 className="w-4 h-4 text-[#8E8E93]" />
              </button>
            </div>
          </div>
          <h4 className="text-lg font-bold text-white mb-1">
            {activity.description}
          </h4>
        </div>
      </div>

      {relevantTasks.length > 0 && (
        <div className="mt-6 pl-11 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8E8E93]">
            <Sparkles className="w-4 h-4" />
            Suggested Objectives
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className="w-full text-left p-4 bg-white/5 border border-white/5 rounded-[20px] hover:bg-white/10 transition-all flex items-center gap-4 group/task"
              >
                <Circle className="w-4 h-4 text-[#8E8E93] group-hover/task:text-white" />
                <span className="text-sm font-medium text-white truncate flex-1">{task.title}</span>
                <span className="text-xs font-semibold text-[#8E8E93] tabular-nums">SNR: {calculateSNR(task, subjects.find(s => s.id === task.subjectId)).toFixed(1)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ScheduleView({ schedule, onManageSchedule }: ScheduleViewProps) {
  const { reorderSchedule, updateActivity, addActivityToSchedule, resetToDefault, user, addToast, tasks, setTasks, toggleTask, subjects, optimizeDaySchedule } = useAppStore();
  const [editingActivity, setEditingActivity] = useState<{ day: keyof WeeklySchedule, activity: Activity } | null>(null);
  const [addingTaskToSchedule, setAddingTaskToSchedule] = useState<Task | null>(null);
  const [newTaskStartTime, setNewTaskStartTime] = useState('08:00');
  const [newTaskEndTime, setNewTaskEndTime] = useState('09:00');
  const [newTaskType, setNewTaskType] = useState<Activity['type']>('study');
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentTimeMins, setCurrentTimeMins] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMins(now.getHours() * 60 + now.getMinutes());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  const days: (keyof WeeklySchedule)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule>(days.includes(currentDayName as any) ? currentDayName as any : 'Monday');

  const [isPlanningForTomorrow, setIsPlanningForTomorrow] = useState(false);
  const [selectedTasksForTomorrow, setSelectedTasksForTomorrow] = useState<string[]>([]);
  const [newTaskForTomorrowTitle, setNewTaskForTomorrowTitle] = useState('');

  const handleAddNewTaskForTomorrow = () => {
    if (!newTaskForTomorrowTitle.trim()) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskForTomorrowTitle.trim(),
      description: '',
      frequency: 'Daily',
      completed: false,
      subjectId: subjects[0]?.id || '',
      createdAt: new Date().toISOString(),
      impact: 5,
      effort: 5,
      focusMode: false
    };
    
    setTasks([...tasks, newTask]);
    setSelectedTasksForTomorrow([...selectedTasksForTomorrow, newTask.id]);
    setNewTaskForTomorrowTitle('');
  };

  const handlePlanForTomorrow = () => {
    const currentDayIndex = days.indexOf(currentDayName as any);
    const tomorrow = days[(currentDayIndex + 1) % 7];
    
    const tasksToSchedule = tasks.filter(t => selectedTasksForTomorrow.includes(t.id));
    
    let currentHour = 8; // Start scheduling from 8 AM
    
    tasksToSchedule.forEach(task => {
      const startTime = `${currentHour.toString().padStart(2, '0')}:00`;
      const endTime = `${(currentHour + 1).toString().padStart(2, '0')}:00`;
      
      const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        return `${formattedHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      };

      const newActivity: Activity = {
        id: Math.random().toString(36).substring(2, 9),
        time: `${formatTime(startTime)} – ${formatTime(endTime)}`,
        description: task.title,
        type: 'study',
        focusMode: task.focusMode
      };
      
      addActivityToSchedule(tomorrow, newActivity);
      currentHour++;
    });
    
    setIsPlanningForTomorrow(false);
    setSelectedTasksForTomorrow([]);
    addToast(`Added ${tasksToSchedule.length} tasks to tomorrow's schedule`, 'success');
  };

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

  const [isImporting, setIsImporting] = useState(false);

  const handleImportCalendar = async () => {
    setIsImporting(true);
    try {
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("Failed to get Google Calendar access token.");
      }

      const timeMin = new Date().toISOString();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 7); // Fetch next 7 days

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const importedTasks = data.items.map((event: any) => {
          const { classifyEvent } = require('../lib/utils');
          const classification = classifyEvent(event.summary || '');
          
          return {
            id: `cal-${event.id}`,
            title: event.summary || 'Untitled Event',
            description: event.description || `Focus on ${classification.subject} theory.`,
            frequency: 'Once',
            completed: false,
            subjectId: subjects.find(s => s.name === classification.subject)?.id || subjects[0].id,
            createdAt: new Date().toISOString(),
            dueDate: event.start.dateTime || event.start.date,
            impact: 8,
            effort: 5,
            isTuition: (event.summary || '').toLowerCase().includes('tuition') || (event.summary || '').toLowerCase().includes('class'),
            focusMode: (event.summary || '').toLowerCase().includes('past paper') || (event.summary || '').toLowerCase().includes('deep work')
          };
        });

        // Add imported tasks to the store
        setTasks([...tasks, ...importedTasks]);
        
        if (user) {
          const { writeBatch } = require('firebase/firestore');
          const batch = writeBatch(db);
          importedTasks.forEach((task: any) => {
            const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
            batch.set(taskRef, task);
          });
          await batch.commit();
        }

        addToast(`Successfully imported ${importedTasks.length} events as tasks`, 'success');
      } else {
        addToast('No upcoming events found in calendar', 'info');
      }

    } catch (error) {
      console.error("Calendar import error:", error);
      addToast('Failed to import from Google Calendar', 'error');
    } finally {
      setIsImporting(false);
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
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[20px] bg-brand/20 flex items-center justify-center text-brand">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-brand uppercase tracking-wider">Temporal Matrix</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Daily Schedule
          </h2>
          <p className="text-[#8E8E93] text-base max-w-xl leading-relaxed">
            Neural-synchronized study protocols and tuition alignment for the current operational cycle.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-6 px-8 py-6 bg-[#1C1C1E] border border-white/5 rounded-[32px]">
            <div className="text-right">
              <p className="text-sm font-medium text-[#8E8E93] mb-1">Progress</p>
              <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{Math.round(dailyProgress)}%</p>
            </div>
            <div className="w-14 h-14 rounded-full border border-white/10 relative flex items-center justify-center bg-white/5">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/10"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-brand"
                  strokeDasharray={150.7}
                  strokeDashoffset={150.7 - (150.7 * dailyProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-8 py-4 bg-brand text-white font-semibold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Sparkles className={cn("w-5 h-5", isOptimizing && "animate-spin")} />
              {isOptimizing ? 'Optimizing...' : 'Neural Optimize'}
            </button>
            <div className="flex gap-4">
              <button 
                onClick={handleSyncCalendar}
                disabled={isSyncing}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2 flex-1"
              >
                <Calendar className={cn("w-5 h-5", isSyncing && "animate-spin")} />
                {isSyncing ? 'Syncing...' : 'Sync Calendar'}
              </button>
              <button 
                onClick={handleImportCalendar}
                disabled={isImporting}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2 flex-1"
              >
                <Download className={cn("w-5 h-5", isImporting && "animate-spin")} />
                {isImporting ? 'Importing...' : 'Import Events'}
              </button>
              <button 
                onClick={handleExportText}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors flex items-center justify-center gap-2 flex-1"
              >
                <Download className="w-5 h-5" />
                Export TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 p-1.5 bg-[#1C1C1E] border border-white/5 rounded-full w-fit max-w-full">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap relative overflow-hidden",
              selectedDay === day 
                ? "text-black bg-white" 
                : "text-[#8E8E93] hover:text-white hover:bg-white/10"
            )}
          >
            <span className="relative z-10">{day}</span>
            {day === currentDayName && selectedDay !== day && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Daily Tasks Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 blur-3xl -mr-24 -mt-24 rounded-full" />
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 rounded-[20px] bg-white/10 flex items-center justify-center text-white">
                <ListTodo className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#8E8E93] mb-1">Mission Objectives</h3>
                <p className="text-2xl font-bold text-white tracking-tight">Daily Protocols</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm font-semibold text-[#8E8E93]">Sync Status</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums text-white tracking-tight">{completedDaily}</span>
                  <span className="text-sm font-medium text-[#8E8E93]">/ {dailyTasks.length}</span>
                </div>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgress}%` }}
                  className="h-full bg-brand"
                />
              </div>

              <button
                onClick={() => setIsPlanningForTomorrow(true)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-[20px] transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Plan for Tomorrow
              </button>
            </div>

            <div className="space-y-3 relative z-10">
              {dailyTasks.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-5 rounded-[20px] border transition-all flex items-center gap-6 group/task",
                    task.completed 
                      ? "bg-white/5 border-white/5" 
                      : "bg-transparent border-white/10 hover:bg-white/5"
                  )}
                >
                  <button 
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "shrink-0 transition-transform group-hover/task:scale-110",
                      task.completed ? "text-brand" : "text-[#8E8E93] hover:text-white"
                    )}
                  >
                    {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      task.completed ? "line-through text-[#8E8E93]" : "text-white"
                    )}>
                      {task.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setAddingTaskToSchedule(task)}
                    className="opacity-0 group-hover/task:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all text-[#8E8E93] hover:text-white"
                    title="Add to Schedule"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tuition Summary for Day */}
          {schedule[selectedDay].filter(a => a.type === 'tuition').length > 0 && (
            <div className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#8E8E93]">Tuition Sync</h3>
              </div>
              <div className="space-y-3">
                {schedule[selectedDay].filter(a => a.type === 'tuition').map(s => (
                  <div key={s.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[20px] hover:bg-white/10 transition-all">
                    <span className="text-sm font-medium text-white truncate max-w-[150px]">{s.description}</span>
                    <span className="text-sm font-semibold text-[#8E8E93] tabular-nums">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Schedule Timeline */}
        <div className="lg:col-span-8 space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <h3 className="text-3xl font-bold text-white tracking-tight">{selectedDay}</h3>
              <div className="h-8 w-[1px] bg-white/10" />
              <p className="text-sm font-medium text-[#8E8E93]">
                {schedule[selectedDay].length} Active Blocks
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-[#1C1C1E] border border-white/5 rounded-full p-1">
                <button 
                  onClick={() => setViewMode('list')} 
                  className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors", viewMode === 'list' ? "bg-white text-black" : "text-[#8E8E93] hover:text-white")}
                >
                  List
                </button>
                <button 
                  onClick={() => setViewMode('calendar')} 
                  className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors", viewMode === 'calendar' ? "bg-white text-black" : "text-[#8E8E93] hover:text-white")}
                >
                  Calendar
                </button>
              </div>
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <Sparkles className={cn("w-5 h-5", isOptimizing && "animate-spin")} />
                {isOptimizing ? 'Analyzing...' : 'Neural Optimize'}
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
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
          ) : (
            <div className="relative bg-[#1C1C1E] border border-white/5 rounded-[32px] overflow-hidden h-[800px] overflow-y-auto scrollbar-hide">
              <div className="relative min-w-[600px]" style={{ height: 24 * 180 }}>
                {/* Time grid */}
                {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                  <div key={hour} className="flex border-b border-white/10" style={{ height: 180 }}>
                    <div className="w-20 shrink-0 border-r border-white/10 flex items-start justify-end pr-4 pt-2">
                      <span className="text-xs font-medium text-[#8E8E93]">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      {/* 15 min line */}
                      <div className="absolute top-[25%] left-0 right-0 border-b border-white/[0.02]" />
                      {/* 30 min line */}
                      <div className="absolute top-[50%] left-0 right-0 border-b border-white/[0.05] border-dashed" />
                      {/* 45 min line */}
                      <div className="absolute top-[75%] left-0 right-0 border-b border-white/[0.02]" />
                    </div>
                  </div>
                ))}

                {/* Current Time Indicator */}
                {selectedDay === currentDayName && (
                  <div 
                    className="absolute left-20 right-0 z-50 flex items-center pointer-events-none"
                    style={{ top: (currentTimeMins / 60) * 180 }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-[5px]" />
                    <div className="h-[2px] bg-red-500 w-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  </div>
                )}
                
                {/* Activities */}
                <div className="absolute top-0 left-20 right-0 bottom-0">
                  {(() => {
                    const activitiesWithTimes = schedule[selectedDay].map(activity => {
                      const [startStr, endStr] = activity.time.split(' – ');
                      const startMins = parseTimeStr(startStr);
                      const endMins = parseTimeStr(endStr);
                      return { ...activity, startMins, endMins };
                    }).sort((a, b) => a.startMins - b.startMins || b.endMins - a.endMins);

                    const clusters: typeof activitiesWithTimes[] = [];
                    let currentCluster: typeof activitiesWithTimes = [];
                    let clusterEnd = 0;

                    activitiesWithTimes.forEach(activity => {
                      if (currentCluster.length > 0 && activity.startMins >= clusterEnd) {
                        clusters.push(currentCluster);
                        currentCluster = [activity];
                        clusterEnd = activity.endMins;
                      } else {
                        currentCluster.push(activity);
                        clusterEnd = Math.max(clusterEnd, activity.endMins);
                      }
                    });
                    if (currentCluster.length > 0) {
                      clusters.push(currentCluster);
                    }

                    const layoutedActivities = clusters.flatMap(cluster => {
                      const columns: typeof activitiesWithTimes[] = [];
                      cluster.forEach(activity => {
                        let placed = false;
                        for (let i = 0; i < columns.length; i++) {
                          if (columns[i][columns[i].length - 1].endMins <= activity.startMins) {
                            columns[i].push(activity);
                            (activity as any).colIdx = i;
                            placed = true;
                            break;
                          }
                        }
                        if (!placed) {
                          columns.push([activity]);
                          (activity as any).colIdx = columns.length - 1;
                        }
                      });
                      
                      cluster.forEach(activity => {
                        (activity as any).numCols = columns.length;
                      });
                      
                      return cluster;
                    });

                    return layoutedActivities.map((activity: any) => {
                      const duration = activity.endMins - activity.startMins;
                      const HOUR_HEIGHT = 180;
                      const top = (activity.startMins / 60) * HOUR_HEIGHT;
                      const height = Math.max((duration / 60) * HOUR_HEIGHT, 48); // Min height of 48px for readability
                      
                      return (
                        <div
                          key={activity.id}
                          onClick={() => setEditingActivity({ day: selectedDay, activity })}
                          className={cn(
                            "absolute rounded-xl p-3 border cursor-pointer hover:brightness-110 transition-all overflow-hidden flex flex-col justify-center",
                            activity.type === 'study' ? "bg-brand/20 border-brand/30 text-brand" :
                            activity.type === 'tuition' ? "bg-purple-500/20 border-purple-500/30 text-purple-400" :
                            activity.type === 'break' ? "bg-zinc-500/20 border-zinc-500/30 text-zinc-400" :
                            "bg-blue-500/20 border-blue-500/30 text-blue-400",
                            height <= 48 ? "py-1" : "py-3"
                          )}
                          style={{ 
                            top, 
                            height, 
                            zIndex: height <= 48 ? 10 : 1,
                            left: `calc(8px + (100% - 24px) * ${activity.colIdx} / ${activity.numCols})`,
                            width: `calc((100% - 24px) / ${activity.numCols} - 4px)`
                          }}
                        >
                          <div className={cn("font-bold", height <= 48 ? "text-[10px] mb-0" : "text-xs mb-1")}>{activity.time}</div>
                          <div className={cn("font-medium leading-tight truncate", height <= 48 ? "text-xs" : "text-sm")}>{activity.description}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1C1C1E] border border-white/10 shadow-2xl rounded-[32px] p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Edit Activity</h3>
                  <p className="text-sm font-medium text-[#8E8E93] mt-1">Adjust schedule block</p>
                </div>
                <button onClick={() => setEditingActivity(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#8E8E93] block">Description</label>
                  <input 
                    type="text"
                    value={editingActivity.activity.description}
                    onChange={(e) => setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, description: e.target.value }
                    })}
                    className="w-full bg-black border border-white/10 px-4 py-3 text-base font-medium rounded-[20px] text-white focus:border-brand outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#8E8E93] block">Start Time</label>
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
                      className="w-full bg-black border border-white/10 px-4 py-3 text-base font-medium rounded-[20px] text-white focus:border-brand outline-none transition-colors tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#8E8E93] block">End Time</label>
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
                      className="w-full bg-black border border-white/10 px-4 py-3 text-base font-medium rounded-[20px] text-white focus:border-brand outline-none transition-colors tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#8E8E93] block">Classification</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['study', 'tuition', 'break', 'rest'].map(type => (
                      <button
                        key={type}
                        onClick={() => setEditingActivity({
                          ...editingActivity,
                          activity: { ...editingActivity.activity, type: type as Activity['type'] }
                        })}
                        className={cn(
                          "px-4 py-3 text-sm font-semibold rounded-[20px] transition-all capitalize",
                          editingActivity.activity.type === type 
                            ? "bg-white text-black" 
                            : "bg-white/5 text-[#8E8E93] hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-white/5">
                  <button 
                    onClick={() => setEditingActivity(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      updateActivity(editingActivity.day, editingActivity.activity.id, editingActivity.activity);
                      setEditingActivity(null);
                    }}
                    className="flex-1 py-4 bg-brand text-white font-semibold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Task to Schedule Modal */}
      <AnimatePresence>
        {addingTaskToSchedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddingTaskToSchedule(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1C1C1E] border border-white/10 shadow-2xl rounded-[32px] p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Add to Schedule</h3>
                  <p className="text-sm font-medium text-[#8E8E93] mt-1">Convert task to a time block</p>
                </div>
                <button onClick={() => setAddingTaskToSchedule(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#8E8E93] block">Task</label>
                  <div className="w-full bg-white/5 border border-white/10 px-4 py-3 text-base font-medium rounded-[20px] text-white">
                    {addingTaskToSchedule.title}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#8E8E93] block">Start Time</label>
                    <input 
                      type="time"
                      value={newTaskStartTime}
                      onChange={(e) => setNewTaskStartTime(e.target.value)}
                      className="w-full bg-black border border-white/10 px-4 py-3 text-base font-medium rounded-[20px] text-white focus:border-brand outline-none transition-colors tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#8E8E93] block">End Time</label>
                    <input 
                      type="time"
                      value={newTaskEndTime}
                      onChange={(e) => setNewTaskEndTime(e.target.value)}
                      className="w-full bg-black border border-white/10 px-4 py-3 text-base font-medium rounded-[20px] text-white focus:border-brand outline-none transition-colors tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#8E8E93] block">Classification</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['study', 'tuition', 'break', 'rest'].map(type => (
                      <button
                        key={type}
                        onClick={() => setNewTaskType(type as Activity['type'])}
                        className={cn(
                          "px-4 py-3 text-sm font-semibold rounded-[20px] transition-all capitalize",
                          newTaskType === type 
                            ? "bg-white text-black" 
                            : "bg-white/5 text-[#8E8E93] hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-6 border-t border-white/5">
                  <button 
                    onClick={() => setAddingTaskToSchedule(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const formatTime = (timeStr: string) => {
                        const [hours, minutes] = timeStr.split(':');
                        const h = parseInt(hours, 10);
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const formattedHours = h % 12 || 12;
                        return `${formattedHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                      };

                      const newActivity: Activity = {
                        id: Math.random().toString(36).substring(2, 9),
                        time: `${formatTime(newTaskStartTime)} – ${formatTime(newTaskEndTime)}`,
                        description: addingTaskToSchedule.title,
                        type: newTaskType,
                        focusMode: addingTaskToSchedule.focusMode
                      };
                      
                      addActivityToSchedule(selectedDay, newActivity);
                      setAddingTaskToSchedule(null);
                      addToast('Task added to schedule', 'success');
                    }}
                    className="flex-1 py-4 bg-brand text-white font-semibold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Block
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plan for Tomorrow Modal */}
      <AnimatePresence>
        {isPlanningForTomorrow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlanningForTomorrow(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1C1C1E] border border-white/10 shadow-2xl rounded-[32px] p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Plan for Tomorrow</h3>
                  <p className="text-sm font-medium text-[#8E8E93] mt-1">Select tasks to schedule for {days[(days.indexOf(currentDayName as any) + 1) % 7]}</p>
                </div>
                <button onClick={() => setIsPlanningForTomorrow(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2 scrollbar-hide">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-[#8E8E93] block">Existing Tasks</label>
                  {tasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => {
                        if (selectedTasksForTomorrow.includes(task.id)) {
                          setSelectedTasksForTomorrow(selectedTasksForTomorrow.filter(id => id !== task.id));
                        } else {
                          setSelectedTasksForTomorrow([...selectedTasksForTomorrow, task.id]);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-[20px] border cursor-pointer transition-all flex items-center gap-4",
                        selectedTasksForTomorrow.includes(task.id)
                          ? "bg-brand/20 border-brand/30"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        selectedTasksForTomorrow.includes(task.id)
                          ? "border-brand bg-brand text-white"
                          : "border-white/20"
                      )}>
                        {selectedTasksForTomorrow.includes(task.id) && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{task.title}</p>
                        <p className="text-xs text-[#8E8E93] truncate">{subjects.find(s => s.id === task.subjectId)?.name || 'General'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="text-sm font-semibold text-[#8E8E93] block">Add New Task</label>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={newTaskForTomorrowTitle}
                      onChange={(e) => setNewTaskForTomorrowTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNewTaskForTomorrow()}
                      placeholder="E.g., Review Chapter 4"
                      className="flex-1 bg-black border border-white/10 px-4 py-3 text-base font-medium rounded-[20px] text-white focus:border-brand outline-none transition-colors"
                    />
                    <button 
                      onClick={handleAddNewTaskForTomorrow}
                      disabled={!newTaskForTomorrowTitle.trim()}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold rounded-[20px] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-white/5 shrink-0">
                <button 
                  onClick={() => setIsPlanningForTomorrow(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePlanForTomorrow}
                  disabled={selectedTasksForTomorrow.length === 0}
                  className="flex-1 py-4 bg-brand text-white font-semibold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule {selectedTasksForTomorrow.length} Task{selectedTasksForTomorrow.length !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
