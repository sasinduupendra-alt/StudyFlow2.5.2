import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X, Link as LinkIcon, GripVertical, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subject, Resource, Topic } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '../lib/utils';
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
import { getAI } from '../services/gemini';
import { useAppStore } from '../store/useAppStore';

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
  onReorderTopics: (subjectId: string, topics: Topic[]) => void;
  setResourceModal: (val: any) => void;
  setConfirmModal: (val: any) => void;
  setError: (val: string | null) => void;
}

function SortableTopicItem({ 
  topic, 
  subjectId, 
  editingTopic, 
  setEditingTopic, 
  editTopicForm, 
  onEditTopicSubmit, 
  onEditTopic, 
  setResourceModal, 
  setConfirmModal, 
  onDeleteTopic 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex flex-col p-4 bg-white/5 border border-white/5 gap-4 rounded-[20px]", isDragging && "shadow-2xl border-white/20 scale-[1.02]")}>
      <div className={cn("flex", editingTopic?.topicId === topic.id ? "flex-col" : "items-center justify-between")}>
        {editingTopic?.topicId === topic.id ? (
          <form onSubmit={editTopicForm.handleSubmit(onEditTopicSubmit)} className="flex flex-col gap-4 flex-1 bg-black/20 p-5 border border-white/5 rounded-[16px]">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-white">Edit Topic</h4>
              <div className="flex items-center gap-2">
                <button type="submit" className="px-3 py-1.5 bg-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 rounded-full"><Save className="w-3.5 h-3.5" /> Save</button>
                <button type="button" onClick={() => setEditingTopic(null)} className="px-3 py-1.5 bg-white/5 text-white text-xs font-semibold hover:bg-white/10 transition-colors flex items-center gap-1 rounded-full"><X className="w-3.5 h-3.5" /> Cancel</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8E8E93]">Topic Title</label>
                <input {...editTopicForm.register('title')} className={cn("w-full bg-black border px-4 py-2.5 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[16px]", editTopicForm.formState.errors.title ? "border-[#FF453A]" : "border-white/10")} />
                {editTopicForm.formState.errors.title && <p className="text-xs text-[#FF453A] font-medium">{editTopicForm.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#8E8E93]">Image URL</label>
                <input {...editTopicForm.register('image')} className={cn("w-full bg-black border px-4 py-2.5 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[16px]", editTopicForm.formState.errors.image ? "border-[#FF453A]" : "border-white/10")} />
                {editTopicForm.formState.errors.image && <p className="text-xs text-[#FF453A] font-medium">{editTopicForm.formState.errors.image.message}</p>}
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/10 text-[#8E8E93] rounded-md transition-colors">
                <GripVertical className="w-4 h-4" />
              </button>
              {topic.image && <div className="w-12 h-12 border border-white/10 overflow-hidden bg-black rounded-[12px]"><img src={topic.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>}
              <p className="text-sm font-semibold text-white">{topic.title}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditingTopic({ subjectId, topicId: topic.id })} className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-colors"><Edit2 className="w-4 h-4" /></button>
              {!editingTopic && <button onClick={() => setResourceModal({ isOpen: true, subjectId, topicId: topic.id, topicTitle: topic.title, resources: topic.resources || [] })} className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-colors"><LinkIcon className="w-4 h-4" /></button>}
              <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Topic', message: `Delete "${topic.title}"?`, onConfirm: () => onDeleteTopic(subjectId, topic.id) })} className="p-2 text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 pl-10">
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
              onEditTopic(subjectId, topic.id, topic.title, val, topic.image, topic.resources); 
            }
          }} 
          className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand" 
        />
        <span className="text-xs font-semibold text-[#8E8E93] w-10 tabular-nums text-right">{editingTopic?.topicId === topic.id ? editTopicForm.watch('mastery') : topic.mastery}%</span>
      </div>
    </div>
  );
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
  onReorderTopics,
  setResourceModal,
  setConfirmModal,
  setError
}: SyllabusManagerProps) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ subjectId: string, topicId: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { addToast } = useAppStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (subjectId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;

      const oldIndex = subject.topics.findIndex(t => t.id === active.id);
      const newIndex = subject.topics.findIndex(t => t.id === over.id);

      const newTopics = arrayMove(subject.topics, oldIndex, newIndex);
      onReorderTopics(subjectId, newTopics);
    }
  };

  const generateTopics = async (subject: Subject) => {
    setIsGenerating(subject.id);
    try {
      const ai = getAI();
      
      const prompt = `Generate a list of 5-8 core topics for the subject "${subject.name}". 
      Return the response as a JSON array of strings. 
      Example: ["Topic 1", "Topic 2"]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = response.text || '';
      const topics = JSON.parse(text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));

      for (const topicTitle of topics) {
        onAddTopic(subject.id, topicTitle);
      }
      addToast(`Generated ${topics.length} topics for ${subject.name}`, "success");
    } catch (e) {
      console.error("Failed to generate topics", e);
      addToast("Failed to generate topics", "error");
    } finally {
      setIsGenerating(null);
    }
  };

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
    if (subjects.some(s => (s.name || '').toLowerCase() === (data.name || '').toLowerCase())) {
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white tracking-tight">
          <BookOpen className="w-5 h-5 text-brand" />
          Syllabus Management
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input 
              type="text"
              placeholder="Search syllabus..."
              value={syllabusSearch}
              onChange={(e) => setSyllabusSearch(e.target.value)}
              className="w-full bg-[#1C1C1E] border border-white/5 pl-11 pr-4 py-3 text-sm font-medium outline-none focus:border-brand transition-all rounded-full text-white placeholder:text-[#8E8E93] shadow-sm"
            />
          </div>
          <button 
            onClick={() => setConfirmModal({
              isOpen: true,
              title: 'Reset Syllabus',
              message: 'Are you sure you want to reset the syllabus to defaults? This will erase your current progress.',
              onConfirm: onResetSyllabus
            })} 
            className="text-sm font-semibold text-[#FF453A] hover:text-[#FF453A]/80 whitespace-nowrap transition-colors w-full md:w-auto text-center px-4 py-3 rounded-full hover:bg-[#FF453A]/10"
          >
            Reset to Default
          </button>
        </div>
      </div>
      
      <form onSubmit={addSubjectForm.handleSubmit(onAddSubjectSubmit)} className="bg-[#1C1C1E] p-8 rounded-[32px] border border-white/5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Subject Name</label>
            <input 
              {...addSubjectForm.register('name')}
              className={cn(
                "w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[20px] text-white shadow-sm",
                addSubjectForm.formState.errors.name ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
            {addSubjectForm.formState.errors.name && <p className="text-xs text-[#FF453A] font-medium">{addSubjectForm.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Image URL</label>
            <input 
              {...addSubjectForm.register('image')}
              className={cn(
                "w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[20px] text-white shadow-sm",
                addSubjectForm.formState.errors.image ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
            {addSubjectForm.formState.errors.image && <p className="text-xs text-[#FF453A] font-medium">{addSubjectForm.formState.errors.image.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Exam Date</label>
            <input 
              {...addSubjectForm.register('examDate')}
              type="date"
              className={cn(
                "w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors text-white rounded-[20px] shadow-sm",
                addSubjectForm.formState.errors.examDate ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
          </div>
          <div className="space-y-2 md:col-span-4">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Subject Notes</label>
            <textarea 
              {...addSubjectForm.register('notes')}
              className={cn(
                "w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors resize-none h-24 rounded-[20px] text-white shadow-sm",
                addSubjectForm.formState.errors.notes ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3.5 text-sm md:col-span-4 font-semibold bg-brand text-white hover:opacity-90 transition-opacity rounded-full shadow-md"
          >
            Initialize Subject
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-6">
        {subjects
          .filter(s => {
            const searchLower = (syllabusSearch || '').toLowerCase();
            return (s.name || '').toLowerCase().includes(searchLower) || (s.topics || []).some(t => (t.title || '').toLowerCase().includes(searchLower));
          })
          .map(s => (
          <div key={s.id} className="bg-[#1C1C1E] overflow-hidden rounded-[32px] border border-white/5 shadow-sm">
            <div className={cn("p-6 flex hover:bg-white/5 transition-colors gap-6", editingSubject === s.id ? "flex-col" : "items-center justify-between")}>
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 border border-white/5 bg-black overflow-hidden relative shrink-0 rounded-[20px]">
                  <img src={s.image || `https://picsum.photos/seed/${s.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                {editingSubject === s.id ? (
                  <form onSubmit={editSubjectForm.handleSubmit(onEditSubjectSubmit)} className="flex flex-col gap-6 flex-1 w-full bg-black/20 p-6 border border-white/5 rounded-[24px]">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-white">Edit Subject</h4>
                      <div className="flex items-center gap-2">
                        <button type="submit" className="px-4 py-2 bg-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 rounded-full shadow-sm"><Save className="w-3.5 h-3.5" /> Save</button>
                        <button type="button" onClick={() => setEditingSubject(null)} className="px-4 py-2 bg-white/5 text-white text-xs font-semibold hover:bg-white/10 transition-colors flex items-center gap-1 rounded-full"><X className="w-3.5 h-3.5" /> Cancel</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Subject Name</label>
                        <input {...editSubjectForm.register('name')} className={cn("w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[20px] text-white shadow-sm", editSubjectForm.formState.errors.name ? "border-[#FF453A]" : "border-white/5")} />
                        {editSubjectForm.formState.errors.name && <p className="text-xs text-[#FF453A] font-medium">{editSubjectForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Image URL</label>
                        <input {...editSubjectForm.register('image')} className={cn("w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[20px] text-white shadow-sm", editSubjectForm.formState.errors.image ? "border-[#FF453A]" : "border-white/5")} />
                        {editSubjectForm.formState.errors.image && <p className="text-xs text-[#FF453A] font-medium">{editSubjectForm.formState.errors.image.message}</p>}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Exam Date</label>
                        <input {...editSubjectForm.register('examDate')} type="date" className="w-full bg-black border border-white/5 px-4 py-3 text-sm font-medium outline-none focus:border-brand text-white transition-colors rounded-[20px] shadow-sm" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Subject Notes</label>
                        <textarea {...editSubjectForm.register('notes')} className="w-full bg-black border border-white/5 px-4 py-3 text-sm font-medium outline-none focus:border-brand resize-none h-28 transition-colors rounded-[20px] text-white shadow-sm" />
                      </div>
                    </div>
                  </form>
                ) : ( 
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-white tracking-tight">{s.name}</span>
                    {s.examDate && <span className="text-sm font-medium text-[#8E8E93] mt-1">Exam: {new Date(s.examDate).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
              {editingSubject !== s.id && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => generateTopics(s)}
                    disabled={isGenerating === s.id}
                    className="px-4 py-2.5 bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-semibold rounded-full"
                  >
                    {isGenerating === s.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-brand" />}
                    <span className="hidden sm:inline">AI Sync</span>
                  </button>
                  <button onClick={() => setEditingSubject(s.id)} className="p-2.5 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-colors"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => setExpandedSubject(expandedSubject === s.id ? null : s.id)} className="p-2.5 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-full transition-colors">{expandedSubject === s.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button>
                  <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Subject', message: `Delete "${s.name}"?`, onConfirm: () => onDeleteSubject(s.id) })} className="p-2.5 text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              )}
            </div>
            <AnimatePresence>
              {expandedSubject === s.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/5 overflow-hidden bg-black/20">
                  <div className="p-6 space-y-6">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd(s.id)}
                    >
                      <SortableContext 
                        items={s.topics.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid grid-cols-1 gap-3">
                          {s.topics.map(topic => (
                            <SortableTopicItem
                              key={topic.id}
                              topic={topic}
                              subjectId={s.id}
                              editingTopic={editingTopic}
                              setEditingTopic={setEditingTopic}
                              editTopicForm={editTopicForm}
                              onEditTopicSubmit={onEditTopicSubmit}
                              onEditTopic={onEditTopic}
                              setResourceModal={setResourceModal}
                              setConfirmModal={setConfirmModal}
                              onDeleteTopic={onDeleteTopic}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    
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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white/5 p-6 border border-dashed border-white/20 rounded-[24px]">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Topic Title</label>
            <input 
              {...register('title')}
              className={cn(
                "w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[20px] text-white shadow-sm",
                errors.title ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Image URL</label>
            <input 
              {...register('image')}
              className={cn(
                "w-full bg-black border px-4 py-3 text-sm font-medium outline-none focus:border-brand transition-colors rounded-[20px] text-white shadow-sm",
                errors.image ? "border-[#FF453A]" : "border-white/5"
              )} 
            />
          </div>
        </div>
        <button type="submit" className="w-full py-3.5 text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </button>
      </div>
    </form>
  );
}
