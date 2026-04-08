import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subject, Resource } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '../lib/utils';

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  image: z.string().url("Invalid image URL").or(z.literal('')),
  examDate: z.string().optional(),
  notes: z.string().optional(),
});

const topicSchema = z.object({
  title: z.string().min(1, "Topic title is required"),
  image: z.string().url("Invalid image URL").or(z.literal('')),
  mastery: z.number().min(0).max(100),
});

type SubjectFormData = z.infer<typeof subjectSchema>;
type TopicFormData = z.infer<typeof topicSchema>;

interface SyllabusManagerProps {
  subjects: Subject[];
  syllabusSearch: string;
  setSyllabusSearch: (val: string) => void;
  onResetSyllabus: () => void;
  onAddSubject: (name: string, image?: string, examDate?: string, notes?: string) => void;
  onEditSubject: (id: string, name: string, image?: string, examDate?: string, notes?: string) => void;
  onDeleteSubject: (id: string) => void;
  onAddTopic: (subjectId: string, title: string, image?: string) => void;
  onEditTopic: (subjectId: string, topicId: string, title: string, mastery: number, image?: string, resources?: Resource[]) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
  setResourceModal: (val: any) => void;
  setConfirmModal: (val: any) => void;
  setError: (val: string | null) => void;
}

export default function SyllabusManager({
  subjects,
  syllabusSearch,
  setSyllabusSearch,
  onResetSyllabus,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  setResourceModal,
  setConfirmModal,
  setError
}: SyllabusManagerProps) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ subjectId: string, topicId: string } | null>(null);

  const addSubjectForm = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: '', image: '' }
  });

  const editSubjectForm = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema)
  });

  const editTopicForm = useForm<TopicFormData>({
    resolver: zodResolver(topicSchema)
  });

  useEffect(() => {
    if (editingSubject) {
      const subject = subjects.find(s => s.id === editingSubject);
      if (subject) {
        editSubjectForm.reset({ name: subject.name, image: subject.image || '', examDate: subject.examDate || '', notes: subject.notes || '' });
      }
    }
  }, [editingSubject, subjects, editSubjectForm]);

  useEffect(() => {
    if (editingTopic) {
      const subject = subjects.find(s => s.id === editingTopic.subjectId);
      const topic = subject?.topics.find(t => t.id === editingTopic.topicId);
      if (topic) {
        editTopicForm.reset({ title: topic.title, image: topic.image || '', mastery: topic.mastery });
      }
    }
  }, [editingTopic, subjects, editTopicForm]);

  const onAddSubjectSubmit = (data: SubjectFormData) => {
    if (subjects.some(s => s.name.toLowerCase() === data.name.toLowerCase())) {
      setError(`Subject "${data.name}" already exists.`);
      return;
    }
    onAddSubject(data.name, data.image, data.examDate, data.notes);
    addSubjectForm.reset();
    setError(null);
  };

  const onEditSubjectSubmit = (data: SubjectFormData) => {
    if (editingSubject) {
      onEditSubject(editingSubject, data.name, data.image, data.examDate, data.notes);
      setEditingSubject(null);
    }
  };

  const onEditTopicSubmit = (data: TopicFormData) => {
    if (editingTopic) {
      const subject = subjects.find(s => s.id === editingTopic.subjectId);
      const topic = subject?.topics.find(t => t.id === editingTopic.topicId);
      if (topic) {
        onEditTopic(editingTopic.subjectId, editingTopic.topicId, data.title, data.mastery, data.image, topic.resources);
        setEditingTopic(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1DB954]" />
          Subject & Topic Management
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search subjects or topics..."
              value={syllabusSearch}
              onChange={(e) => setSyllabusSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#1DB954] transition-all"
            />
          </div>
          <button 
            onClick={() => setConfirmModal({
              isOpen: true,
              title: 'Reset Syllabus',
              message: 'Are you sure you want to reset the syllabus to defaults? This will erase your current progress.',
              onConfirm: onResetSyllabus
            })} 
            className="text-xs font-bold text-red-500 hover:underline whitespace-nowrap"
          >
            Reset to Default
          </button>
        </div>
      </div>
      
      <form onSubmit={addSubjectForm.handleSubmit(onAddSubjectSubmit)} className="bg-[#181818] p-6 rounded-2xl border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <input 
              {...addSubjectForm.register('name')}
              placeholder="New Subject Name" 
              className={cn(
                "w-full bg-white/5 border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-[#1DB954]",
                addSubjectForm.formState.errors.name ? "border-red-500" : "border-white/10"
              )} 
            />
            {addSubjectForm.formState.errors.name && <p className="text-[10px] text-red-500">{addSubjectForm.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <input 
              {...addSubjectForm.register('image')}
              placeholder="Image URL (Optional)" 
              className={cn(
                "w-full bg-white/5 border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-[#1DB954]",
                addSubjectForm.formState.errors.image ? "border-red-500" : "border-white/10"
              )} 
            />
            {addSubjectForm.formState.errors.image && <p className="text-[10px] text-red-500">{addSubjectForm.formState.errors.image.message}</p>}
          </div>
          <div className="space-y-1">
            <input 
              {...addSubjectForm.register('examDate')}
              type="date"
              className={cn(
                "w-full bg-white/5 border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-[#1DB954] text-gray-400",
                addSubjectForm.formState.errors.examDate ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <div className="space-y-1 md:col-span-4">
            <textarea 
              {...addSubjectForm.register('notes')}
              placeholder="Subject Notes (Optional)"
              className={cn(
                "w-full bg-white/5 border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-[#1DB954] resize-none h-20",
                addSubjectForm.formState.errors.notes ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <button 
            type="submit"
            className="bg-[#1DB954] text-black font-bold rounded-xl py-2 hover:scale-105 transition-transform md:col-span-4"
          >
            Add Subject
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4">
        {subjects
          .filter(s => {
            const searchLower = syllabusSearch.toLowerCase();
            return s.name.toLowerCase().includes(searchLower) || s.topics.some(t => t.title.toLowerCase().includes(searchLower));
          })
          .map(s => (
          <div key={s.id} className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden relative">
                  <img src={s.image || `https://picsum.photos/seed/${s.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                {editingSubject === s.id ? (
                  <form onSubmit={editSubjectForm.handleSubmit(onEditSubjectSubmit)} className="flex flex-col gap-2 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <input {...editSubjectForm.register('name')} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none flex-1" />
                      <input {...editSubjectForm.register('image')} placeholder="Image URL" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none flex-1" />
                      <input {...editSubjectForm.register('examDate')} type="date" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none text-gray-400" />
                      <button type="submit" className="p-1 text-[#1DB954]"><Save className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setEditingSubject(null)} className="p-1 text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                    <textarea {...editSubjectForm.register('notes')} placeholder="Subject Notes (Optional)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none w-full resize-none h-16" />
                  </form>
                ) : ( 
                  <div className="flex flex-col">
                    <span className="font-bold">{s.name}</span>
                    {s.examDate && <span className="text-[10px] text-[#1DB954] font-bold uppercase tracking-wider">Exam: {new Date(s.examDate).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingSubject(s.id)} className="p-2 text-gray-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setExpandedSubject(expandedSubject === s.id ? null : s.id)} className="p-2 text-gray-500 hover:text-white">{expandedSubject === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Subject', message: `Delete "${s.name}"?`, onConfirm: () => onDeleteSubject(s.id) })} className="p-2 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <AnimatePresence>
              {expandedSubject === s.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/5 overflow-hidden">
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      {s.topics.map(topic => (
                        <div key={topic.id} className="flex flex-col p-3 bg-white/5 rounded-xl gap-3">
                          <div className="flex items-center justify-between">
                            {editingTopic?.topicId === topic.id ? (
                              <form onSubmit={editTopicForm.handleSubmit(onEditTopicSubmit)} className="flex items-center justify-between flex-1">
                                <div className="flex flex-col gap-2 flex-1 mr-4">
                                  <input {...editTopicForm.register('title')} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none" />
                                  <input {...editTopicForm.register('image')} placeholder="Topic Image URL" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button type="submit" className="p-1 text-[#1DB954]"><Save className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => setEditingTopic(null)} className="p-1 text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  {topic.image && <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5"><img src={topic.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>}
                                  <p className="text-sm font-bold">{topic.title}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setEditingTopic({ subjectId: s.id, topicId: topic.id })} className="p-1 text-gray-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                  {!editingTopic && <button onClick={() => setResourceModal({ isOpen: true, subjectId: s.id, topicId: topic.id, topicTitle: topic.title, resources: topic.resources || [] })} className="p-1 text-gray-500 hover:text-[#1DB954]"><LinkIcon className="w-4 h-4" /></button>}
                                  <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Topic', message: `Delete "${topic.title}"?`, onConfirm: () => onDeleteTopic(s.id, topic.id) })} className="p-1 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={editingTopic?.topicId === topic.id ? editTopicForm.watch('mastery') : topic.mastery} 
                              onChange={(e) => { 
                                const val = parseInt(e.target.value); 
                                if (editingTopic?.topicId === topic.id) {
                                  editTopicForm.setValue('mastery', val);
                                } else {
                                  onEditTopic(s.id, topic.id, topic.title, val, topic.image, topic.resources); 
                                }
                              }} 
                              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#1DB954]" 
                            />
                            <span className="text-[10px] font-bold text-[#1DB954] w-8">{editingTopic?.topicId === topic.id ? editTopicForm.watch('mastery') : topic.mastery}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <AddTopicForm subjectId={s.id} onAddTopic={onAddTopic} setError={setError} />
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

const addTopicSchema = z.object({
  title: z.string().min(1, "Topic title is required"),
  image: z.string().url("Invalid image URL").or(z.literal('')),
});

type AddTopicFormData = z.infer<typeof addTopicSchema>;

interface AddTopicFormProps {
  subjectId: string;
  onAddTopic: (subjectId: string, title: string, image?: string) => void;
  setError: (val: string | null) => void;
}

function AddTopicForm({ subjectId, onAddTopic, setError }: AddTopicFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddTopicFormData>({
    resolver: zodResolver(addTopicSchema),
    defaultValues: { title: '', image: '' }
  });

  const onSubmit = (data: AddTopicFormData) => {
    onAddTopic(subjectId, data.title, data.image);
    reset();
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white/5 p-4 rounded-xl border border-dashed border-white/10">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <input 
              {...register('title')}
              placeholder="New Topic Title" 
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none",
                errors.title ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <div className="space-y-1">
            <input 
              {...register('image')}
              placeholder="Topic Image URL (Optional)" 
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none",
                errors.image ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
        </div>
        <button type="submit" className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Add Topic
        </button>
      </div>
    </form>
  );
}

