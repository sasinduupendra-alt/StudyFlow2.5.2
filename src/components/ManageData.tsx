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
          <h2 className="text-3xl font-mono uppercase tracking-widest mb-2 text-white">Data_Control_Center</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">SYSTEM_CONFIGURATION_INTERFACE</p>
        </div>
        
        <div className="flex p-1 bg-transparent border border-white/10 overflow-x-auto scrollbar-hide rounded-full">
          {(['syllabus', 'schedule', 'logs', 'exams', 'profile'] as ManageTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={cn(
                "px-4 md:px-6 py-2 text-[10px] font-mono transition-all uppercase tracking-widest whitespace-nowrap rounded-full",
                activeSubTab === tab ? "bg-white text-black" : "text-zinc-500 hover:text-white"
              )}
            >
              {tab === 'profile' ? 'CORE_SETTINGS' : tab === 'exams' ? 'EXAM_LOGS' : `${tab}_SYNC`}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-transparent border border-white/20 w-full max-w-md overflow-hidden rounded-none">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-transparent">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-widest text-white">Manage_Resources</h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{resourceModal.topicTitle}</p>
                </div>
                <button onClick={() => setResourceModal(null)} className="p-2 hover:text-white transition-colors rounded-none"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-3 bg-transparent p-4 border border-white/10 rounded-none">
                  <p className="text-[10px] font-mono text-white uppercase tracking-widest">ADD_NEW_RESOURCE</p>
                  <input type="text" placeholder="TITLE" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} className="w-full bg-black border border-white/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white outline-none focus:border-white transition-colors rounded-none" />
                  <div className="flex gap-2">
                    <select value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })} className="bg-black border border-white/20 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white outline-none focus:border-white transition-colors rounded-none">
                      <option value="link">LINK</option>
                      <option value="video">VIDEO</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <input type="text" placeholder="URL_ENDPOINT" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} className="flex-1 bg-black border border-white/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white outline-none focus:border-white transition-colors rounded-none" />
                  </div>
                  <button onClick={() => { if (newResource.title && newResource.url && resourceModal) { const updatedResources = [...resourceModal.resources, { ...newResource, id: Math.random().toString(36).substr(2, 9) }]; setResourceModal({ ...resourceModal, resources: updatedResources }); setNewResource({ title: '', url: '', type: 'link' }); } }} className="w-full py-2 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors rounded-none">INITIALIZE_RESOURCE</button>
                </div>
                <div className="space-y-2">
                  {resourceModal.resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-3 bg-transparent border border-white/10 group rounded-none">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn("w-8 h-8 flex items-center justify-center shrink-0 border rounded-none", res.type === 'video' ? "border-red-500/30 text-red-500 bg-transparent" : "border-white/30 text-white bg-transparent")}>
                          {res.type === 'video' ? <Video className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-white truncate">{res.title}</p>
                        </div>
                      </div>
                      <button onClick={() => { const updatedResources = resourceModal.resources.filter(r => r.id !== res.id); setResourceModal({ ...resourceModal, resources: updatedResources }); }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors rounded-none"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-transparent border-t border-white/10 flex gap-3">
                <button onClick={() => setResourceModal(null)} className="flex-1 px-4 py-3 bg-transparent border border-white/20 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-white/10 transition-colors rounded-none">CANCEL</button>
                <button onClick={() => { if (resourceModal) { onUpdateResources(resourceModal.subjectId, resourceModal.topicId, resourceModal.resources); setResourceModal(null); } }} className="flex-1 px-4 py-3 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors rounded-none">SAVE_CHANGES</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} variant={confirmModal.variant} />
    </div>
  );
}
