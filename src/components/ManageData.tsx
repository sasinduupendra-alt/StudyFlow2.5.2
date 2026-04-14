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
  onReorderTopics: (subjectId: string, topics: any[]) => void;
  onUpdateResources: (subjectId: string, topicId: string, resources: Resource[]) => void;
  onResetSyllabus: () => void;
  onResetProfile: () => void;
  onResetSchedule: () => void;
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
  onReorderTopics,
  onUpdateResources,
  onResetSyllabus,
  onResetProfile,
  onResetSchedule,
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
          className="bg-red-500/5 border border-red-500/20 p-4 rounded-none flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest"
        >
          <AlertCircle className="w-4 h-4" />
          ERROR_DETECTED: {error}
          <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X className="w-3 h-3" /></button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-white tracking-tight">Data Control Center</h2>
          <p className="text-sm font-medium text-[#8E8E93]">System Configuration Interface</p>
        </div>
        
        <div className="flex p-1.5 bg-[#1C1C1E] border border-white/5 overflow-x-auto scrollbar-hide rounded-full">
          {(['syllabus', 'schedule', 'logs', 'exams', 'profile'] as ManageTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={cn(
                "px-6 py-2.5 text-sm font-semibold transition-all whitespace-nowrap rounded-full capitalize",
                activeSubTab === tab ? "bg-white text-black" : "text-[#8E8E93] hover:text-white hover:bg-white/5"
              )}
            >
              {tab === 'profile' ? 'Settings' : tab === 'exams' ? 'Exam Logs' : `${tab} Sync`}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'syllabus' && (
          <motion.div key="syllabus" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
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
              onReorderTopics={onReorderTopics}
              setResourceModal={setResourceModal}
              setConfirmModal={setConfirmModal}
              setError={setError}
            />
          </motion.div>
        )}

        {activeSubTab === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <ScheduleManager 
              schedule={schedule}
              onUpdateSchedule={onUpdateSchedule}
              setConfirmModal={setConfirmModal}
              setError={setError}
            />
          </motion.div>
        )}

        {activeSubTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
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
          <motion.div key="exams" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
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
          <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <ProfileSettings 
              onResetProfile={onResetProfile}
              onResetSyllabus={onResetSyllabus}
              onResetSchedule={onResetSchedule}
              setConfirmModal={setConfirmModal}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resourceModal?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#1C1C1E] border border-white/10 w-full max-w-md overflow-hidden rounded-[32px] shadow-2xl">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Manage Resources</h3>
                  <p className="text-sm font-medium text-[#8E8E93] mt-1">{resourceModal.topicTitle}</p>
                </div>
                <button onClick={() => setResourceModal(null)} className="p-2 hover:bg-white/10 transition-colors rounded-full bg-white/5"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-4 bg-white/5 p-6 border border-white/5 rounded-[24px]">
                  <p className="text-sm font-semibold text-white">Add New Resource</p>
                  <input type="text" placeholder="Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} className="w-full bg-black border border-white/10 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[20px]" />
                  <div className="flex gap-3">
                    <select value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })} className="bg-black border border-white/10 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[20px] appearance-none">
                      <option value="link">Link</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <input type="text" placeholder="URL Endpoint" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} className="flex-1 bg-black border border-white/10 px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors rounded-[20px]" />
                  </div>
                  <button onClick={() => { if (newResource.title && newResource.url && resourceModal) { const updatedResources = [...resourceModal.resources, { ...newResource, id: Math.random().toString(36).substr(2, 9) }]; setResourceModal({ ...resourceModal, resources: updatedResources }); setNewResource({ title: '', url: '', type: 'link' }); } }} className="w-full py-3 text-sm font-semibold bg-brand text-white hover:opacity-90 transition-opacity rounded-full">Initialize Resource</button>
                </div>
                <div className="space-y-3">
                  {resourceModal.resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 group rounded-[20px] hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={cn("w-10 h-10 flex items-center justify-center shrink-0 rounded-full", res.type === 'video' ? "bg-brand/20 text-brand" : "bg-white/10 text-white")}>
                          {res.type === 'video' ? <Video className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-white truncate">{res.title}</p>
                        </div>
                      </div>
                      <button onClick={() => { const updatedResources = resourceModal.resources.filter(r => r.id !== res.id); setResourceModal({ ...resourceModal, resources: updatedResources }); }} className="p-2 text-[#8E8E93] hover:text-[#FF453A] transition-colors rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 bg-white/5 border-t border-white/5 flex gap-4">
                <button onClick={() => setResourceModal(null)} className="flex-1 px-4 py-4 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors rounded-full">Cancel</button>
                <button onClick={() => { if (resourceModal) { onUpdateResources(resourceModal.subjectId, resourceModal.topicId, resourceModal.resources); setResourceModal(null); } }} className="flex-1 px-4 py-4 text-sm font-semibold bg-brand text-white hover:opacity-90 transition-opacity rounded-full">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} variant={confirmModal.variant} />
    </div>
  );
}
