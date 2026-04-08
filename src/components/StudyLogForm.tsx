import React from 'react';
import { X, Star, BookOpen, Save, AlertCircle } from 'lucide-react';
import { Subject } from '../types';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const studyLogSchema = z.object({
  subjectId: z.string().min(1, 'Please select a subject'),
  topicId: z.string().min(1, 'Please select a topic'),
  hours: z.number().min(0),
  minutes: z.number().min(0).max(59),
  focusLevel: z.number().min(1).max(5),
  notes: z.string().optional(),
}).refine((data) => (data.hours * 60 + data.minutes) > 0, {
  message: "Duration must be greater than 0",
  path: ["minutes"],
});

type StudyLogFormData = z.infer<typeof studyLogSchema>;

interface StudyLogFormProps {
  subjects: Subject[];
  initialData?: {
    subjectId: string;
    topicId: string;
    duration: number;
  };
  onSave: (log: { subjectId: string, topicId: string, duration: number, focusLevel: number, notes: string }) => void;
  onClose: () => void;
}

export default function StudyLogForm({ subjects, initialData, onSave, onClose }: StudyLogFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StudyLogFormData>({
    resolver: zodResolver(studyLogSchema),
    defaultValues: {
      subjectId: initialData?.subjectId || subjects[0]?.id || '',
      topicId: initialData?.topicId || subjects.find(s => s.id === (initialData?.subjectId || subjects[0]?.id))?.topics[0]?.id || '',
      hours: initialData ? Math.floor(initialData.duration / 60) : 1,
      minutes: initialData ? initialData.duration % 60 : 30,
      focusLevel: 4,
      notes: '',
    }
  });

  const watchedSubjectId = watch('subjectId');
  const selectedSubject = subjects.find(s => s.id === watchedSubjectId);

  const onSubmit = (data: StudyLogFormData) => {
    onSave({
      subjectId: data.subjectId,
      topicId: data.topicId,
      duration: (data.hours * 60) + data.minutes,
      focusLevel: data.focusLevel,
      notes: data.notes || '',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#181818] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#1DB954]/10 to-transparent">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1DB954]" />
            Log Study Session
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-500 text-xs font-bold space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <div key={key} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error?.message as string}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subject</label>
              <select 
                {...register('subjectId', {
                  onChange: (e) => {
                    const sub = subjects.find(s => s.id === e.target.value);
                    if (sub) setValue('topicId', sub.topics[0]?.id || '');
                  }
                })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1DB954] outline-none"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Topic</label>
              <select 
                {...register('topicId')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1DB954] outline-none"
              >
                {selectedSubject?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Duration</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="number"
                    {...register('hours', { valueAsNumber: true })}
                    placeholder="Hrs"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1DB954] outline-none text-center"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-600 pointer-events-none">HRS</span>
                </div>
                <div className="relative flex-1">
                  <input 
                    type="number"
                    {...register('minutes', { valueAsNumber: true })}
                    placeholder="Min"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1DB954] outline-none text-center"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-600 pointer-events-none">MIN</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Focus Level (1-5)</label>
              <div className="relative">
                <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="number"
                  {...register('focusLevel', { valueAsNumber: true })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-[#1DB954] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notes / Key Takeaways</label>
            <textarea 
              {...register('notes')}
              placeholder="What did you learn? Any difficult concepts?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 focus:ring-2 focus:ring-[#1DB954] outline-none resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#1DB954] text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <Save className="w-5 h-5" />
            Save Session
          </button>
        </form>
      </motion.div>
    </div>
  );
}

