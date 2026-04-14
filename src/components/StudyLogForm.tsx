import React from 'react';
import { X, Star, BookOpen, Save, AlertCircle } from 'lucide-react';
import { Subject } from '../types';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const studyLogSchema = z.object({
  subjectId: z.string().min(1, 'Please select a subject'),
  topicIds: z.array(z.string()).min(1, 'Please select at least one topic'),
  hours: z.number().min(0),
  minutes: z.number().min(0).max(59),
  focusLevel: z.number().min(1).max(5),
  notes: z.string().optional(),
  sessionType: z.enum(['self-study', 'tuition', 'exam']),
}).refine((data) => (data.hours * 60 + data.minutes) > 0, {
  message: "Duration must be greater than 0",
  path: ["minutes"],
});

type StudyLogFormData = z.infer<typeof studyLogSchema>;

interface StudyLogFormProps {
  subjects: Subject[];
  initialData?: {
    subjectId: string;
    topicIds?: string[];
    duration: number;
    sessionType?: 'self-study' | 'tuition' | 'exam';
  };
  onSave: (log: { subjectId: string, topicIds: string[], duration: number, focusLevel: number, notes: string, sessionType: 'self-study' | 'tuition' | 'exam' }) => void;
  onClose: () => void;
}

export default function StudyLogForm({ subjects, initialData, onSave, onClose }: StudyLogFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StudyLogFormData>({
    resolver: zodResolver(studyLogSchema),
    defaultValues: {
      subjectId: initialData?.subjectId || subjects[0]?.id || '',
      topicIds: initialData?.topicIds || (subjects.find(s => s.id === (initialData?.subjectId || subjects[0]?.id))?.topics[0]?.id ? [subjects.find(s => s.id === (initialData?.subjectId || subjects[0]?.id))!.topics[0].id] : []),
      hours: initialData ? Math.floor(initialData.duration / 60) : 1,
      minutes: initialData ? initialData.duration % 60 : 30,
      focusLevel: 4,
      notes: '',
      sessionType: initialData?.sessionType || 'self-study',
    }
  });

  const watchedSubjectId = watch('subjectId');
  const selectedSubject = subjects.find(s => s.id === watchedSubjectId);

  const onSubmit = (data: StudyLogFormData) => {
    onSave({
      subjectId: data.subjectId,
      topicIds: data.topicIds,
      duration: (data.hours * 60) + data.minutes,
      focusLevel: data.focusLevel,
      notes: data.notes || '',
      sessionType: data.sessionType as 'self-study' | 'tuition' | 'exam',
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-[#1C1C1E] border border-white/5 shadow-2xl rounded-[32px] overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white tracking-tight">
            <BookOpen className="w-5 h-5 text-brand" />
            Log Study Session
          </h3>
          <button onClick={onClose} className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 p-4 text-[#FF453A] text-sm font-medium space-y-2 rounded-[16px]">
              {Object.entries(errors).map(([key, error]) => (
                <div key={key} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error?.message as string}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Subject</label>
              <select 
                {...register('subjectId', {
                  onChange: (e) => {
                    const sub = subjects.find(s => s.id === e.target.value);
                    if (sub && sub.topics.length > 0) setValue('topicIds', [sub.topics[0].id]);
                    else setValue('topicIds', []);
                  }
                })}
                className="w-full bg-black border border-white/5 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[16px] appearance-none"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Topics (Multi-select)</label>
              <select 
                multiple
                {...register('topicIds')}
                className="w-full bg-black border border-white/5 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[16px] h-28"
              >
                {selectedSubject?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <p className="text-xs text-[#8E8E93] font-medium">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Session Type</label>
            <div className="flex gap-3">
              {['self-study', 'tuition', 'exam'].map((type) => (
                <label key={type} className="flex-1 flex items-center justify-center gap-2 bg-black border border-white/5 px-4 py-3 cursor-pointer hover:border-brand transition-colors rounded-[16px] has-[:checked]:border-brand has-[:checked]:bg-brand/10">
                  <input 
                    type="radio" 
                    value={type} 
                    {...register('sessionType')}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-white capitalize">{type.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Duration</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input 
                    type="number"
                    {...register('hours', { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full bg-black border border-white/5 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand text-center transition-colors rounded-[16px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8E8E93] pointer-events-none">hrs</span>
                </div>
                <div className="relative flex-1">
                  <input 
                    type="number"
                    {...register('minutes', { valueAsNumber: true })}
                    placeholder="30"
                    className="w-full bg-black border border-white/5 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand text-center transition-colors rounded-[16px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8E8E93] pointer-events-none">min</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Focus Intensity (1-5)</label>
              <div className="relative">
                <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                <input 
                  type="number"
                  {...register('focusLevel', { valueAsNumber: true })}
                  className="w-full bg-black border border-white/5 pl-11 pr-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[16px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Notes / Analytics</label>
            <textarea 
              {...register('notes')}
              placeholder="What did you learn? Any difficult concepts?"
              className="w-full bg-black border border-white/5 px-4 py-3 h-28 text-sm font-medium text-white outline-none focus:border-brand transition-colors resize-none rounded-[16px]"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 text-sm font-semibold bg-brand text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 rounded-full shadow-md"
          >
            <Save className="w-5 h-5" />
            Save Session Data
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

