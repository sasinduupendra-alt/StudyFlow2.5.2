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
    <div ref={setNodeRef} style={style} className={cn("flex flex-col p-3 bg-transparent border border-white/10 gap-3", isDragging && "shadow-2xl border-white/50 scale-[1.02]")}>
      <div className={cn("flex", editingTopic?.topicId === topic.id ? "flex-col" : "items-center justify-between")}>
        {editingTopic?.topicId === topic.id ? (
          <form onSubmit={editTopicForm.handleSubmit(onEditTopicSubmit)} className="flex flex-col gap-4 flex-1 bg-black/20 p-4 border border-white/10">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-mono text-white uppercase tracking-widest">Edit_Topic_Parameters</h4>
              <div className="flex items-center gap-2">
                <button type="submit" className="px-2 py-1 bg-white text-black text-[10px] font-mono uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-1 rounded-none"><Save className="w-3 h-3" /> SAVE</button>
                <button type="button" onClick={() => setEditingTopic(null)} className="px-2 py-1 bg-transparent text-white text-[10px] font-mono uppercase tracking-widest border border-white/20 hover:border-white/50 transition-colors flex items-center gap-1 rounded-none"><X className="w-3 h-3" /> CANCEL</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="hud-label !text-zinc-500">TOPIC_TITLE</label>
                <input {...editTopicForm.register('title')} className={cn("w-full bg-black/40 border px-3 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors rounded-none", editTopicForm.formState.errors.title ? "border-red-500" : "border-white/10")} />
                {editTopicForm.formState.errors.title && <p className="text-[9px] text-red-500 font-mono uppercase tracking-widest">{editTopicForm.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="hud-label !text-zinc-500">IMAGE_ENDPOINT</label>
                <input {...editTopicForm.register('image')} placeholder="URL_PATH" className={cn("w-full bg-black/40 border px-3 py-2 text-[10px] font-mono outline-none focus:border-white/50 transition-colors rounded-none", editTopicForm.formState.errors.image ? "border-red-500" : "border-white/10")} />
                {editTopicForm.formState.errors.image && <p className="text-[9px] text-red-500 font-mono uppercase tracking-widest">{editTopicForm.formState.errors.image.message}</p>}
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/5 text-zinc-500">
                <GripVertical className="w-4 h-4" />
              </button>
              {topic.image && <div className="w-10 h-10 border border-white/10 overflow-hidden bg-transparent"><img src={topic.image} alt="" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" /></div>}
              <p className="text-[11px] font-mono uppercase tracking-widest text-white">{topic.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditingTopic({ subjectId, topicId: topic.id })} className="p-1 text-zinc-500 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
              {!editingTopic && <button onClick={() => setResourceModal({ isOpen: true, subjectId, topicId: topic.id, topicTitle: topic.title, resources: topic.resources || [] })} className="p-1 text-zinc-500 hover:text-white transition-colors"><LinkIcon className="w-3.5 h-3.5" /></button>}
              <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Topic', message: `Delete "${topic.title}"?`, onConfirm: () => onDeleteTopic(subjectId, topic.id) })} className="p-1 text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
              onEditTopic(subjectId, topic.id, topic.title, val, topic.image, topic.resources); 
            }
          }} 
          className="flex-1 h-0.5 bg-white/10 rounded-none appearance-none cursor-pointer accent-white" 
        />
        <span className="text-[9px] font-mono text-zinc-400 w-8 tabular-nums">{editingTopic?.topicId === topic.id ? editTopicForm.watch('mastery') : topic.mastery}%</span>
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
        <h3 className="text-sm font-mono flex items-center gap-2 uppercase tracking-widest text-white">
          <BookOpen className="w-4 h-4 text-white" />
          SYLLABUS_MANAGEMENT_INTERFACE
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
            <input 
              type="text"
              placeholder="SEARCH_SYLLABUS..."
              value={syllabusSearch}
              onChange={(e) => setSyllabusSearch(e.target.value)}
              className="w-full bg-transparent border border-white/10 pl-10 pr-4 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-all rounded-none"
            />
          </div>
          <button 
            onClick={() => setConfirmModal({
              isOpen: true,
              title: 'Reset Syllabus',
              message: 'Are you sure you want to reset the syllabus to defaults? This will erase your current progress.',
              onConfirm: onResetSyllabus
            })} 
            className="text-[9px] font-mono text-red-500 hover:text-red-400 whitespace-nowrap uppercase tracking-widest transition-colors"
          >
            RESET_TO_DEFAULT
          </button>
        </div>
      </div>
      
      <form onSubmit={addSubjectForm.handleSubmit(onAddSubjectSubmit)} className="scifi-panel p-6 rounded-none border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="hud-label !text-zinc-500">SUBJECT_NAME</label>
            <input 
              {...addSubjectForm.register('name')}
              placeholder="NEW_SUBJECT_ID" 
              className={cn(
                "w-full bg-black/40 border px-4 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors rounded-none",
                addSubjectForm.formState.errors.name ? "border-red-500" : "border-white/10"
              )} 
            />
            {addSubjectForm.formState.errors.name && <p className="text-[9px] text-red-500 font-mono uppercase tracking-widest">{addSubjectForm.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="hud-label !text-zinc-500">IMAGE_URL</label>
            <input 
              {...addSubjectForm.register('image')}
              placeholder="URL_PATH" 
              className={cn(
                "w-full bg-black/40 border px-4 py-2 text-[10px] font-mono outline-none focus:border-white/50 transition-colors rounded-none",
                addSubjectForm.formState.errors.image ? "border-red-500" : "border-white/10"
              )} 
            />
            {addSubjectForm.formState.errors.image && <p className="text-[9px] text-red-500 font-mono uppercase tracking-widest">{addSubjectForm.formState.errors.image.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="hud-label !text-zinc-500">EXAM_DATE</label>
            <input 
              {...addSubjectForm.register('examDate')}
              type="date"
              className={cn(
                "w-full bg-black/40 border px-4 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors text-zinc-500 rounded-none",
                addSubjectForm.formState.errors.examDate ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <div className="space-y-1 md:col-span-4">
            <label className="hud-label !text-zinc-500">SUBJECT_NOTES</label>
            <textarea 
              {...addSubjectForm.register('notes')}
              placeholder="ADDITIONAL_TELEMETRY_DATA..."
              className={cn(
                "w-full bg-black/40 border px-4 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors resize-none h-20 rounded-none",
                addSubjectForm.formState.errors.notes ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <button 
            type="submit"
            className="w-full py-2 text-[10px] md:col-span-4 font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors rounded-none"
          >
            INITIALIZE_SUBJECT
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
          <div key={s.id} className="scifi-panel overflow-hidden rounded-none border border-white/10">
            <div className={cn("p-4 flex hover:bg-white/5 transition-colors gap-4", editingSubject === s.id ? "flex-col" : "items-center justify-between")}>
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 border border-white/10 bg-transparent overflow-hidden relative shrink-0">
                  <img src={s.image || `https://picsum.photos/seed/${s.id}/100/100`} alt="" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                </div>
                {editingSubject === s.id ? (
                  <form onSubmit={editSubjectForm.handleSubmit(onEditSubjectSubmit)} className="flex flex-col gap-4 flex-1 w-full bg-black/20 p-5 border border-white/10">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-mono text-white uppercase tracking-widest">Edit_Subject_Parameters</h4>
                      <div className="flex items-center gap-2">
                        <button type="submit" className="px-3 py-1.5 bg-white text-black text-[10px] font-mono uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-1 rounded-none"><Save className="w-3 h-3" /> SAVE</button>
                        <button type="button" onClick={() => setEditingSubject(null)} className="px-3 py-1.5 bg-transparent text-white text-[10px] font-mono uppercase tracking-widest border border-white/20 hover:border-white/50 transition-colors flex items-center gap-1 rounded-none"><X className="w-3 h-3" /> CANCEL</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="hud-label !text-zinc-500">SUBJECT_NAME</label>
                        <input {...editSubjectForm.register('name')} className={cn("w-full bg-black/40 border px-3 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors rounded-none", editSubjectForm.formState.errors.name ? "border-red-500" : "border-white/10")} />
                        {editSubjectForm.formState.errors.name && <p className="text-[9px] text-red-500 font-mono uppercase tracking-widest">{editSubjectForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="hud-label !text-zinc-500">IMAGE_URL</label>
                        <input {...editSubjectForm.register('image')} placeholder="URL_PATH" className={cn("w-full bg-black/40 border px-3 py-2 text-[10px] font-mono outline-none focus:border-white/50 transition-colors rounded-none", editSubjectForm.formState.errors.image ? "border-red-500" : "border-white/10")} />
                        {editSubjectForm.formState.errors.image && <p className="text-[9px] text-red-500 font-mono uppercase tracking-widest">{editSubjectForm.formState.errors.image.message}</p>}
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="hud-label !text-zinc-500">EXAM_DATE</label>
                        <input {...editSubjectForm.register('examDate')} type="date" className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 text-zinc-500 transition-colors rounded-none" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="hud-label !text-zinc-500">SUBJECT_NOTES</label>
                        <textarea {...editSubjectForm.register('notes')} placeholder="ADDITIONAL_TELEMETRY..." className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 resize-none h-24 transition-colors rounded-none" />
                      </div>
                    </div>
                  </form>
                ) : ( 
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-white">{s.name}</span>
                    {s.examDate && <span className="hud-label !text-zinc-500 mt-0.5">EXAM_SYNC: {new Date(s.examDate).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
              {editingSubject !== s.id && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => generateTopics(s)}
                    disabled={isGenerating === s.id}
                    className="p-2 text-white hover:bg-white/10 border border-white/20 transition-colors flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest rounded-none"
                  >
                    {isGenerating === s.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span className="hidden sm:inline">AI_SYNC</span>
                  </button>
                  <button onClick={() => setEditingSubject(s.id)} className="p-2 text-zinc-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setExpandedSubject(expandedSubject === s.id ? null : s.id)} className="p-2 text-zinc-500 hover:text-white transition-colors">{expandedSubject === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                  <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Subject', message: `Delete "${s.name}"?`, onConfirm: () => onDeleteSubject(s.id) })} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <AnimatePresence>
              {expandedSubject === s.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-white/10 overflow-hidden">
                  <div className="p-4 space-y-4">
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd(s.id)}
                    >
                      <SortableContext 
                        items={s.topics.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid grid-cols-1 gap-2">
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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-transparent p-4 border border-dashed border-white/20">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="hud-label !text-zinc-500">TOPIC_TITLE</label>
            <input 
              {...register('title')}
              placeholder="NEW_TOPIC_ID" 
              className={cn(
                "w-full bg-black/40 border px-3 py-2 text-[10px] font-mono uppercase outline-none focus:border-white/50 transition-colors rounded-none",
                errors.title ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
          <div className="space-y-1">
            <label className="hud-label !text-zinc-500">IMAGE_ENDPOINT</label>
            <input 
              {...register('image')}
              placeholder="URL_PATH" 
              className={cn(
                "w-full bg-black/40 border px-3 py-2 text-[10px] font-mono outline-none focus:border-white/50 transition-colors rounded-none",
                errors.image ? "border-red-500" : "border-white/10"
              )} 
            />
          </div>
        </div>
        <button type="submit" className="w-full py-2 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center rounded-none">
          <Plus className="w-3 h-3 mr-2" />
          INITIALIZE_TOPIC
        </button>
      </div>
    </form>
  );
}
