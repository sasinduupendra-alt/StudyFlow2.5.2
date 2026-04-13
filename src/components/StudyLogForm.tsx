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
        className="scifi-panel w-full max-w-lg overflow-hidden border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] rounded-none"
      >
        <div className="p-6 border-b border-border-dim flex items-center justify-between bg-white/5">
          <h3 className="text-sm font-mono flex items-center gap-2 uppercase tracking-widest text-white">
            <BookOpen className="w-4 h-4 text-white" />
            SESSION_LOG_INITIALIZATION
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 p-3 text-red-500 text-[9px] font-mono uppercase tracking-widest space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <div key={key} className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error?.message as string}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="hud-label !text-zinc-500">SUBJECT_NODE</label>
              <select 
                {...register('subjectId', {
                  onChange: (e) => {
                    const sub = subjects.find(s => s.id === e.target.value);
                    if (sub && sub.topics.length > 0) setValue('topicIds', [sub.topics[0].id]);
                    else setValue('topicIds', []);
                  }
                })}
                className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors rounded-none"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="hud-label !text-zinc-500">TOPIC_IDENTIFIERS (MULTI-SELECT)</label>
              <select 
                multiple
                {...register('topicIds')}
                className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors rounded-none h-24"
              >
                {selectedSubject?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <p className="text-[8px] text-zinc-500 font-mono uppercase">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="hud-label !text-zinc-500">SESSION_TYPE</label>
            <div className="flex gap-2">
              {['self-study', 'tuition', 'exam'].map((type) => (
                <label key={type} className="flex-1 flex items-center gap-2 bg-black/40 border border-border-dim px-4 py-3 cursor-pointer hover:border-white/50 transition-colors">
                  <input 
                    type="radio" 
                    value={type} 
                    {...register('sessionType')}
                    className="accent-white"
                  />
                  <span className="text-[10px] font-mono uppercase">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="hud-label !text-zinc-500">CHRONO_DURATION</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="number"
                    {...register('hours', { valueAsNumber: true })}
                    placeholder="HRS"
                    className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-mono uppercase outline-none focus:border-white/50 text-center transition-colors rounded-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-zinc-500 pointer-events-none">HRS</span>
                </div>
                <div className="relative flex-1">
                  <input 
                    type="number"
                    {...register('minutes', { valueAsNumber: true })}
                    placeholder="MIN"
                    className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-mono uppercase outline-none focus:border-white/50 text-center transition-colors rounded-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-zinc-500 pointer-events-none">MIN</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="hud-label !text-zinc-500">FOCUS_INTENSITY (1-5)</label>
              <div className="relative">
                <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input 
                  type="number"
                  {...register('focusLevel', { valueAsNumber: true })}
                  className="w-full bg-black/40 border border-border-dim pl-12 pr-4 py-3 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors rounded-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="hud-label !text-zinc-500">SYSTEM_NOTES / ANALYTICS</label>
            <textarea 
              {...register('notes')}
              placeholder="WHAT DID YOU LEARN? ANY DIFFICULT CONCEPTS?"
              className="w-full bg-black/40 border border-border-dim px-4 py-3 h-24 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors resize-none rounded-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 rounded-none"
          >
            <Save className="w-4 h-4" />
            COMMIT_SESSION_DATA
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

