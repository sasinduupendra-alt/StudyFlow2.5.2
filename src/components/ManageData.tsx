import React, { useState } from 'react';
import { 
  X, Video, Link as LinkIcon, AlertCircle, Trash2
} from 'lucide-react';
import { Subject, WeeklySchedule, Activity, StudyLog, ExamRecord, Resource } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from './ConfirmationModal';
import SyllabusManager from './SyllabusManager';
import ScheduleManager from './ScheduleManager';
import LogHistory from './LogHistory';
import ExamTracker from './ExamTracker';
import ProfileSettings from './ProfileSettings';

interface ManageDataProps {
  subjects: Subject[];
  schedule: WeeklySchedule;
  studyLogs: StudyLog[];
  onUpdateSchedule: (day: keyof WeeklySchedule, activities: Activity[]) => void;
  onDeleteLog: (id: string) => void;
  onClearLogs: () => void;
  onAddLog: (log: { subjectId: string, topicId: string, duration: number, focusLevel: number, notes: string }) => void;
  onAddSubject: (name: string, image?: string, examDate?: string, notes?: string) => void;
  onEditSubject: (id: string, name: string, image?: string, examDate?: string, notes?: string) => void;
  onDeleteSubject: (id: string) => void;
  onAddTopic: (subjectId: string, title: string, image?: string) => void;
  onEditTopic: (subjectId: string, topicId: string, title: string, mastery: number, image?: string, resources?: Resource[]) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
  onUpdateResources: (subjectId: string, topicId: string, resources: Resource[]) => void;
  onResetSyllabus: () => void;
  onResetProfile: () => void;
  exams: ExamRecord[];
  onAddExam: (exam: Omit<ExamRecord, 'id'>) => void;
  onEditExam: (id: string, updatedExam: Partial<ExamRecord>) => void;
  onDeleteExam: (id: string) => void;
}

type ManageTab = 'syllabus' | 'schedule' | 'logs' | 'exams' | 'profile';

export default function ManageData({
  subjects,
  schedule,
  studyLogs,
  onUpdateSchedule,
  onDeleteLog,
  onClearLogs,
  onAddLog,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onUpdateResources,
  onResetSyllabus,
  onResetProfile,
  exams,
  onAddExam,
  onEditExam,
  onDeleteExam
}: ManageDataProps) {
  const [activeSubTab, setActiveSubTab] = useState<ManageTab>('syllabus');
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [logsSearch, setLogsSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [resourceModal, setResourceModal] = useState<{
    isOpen: boolean;
    subjectId: string;
    topicId: string;
    topicTitle: string;
    resources: Resource[];
  } | null>(null);

  const [newResource, setNewResource] = useState<{ title: string, url: string, type: Resource['type'] }>({ title: '', url: '', type: 'link' });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black mb-2 tracking-tight">Data Control Center</h2>
          <p className="text-gray-400">Fine-tune your syllabus, weekly schedule, and study history.</p>
        </div>
        
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto scrollbar-hide">
          {(['syllabus', 'schedule', 'logs', 'exams', 'profile'] as ManageTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={cn(
                "px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap",
                activeSubTab === tab ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              {tab === 'profile' ? 'Profile' : tab === 'exams' ? 'Exams' : tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'syllabus' && (
          <motion.div key="syllabus" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <SyllabusManager 
              subjects={subjects}
              syllabusSearch={syllabusSearch}
              setSyllabusSearch={setSyllabusSearch}
              onResetSyllabus={onResetSyllabus}
              onAddSubject={onAddSubject}
              onEditSubject={onEditSubject}
              onDeleteSubject={onDeleteSubject}
              onAddTopic={onAddTopic}
              onEditTopic={onEditTopic}
              onDeleteTopic={onDeleteTopic}
              setResourceModal={setResourceModal}
              setConfirmModal={setConfirmModal}
              setError={setError}
            />
          </motion.div>
        )}

        {activeSubTab === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ScheduleManager 
              schedule={schedule}
              onUpdateSchedule={onUpdateSchedule}
              setConfirmModal={setConfirmModal}
              setError={setError}
            />
          </motion.div>
        )}

        {activeSubTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <LogHistory 
              studyLogs={studyLogs}
              subjects={subjects}
              logsSearch={logsSearch}
              setLogsSearch={setLogsSearch}
              onDeleteLog={onDeleteLog}
              onClearLogs={onClearLogs}
              setConfirmModal={setConfirmModal}
            />
          </motion.div>
        )}

        {activeSubTab === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ExamTracker 
              exams={exams}
              subjects={subjects}
              onAddExam={onAddExam}
              onEditExam={onEditExam}
              onDeleteExam={onDeleteExam}
              setConfirmModal={setConfirmModal}
              setError={setError}
            />
          </motion.div>
        )}

        {activeSubTab === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <ProfileSettings 
              onResetProfile={onResetProfile}
              onResetSyllabus={onResetSyllabus}
              setConfirmModal={setConfirmModal}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resourceModal?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5"><div><h3 className="text-xl font-bold">Manage Resources</h3><p className="text-xs text-gray-400 mt-1">{resourceModal.topicTitle}</p></div><button onClick={() => setResourceModal(null)} className="p-2"><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-[#1DB954] uppercase tracking-widest">Add New Resource</p>
                  <input type="text" placeholder="Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" />
                  <div className="flex gap-2"><select value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"><option value="link">Link</option><option value="video">Video</option><option value="pdf">PDF</option></select><input type="text" placeholder="URL" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none" /></div>
                  <button onClick={() => { if (newResource.title && newResource.url && resourceModal) { const updatedResources = [...resourceModal.resources, { ...newResource, id: Math.random().toString(36).substr(2, 9) }]; setResourceModal({ ...resourceModal, resources: updatedResources }); setNewResource({ title: '', url: '', type: 'link' }); } }} className="w-full bg-[#1DB954] text-black font-bold py-2 rounded-xl text-sm">Add Resource</button>
                </div>
                <div className="space-y-2">
                  {resourceModal.resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                      <div className="flex items-center gap-3 overflow-hidden"><div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", res.type === 'video' ? "bg-red-500/10 text-red-500" : "bg-[#1DB954]/10 text-[#1DB954]")}>{res.type === 'video' ? <Video className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}</div><div className="overflow-hidden"><p className="text-sm font-medium truncate">{res.title}</p></div></div>
                      <button onClick={() => { const updatedResources = resourceModal.resources.filter(r => r.id !== res.id); setResourceModal({ ...resourceModal, resources: updatedResources }); }} className="p-2 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-white/5 border-t border-white/10 flex gap-3"><button onClick={() => setResourceModal(null)} className="flex-1 px-4 py-3 bg-white/5 rounded-xl text-sm font-bold">Cancel</button><button onClick={() => { if (resourceModal) { onUpdateResources(resourceModal.subjectId, resourceModal.topicId, resourceModal.resources); setResourceModal(null); } }} className="flex-1 px-4 py-3 bg-[#1DB954] text-black rounded-xl text-sm font-bold">Save Changes</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} variant={confirmModal.variant} />
    </div>
  );
}
