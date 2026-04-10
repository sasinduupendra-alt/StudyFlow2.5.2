import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronUp, ChevronDown, GripVertical, Edit2, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeeklySchedule, Activity } from '../types';
import { cn } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const activitySchema = z.object({
  time: z.string().regex(/^\d{1,2}:\d{2}\s*(?:AM|PM)\s*[–-]\s*\d{1,2}:\d{2}\s*(?:AM|PM)$/i, {
    message: "Invalid time format. Use '08:00 AM – 10:00 AM'."
  }),
  description: z.string().min(1, "Description is required"),
  type: z.enum(['study', 'tuition', 'break', 'rest']),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ScheduleManagerProps {
  schedule: WeeklySchedule;
  onUpdateSchedule: (day: keyof WeeklySchedule, activities: Activity[]) => void;
  setConfirmModal: (val: any) => void;
  setError: (val: string | null) => void;
}

export default function ScheduleManager({
  schedule,
  onUpdateSchedule,
  setConfirmModal,
  setError
}: ScheduleManagerProps) {
  const [expandedDay, setExpandedDay] = useState<keyof WeeklySchedule | null>(null);
  const [editingActivity, setEditingActivity] = useState<{day: keyof WeeklySchedule, id: string} | null>(null);
  const [isAddingActivity, setIsAddingActivity] = useState<keyof WeeklySchedule | null>(null);

  const days: (keyof WeeklySchedule)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Form for adding new activity
  const addForm = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      time: '',
      description: '',
      type: 'study'
    }
  });

  // Form for editing existing activity
  const editForm = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema)
  });

  useEffect(() => {
    if (editingActivity) {
      const activity = schedule[editingActivity.day].find(a => a.id === editingActivity.id);
      if (activity) {
        editForm.reset({
          time: activity.time,
          description: activity.description,
          type: activity.type
        });
      }
    }
  }, [editingActivity, schedule, editForm]);

  const handleDragEnd = (event: DragEndEvent, day: keyof WeeklySchedule) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = schedule[day].findIndex(a => a.id === active.id);
      const newIndex = schedule[day].findIndex(a => a.id === over.id);
      onUpdateSchedule(day, arrayMove(schedule[day], oldIndex, newIndex));
    }
  };

  const onAddSubmit = (data: ActivityFormData) => {
    if (!isAddingActivity) return;
    const newActivity: Activity = { 
      id: Math.random().toString(36).substr(2, 9), 
      ...data 
    };
    onUpdateSchedule(isAddingActivity, [...schedule[isAddingActivity], newActivity]);
    setIsAddingActivity(null);
    addForm.reset();
    setError(null);
  };

  const onEditSubmit = (data: ActivityFormData) => {
    if (!editingActivity) return;
    const { day, id } = editingActivity;
    
    const activityIndex = schedule[day].findIndex(a => a.id === id);
    if (activityIndex === -1) return;

    const oldActivity = schedule[day][activityIndex];
    const newActivities = [...schedule[day]];

    // Helper to parse time string into minutes
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(/\s*[–-]\s*/);
      if (parts.length !== 2) return null;
      const parse12Hour = (str: string) => {
        const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return { start: parse12Hour(parts[0]), end: parse12Hour(parts[1]) };
    };

    // Helper to format minutes into time string
    const formatTime = (minutes: number) => {
      // Handle overflow past midnight
      minutes = (minutes + 24 * 60) % (24 * 60);
      let hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
    };

    const oldTimeParsed = parseTime(oldActivity.time);
    const newTimeParsed = parseTime(data.time);

    newActivities[activityIndex] = { ...oldActivity, ...data };

    // Auto-adjust subsequent activities if end time changed
    if (oldTimeParsed && newTimeParsed) {
      const shiftAmount = newTimeParsed.end - oldTimeParsed.end;
      
      if (shiftAmount !== 0) {
        for (let i = activityIndex + 1; i < newActivities.length; i++) {
          const currentParsed = parseTime(newActivities[i].time);
          if (currentParsed) {
            const newStart = currentParsed.start + shiftAmount;
            const newEnd = currentParsed.end + shiftAmount;
            newActivities[i] = {
              ...newActivities[i],
              time: `${formatTime(newStart)} - ${formatTime(newEnd)}`
            };
          }
        }
      }
    }

    onUpdateSchedule(day, newActivities);
    setEditingActivity(null);
    setError(null);
  };

  const handleDeleteActivity = (day: keyof WeeklySchedule, id: string) => {
    onUpdateSchedule(day, schedule[day].filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
          <Calendar className="w-4 h-4 text-brand" />
          CHRONO_SCHEDULE_INTERFACE
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {days.map(day => (
          <div key={day} className="scifi-panel overflow-hidden">
            <button onClick={() => setExpandedDay(expandedDay === day ? null : day)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-border-dim flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gray-700" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black uppercase tracking-tighter">{day}</h4>
                  <p className="hud-label !text-brand">{schedule[day].length}_ACTIVITIES_LOADED</p>
                </div>
              </div>
              {expandedDay === day ? <ChevronUp className="w-4 h-4 text-gray-700" /> : <ChevronDown className="w-4 h-4 text-gray-700" />}
            </button>
            <AnimatePresence>
              {expandedDay === day && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border-dim overflow-hidden">
                  <div className="p-6 space-y-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, day)}>
                      <SortableContext items={schedule[day].map(a => a.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                          {schedule[day].map(activity => (
                            <SortableActivityItem 
                              key={activity.id} 
                              activity={activity} 
                              day={day} 
                              editingActivity={editingActivity} 
                              setEditingActivity={setEditingActivity} 
                              editForm={editForm}
                              onEditSubmit={onEditSubmit}
                              handleDeleteActivity={(d, id) => setConfirmModal({ isOpen: true, title: 'Delete Activity', message: 'Delete activity?', onConfirm: () => handleDeleteActivity(d, id) })} 
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    {isAddingActivity === day ? (
                      <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="bg-black/40 p-4 border border-border-dim space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="hud-label !text-gray-600">TIME_WINDOW</label>
                            <input 
                              {...addForm.register('time')}
                              placeholder="08:00 AM – 10:00 AM" 
                              className={cn(
                                "w-full bg-black/40 border px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors",
                                addForm.formState.errors.time ? "border-red-500" : "border-border-dim"
                              )} 
                            />
                            {addForm.formState.errors.time && <p className="text-[9px] text-red-500 font-black uppercase">{addForm.formState.errors.time.message}</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="hud-label !text-gray-600">ACTIVITY_DESC</label>
                            <input 
                              {...addForm.register('description')}
                              placeholder="DESCRIPTION" 
                              className={cn(
                                "w-full bg-black/40 border px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors",
                                addForm.formState.errors.description ? "border-red-500" : "border-border-dim"
                              )} 
                            />
                            {addForm.formState.errors.description && <p className="text-[9px] text-red-500 font-black uppercase">{addForm.formState.errors.description.message}</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="hud-label !text-gray-600">TYPE_CLASS</label>
                            <select {...addForm.register('type')} className="w-full bg-black/40 border border-border-dim px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors">
                              <option value="study">STUDY</option>
                              <option value="tuition">TUITION</option>
                              <option value="break">BREAK</option>
                              <option value="rest">REST</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => { setIsAddingActivity(null); addForm.reset(); }} className="px-4 py-2 text-gray-700 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">CANCEL</button>
                          <button type="submit" className="scifi-button px-6 py-2 text-[10px]">INITIALIZE_ACTIVITY</button>
                        </div>
                      </form>
                    ) : ( <button onClick={() => setIsAddingActivity(day)} className="w-full py-3 border border-dashed border-border-dim text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-white transition-colors">+ ADD_ACTIVITY_TO_{day}</button> )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortableActivityItem({ activity, day, editingActivity, setEditingActivity, editForm, onEditSubmit, handleDeleteActivity }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.5 : 1 };
  
  const isEditing = editingActivity?.id === activity.id;

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-4 p-3 bg-white/5 border border-border-dim group transition-all", isDragging && "shadow-2xl ring-1 ring-brand/50")}>
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-gray-800 hover:text-gray-600 transition-colors"><GripVertical className="w-4 h-4" /></div>
      {isEditing ? (
        <form id={`edit-form-${activity.id}`} onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <input 
              {...editForm.register('time')}
              className={cn(
                "w-full bg-black/40 border px-3 py-1 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors",
                editForm.formState.errors.time ? "border-red-500" : "border-border-dim"
              )} 
            />
          </div>
          <div className="space-y-1">
            <input 
              {...editForm.register('description')}
              className={cn(
                "w-full bg-black/40 border px-3 py-1 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors",
                editForm.formState.errors.description ? "border-red-500" : "border-border-dim"
              )} 
            />
          </div>
          <select {...editForm.register('type')} className="bg-black/40 border border-border-dim px-3 py-1 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors">
            <option value="study">STUDY</option>
            <option value="tuition">TUITION</option>
            <option value="break">BREAK</option>
            <option value="rest">REST</option>
          </select>
        </form>
      ) : (
        <>
          <div className="w-32 text-[10px] font-black text-gray-600 tabular-nums uppercase tracking-tighter">{activity.time}</div>
          <div className="flex-1 text-[11px] font-black uppercase tracking-tight">{activity.description}</div>
          <div className={cn(
            "px-2 py-0.5 border text-[9px] font-black uppercase tracking-widest", 
            activity.type === 'study' ? "border-brand/30 text-brand bg-brand/5" : 
            activity.type === 'tuition' ? "border-blue-500/30 text-blue-500 bg-blue-500/5" :
            activity.type === 'break' ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5" :
            "border-gray-500/30 text-gray-500 bg-gray-500/5"
          )}>
            {activity.type}
          </div>
        </>
      )}
      <div className="flex items-center gap-1">
        {isEditing ? ( 
          <>
            <button type="submit" form={`edit-form-${activity.id}`} className="p-2 text-brand hover:scale-110 transition-transform"><Save className="w-4 h-4" /></button> 
            <button type="button" onClick={() => setEditingActivity(null)} className="p-2 text-red-500 hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
          </>
        ) : ( 
          <button onClick={() => setEditingActivity({ day, id: activity.id })} className="p-2 text-gray-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Edit2 className="w-3.5 h-3.5" /></button> 
        )}
        <button onClick={() => handleDeleteActivity(day, activity.id)} className="p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

