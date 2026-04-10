import React, { useState } from 'react';
import { Trophy, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExamRecord, Subject } from '../types';

interface ExamTrackerProps {
  exams: ExamRecord[];
  subjects: Subject[];
  onAddExam: (exam: Omit<ExamRecord, 'id'>) => void;
  onEditExam: (id: string, updatedExam: Partial<ExamRecord>) => void;
  onDeleteExam: (id: string) => void;
  setConfirmModal: (val: any) => void;
  setError: (val: string | null) => void;
}

export default function ExamTracker({
  exams,
  subjects,
  onAddExam,
  onEditExam,
  onDeleteExam,
  setConfirmModal,
  setError
}: ExamTrackerProps) {
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examMarks, setExamMarks] = useState<{ subjectId: string, score: number }[]>([]);
  const [examRank, setExamRank] = useState<string>('');
  const [examNotes, setExamNotes] = useState('');

  const resetExamForm = () => {
    setIsAddingExam(false);
    setEditingExamId(null);
    setExamTitle('');
    setExamDate(new Date().toISOString().split('T')[0]);
    setExamMarks(subjects.map(s => ({ subjectId: s.id, score: 0 })));
    setExamRank('');
    setExamNotes('');
    setError(null);
  };

  const handleSaveExam = () => {
    setError(null);
    if (!examTitle.trim()) { setError("Exam title is required."); return; }
    if (!examDate) { setError("Exam date is required."); return; }
    const invalidMark = examMarks.find(m => m.score < 0 || m.score > 100);
    if (invalidMark) {
      const subject = subjects.find(s => s.id === invalidMark.subjectId);
      setError(`Invalid score for ${subject?.name}. Must be between 0 and 100.`);
      return;
    }
    if (examRank && (isNaN(parseInt(examRank)) || parseInt(examRank) <= 0)) {
      setError("Rank must be a positive number.");
      return;
    }
    const totalScore = examMarks.reduce((acc, m) => acc + m.score, 0);
    const averageScore = examMarks.length > 0 ? totalScore / examMarks.length : 0;
    const examData = {
      title: examTitle,
      date: examDate,
      marks: examMarks,
      totalScore,
      averageScore,
      rank: examRank ? parseInt(examRank) : undefined,
      notes: examNotes
    };
    if (editingExamId) onEditExam(editingExamId, examData);
    else onAddExam(examData);
    resetExamForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
          <Trophy className="w-4 h-4 text-brand" />
          PERFORMANCE_METRICS_INTERFACE
        </h3>
        <button 
          onClick={() => { resetExamForm(); setIsAddingExam(true); }} 
          className="scifi-button px-4 py-2 text-[10px]"
        >
          <Plus className="w-3 h-3" />
          ADD_RESULT_LOG
        </button>
      </div>
      <AnimatePresence>
        {(isAddingExam || editingExamId) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="scifi-panel p-6 border-brand/30 space-y-6 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-tighter">{editingExamId ? 'EDIT_EXAM_RESULT' : 'NEW_EXAM_RESULT'}</h4>
                <button onClick={resetExamForm} className="p-2 text-gray-700 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="hud-label !text-gray-600">EXAM_IDENTIFIER</label>
                    <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="EXAM TITLE" className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="hud-label !text-gray-600">CHRONO_STAMP</label>
                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="hud-label !text-gray-600">SYSTEM_NOTES</label>
                    <textarea value={examNotes} onChange={(e) => setExamNotes(e.target.value)} placeholder="NOTES" className="w-full bg-black/40 border border-border-dim px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors h-24 resize-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="hud-label !text-gray-600">SUBJECT_SCORES</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {subjects.map(subject => {
                      const mark = examMarks.find(m => m.subjectId === subject.id);
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-3 bg-white/5 border border-border-dim">
                          <span className="text-[10px] font-black uppercase tracking-tight">{subject.name}</span>
                          <input type="number" min="0" max="100" value={mark?.score || 0} onChange={(e) => { const score = parseInt(e.target.value) || 0; setExamMarks(examMarks.map(m => m.subjectId === subject.id ? { ...m, score } : m)); }} className="w-20 bg-black/40 border border-border-dim px-3 py-1 text-right text-[10px] font-black outline-none focus:border-brand transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveExam} className="scifi-button px-8 py-3 text-[10px]">
                  {editingExamId ? 'UPDATE_ENTRY' : 'SAVE_ENTRY'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-4">
        {exams.slice().reverse().map(exam => (
          <div key={exam.id} className="scifi-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-border-dim flex items-center justify-center text-gray-700">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tighter">{exam.title}</h4>
                <p className="text-[10px] font-black text-gray-600 tabular-nums uppercase tracking-widest">{new Date(exam.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="hud-label !text-gray-600">AVERAGE_SCORE</p>
                <p className="text-2xl font-black text-brand tabular-nums tracking-tighter">{exam.averageScore.toFixed(1)}%</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { 
                    setEditingExamId(exam.id); 
                    setExamTitle(exam.title); 
                    setExamDate(exam.date); 
                    setExamMarks(exam.marks); 
                    setExamNotes(exam.notes || ''); 
                    setIsAddingExam(false); 
                  }} 
                  className="p-2 text-gray-700 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setConfirmModal({ 
                    isOpen: true, 
                    title: 'Delete Exam', 
                    message: `Delete "${exam.title}"?`, 
                    onConfirm: () => onDeleteExam(exam.id) 
                  })} 
                  className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
