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
    const updated = schedule[day].map(a => a.id === id ? { ...a, ...data } : a);
    onUpdateSchedule(day, updated);
    setEditingActivity(null);
    setError(null);
  };

  const handleDeleteActivity = (day: keyof WeeklySchedule, id: string) => {
    onUpdateSchedule(day, schedule[day].filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#1DB954]" />
          Weekly Time Table
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {days.map(day => (
          <div key={day} className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
            <button onClick={() => setExpandedDay(expandedDay === day ? null : day)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-lg">{day}</h4>
                  <p className="text-xs text-gray-500 font-bold uppercase">{schedule[day].length} Activities</p>
                </div>
              </div>
              {expandedDay === day ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
            <AnimatePresence>
              {expandedDay === day && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/5 overflow-hidden">
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
                      <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <input 
                              {...addForm.register('time')}
                              placeholder="Time (e.g. 08:00 AM – 10:00 AM)" 
                              className={cn(
                                "w-full bg-white/5 border rounded-lg px-4 py-2 text-sm outline-none",
                                addForm.formState.errors.time ? "border-red-500" : "border-white/10"
                              )} 
                            />
                            {addForm.formState.errors.time && <p className="text-[10px] text-red-500">{addForm.formState.errors.time.message}</p>}
                          </div>
                          <div className="space-y-1">
                            <input 
                              {...addForm.register('description')}
                              placeholder="Description" 
                              className={cn(
                                "w-full bg-white/5 border rounded-lg px-4 py-2 text-sm outline-none",
                                addForm.formState.errors.description ? "border-red-500" : "border-white/10"
                              )} 
                            />
                            {addForm.formState.errors.description && <p className="text-[10px] text-red-500">{addForm.formState.errors.description.message}</p>}
                          </div>
                          <select {...addForm.register('type')} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none">
                            <option value="study">Study</option>
                            <option value="tuition">Tuition</option>
                            <option value="break">Break</option>
                            <option value="rest">Rest</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => { setIsAddingActivity(null); addForm.reset(); }} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-[#1DB954] text-black rounded-lg font-bold text-sm">Add Activity</button>
                        </div>
                      </form>
                    ) : ( <button onClick={() => setIsAddingActivity(day)} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-xs font-bold text-gray-500 hover:text-white">+ Add Activity to {day}</button> )}
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
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-4 p-3 bg-white/5 rounded-xl group transition-all", isDragging && "shadow-2xl ring-2 ring-[#1DB954]/50")}>
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-gray-600"><GripVertical className="w-4 h-4" /></div>
      {isEditing ? (
        <form id={`edit-form-${activity.id}`} onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <input 
              {...editForm.register('time')}
              className={cn(
                "w-full bg-black/40 border rounded-lg px-3 py-1 text-sm outline-none",
                editForm.formState.errors.time ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <div className="space-y-1">
            <input 
              {...editForm.register('description')}
              className={cn(
                "w-full bg-black/40 border rounded-lg px-3 py-1 text-sm outline-none",
                editForm.formState.errors.description ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <select {...editForm.register('type')} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none">
            <option value="study">Study</option>
            <option value="tuition">Tuition</option>
            <option value="break">Break</option>
            <option value="rest">Rest</option>
          </select>
        </form>
      ) : (
        <>
          <div className="w-32 text-xs font-bold text-gray-500 tabular-nums">{activity.time}</div>
          <div className="flex-1 font-medium">{activity.description}</div>
          <div className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase", 
            activity.type === 'study' ? "bg-[#1DB954]/10 text-[#1DB954]" : 
            activity.type === 'tuition' ? "bg-blue-500/10 text-blue-500" :
            activity.type === 'break' ? "bg-yellow-500/10 text-yellow-500" :
            "bg-gray-500/10 text-gray-500"
          )}>
            {activity.type}
          </div>
        </>
      )}
      <div className="flex items-center gap-1">
        {isEditing ? ( 
          <>
            <button type="submit" form={`edit-form-${activity.id}`} className="p-2 text-[#1DB954]"><Save className="w-4 h-4" /></button> 
            <button type="button" onClick={() => setEditingActivity(null)} className="p-2 text-red-500"><X className="w-4 h-4" /></button>
          </>
        ) : ( 
          <button onClick={() => setEditingActivity({ day, id: activity.id })} className="p-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100"><Edit2 className="w-4 h-4" /></button> 
        )}
        <button onClick={() => handleDeleteActivity(day, activity.id)} className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

