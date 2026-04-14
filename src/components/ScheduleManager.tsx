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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white tracking-tight">
          <Calendar className="w-5 h-5 text-brand" />
          Schedule Management
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {days.map(day => (
          <div key={day} className="bg-[#1C1C1E] border border-white/5 overflow-hidden rounded-[24px] shadow-sm">
            <button onClick={() => setExpandedDay(expandedDay === day ? null : day)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black border border-white/5 flex items-center justify-center rounded-[16px]">
                  <Clock className="w-5 h-5 text-[#8E8E93]" />
                </div>
                <div className="text-left">
                  <h4 className="text-base font-semibold text-white">{day}</h4>
                  <p className="text-sm font-medium text-[#8E8E93] mt-0.5">{schedule[day].length} Activities</p>
                </div>
              </div>
              {expandedDay === day ? <ChevronUp className="w-5 h-5 text-[#8E8E93]" /> : <ChevronDown className="w-5 h-5 text-[#8E8E93]" />}
            </button>
            <AnimatePresence>
              {expandedDay === day && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/5 overflow-hidden bg-black/20">
                  <div className="p-6 space-y-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, day)}>
                      <SortableContext items={schedule[day].map(a => a.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
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
                      <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="bg-white/5 p-6 border border-white/5 space-y-6 rounded-[20px]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Time Window</label>
                            <input 
                              {...addForm.register('time')}
                              placeholder="08:00 AM – 10:00 AM" 
                              className={cn(
                                "w-full bg-black border px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[16px]",
                                addForm.formState.errors.time ? "border-[#FF453A]" : "border-white/5"
                              )} 
                            />
                            {addForm.formState.errors.time && <p className="text-xs text-[#FF453A] font-medium">{addForm.formState.errors.time.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Description</label>
                            <input 
                              {...addForm.register('description')}
                              placeholder="e.g., Mathematics Study" 
                              className={cn(
                                "w-full bg-black border px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[16px]",
                                addForm.formState.errors.description ? "border-[#FF453A]" : "border-white/5"
                              )} 
                            />
                            {addForm.formState.errors.description && <p className="text-xs text-[#FF453A] font-medium">{addForm.formState.errors.description.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Type</label>
                            <select {...addForm.register('type')} className="w-full bg-black border border-white/5 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[16px] appearance-none">
                              <option value="study">Study</option>
                              <option value="tuition">Tuition</option>
                              <option value="break">Break</option>
                              <option value="rest">Rest</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => { setIsAddingActivity(null); addForm.reset(); }} className="px-5 py-2.5 text-sm font-semibold text-[#8E8E93] hover:text-white hover:bg-white/5 transition-colors rounded-full">Cancel</button>
                          <button type="submit" className="px-6 py-2.5 text-sm font-semibold bg-brand text-white hover:opacity-90 transition-opacity rounded-full shadow-md">Add Activity</button>
                        </div>
                      </form>
                    ) : ( <button onClick={() => setIsAddingActivity(day)} className="w-full py-4 border border-dashed border-white/10 text-sm font-semibold text-[#8E8E93] hover:text-white hover:bg-white/5 transition-colors rounded-[20px]">+ Add Activity to {day}</button> )}
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
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-4 p-4 bg-white/5 border border-white/5 group transition-all rounded-[16px] hover:bg-white/10", isDragging && "shadow-2xl ring-1 ring-brand bg-white/10")}>
      <div {...attributes} {...listeners} className="cursor-grab p-1.5 text-[#8E8E93] hover:text-white transition-colors rounded-md"><GripVertical className="w-4 h-4" /></div>
      {isEditing ? (
        <form id={`edit-form-${activity.id}`} onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <input 
              {...editForm.register('time')}
              className={cn(
                "w-full bg-black border px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[12px]",
                editForm.formState.errors.time ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
          </div>
          <div className="space-y-1">
            <input 
              {...editForm.register('description')}
              className={cn(
                "w-full bg-black border px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[12px]",
                editForm.formState.errors.description ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
          </div>
          <select {...editForm.register('type')} className="bg-black border border-white/5 px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[12px] appearance-none">
            <option value="study">Study</option>
            <option value="tuition">Tuition</option>
            <option value="break">Break</option>
            <option value="rest">Rest</option>
          </select>
        </form>
      ) : (
        <>
          <div className="w-36 text-sm font-semibold text-[#8E8E93] tabular-nums">{activity.time}</div>
          <div className="flex-1 text-sm font-semibold text-white">{activity.description}</div>
          <div className={cn(
            "px-3 py-1 text-xs font-bold rounded-full", 
            activity.type === 'study' ? "bg-brand/20 text-brand" : 
            activity.type === 'tuition' ? "bg-[#0A84FF]/20 text-[#0A84FF]" :
            activity.type === 'break' ? "bg-[#FF9F0A]/20 text-[#FF9F0A]" :
            "bg-[#8E8E93]/20 text-[#8E8E93]"
          )}>
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </div>
        </>
      )}
      <div className="flex items-center gap-1">
        {isEditing ? ( 
          <>
            <button type="submit" form={`edit-form-${activity.id}`} className="p-2 text-brand hover:bg-brand/10 transition-colors rounded-full"><Save className="w-4 h-4" /></button> 
            <button type="button" onClick={() => setEditingActivity(null)} className="p-2 text-[#8E8E93] hover:bg-white/10 transition-colors rounded-full"><X className="w-4 h-4" /></button>
          </>
        ) : ( 
          <button onClick={() => setEditingActivity({ day, id: activity.id })} className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all rounded-full"><Edit2 className="w-4 h-4" /></button> 
        )}
        <button onClick={() => handleDeleteActivity(day, activity.id)} className="p-2 text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 opacity-0 group-hover:opacity-100 transition-all rounded-full"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

