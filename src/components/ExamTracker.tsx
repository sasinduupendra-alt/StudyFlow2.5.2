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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white tracking-tight">
          <Trophy className="w-5 h-5 text-brand" />
          Performance Metrics
        </h3>
        <button 
          onClick={() => { resetExamForm(); setIsAddingExam(true); }} 
          className="px-5 py-2.5 text-sm font-semibold bg-white/5 text-white hover:bg-white/10 transition-colors rounded-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Result
        </button>
      </div>
      <AnimatePresence>
        {(isAddingExam || editingExamId) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-[#1C1C1E] border border-white/5 p-8 space-y-8 mb-8 rounded-[32px] shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-white tracking-tight">{editingExamId ? 'Edit Exam Result' : 'New Exam Result'}</h4>
                <button onClick={resetExamForm} className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Exam Title</label>
                    <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="e.g., Term Test 1" className="w-full bg-black border border-white/5 rounded-[20px] px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Date</label>
                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-black border border-white/5 rounded-[20px] px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Notes</label>
                    <textarea value={examNotes} onChange={(e) => setExamNotes(e.target.value)} placeholder="Optional notes..." className="w-full bg-black border border-white/5 rounded-[20px] px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors h-28 resize-none" />
                  </div>
                </div>
                <div className="space-y-5">
                  <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Subject Scores</label>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 scrollbar-hide">
                    {subjects.map(subject => {
                      const mark = examMarks.find(m => m.subjectId === subject.id);
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-4 bg-white/5 rounded-[20px] border border-white/5 hover:bg-white/10 transition-colors">
                          <span className="text-sm font-semibold text-white">{subject.name}</span>
                          <input type="number" min="0" max="100" value={mark?.score || 0} onChange={(e) => { const score = parseInt(e.target.value) || 0; setExamMarks(examMarks.map(m => m.subjectId === subject.id ? { ...m, score } : m)); }} className="w-24 bg-black border border-white/5 rounded-[12px] px-3 py-2 text-right text-sm font-medium text-white outline-none focus:border-brand transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveExam} className="px-8 py-3.5 text-sm font-semibold bg-brand text-white hover:opacity-90 transition-opacity rounded-full shadow-md">
                  {editingExamId ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-4">
        {exams.slice().reverse().map(exam => (
          <div key={exam.id} className="bg-[#1C1C1E] border border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group rounded-[24px] hover:bg-white/5 transition-colors shadow-sm">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[16px] bg-black border border-white/5 flex items-center justify-center text-[#8E8E93] group-hover:text-brand transition-colors">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">{exam.title}</h4>
                <p className="text-sm font-medium text-[#8E8E93] tabular-nums mt-0.5">{new Date(exam.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">Average Score</p>
                <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{exam.averageScore.toFixed(1)}%</p>
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
                  className="p-2.5 text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors rounded-full"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setConfirmModal({ 
                    isOpen: true, 
                    title: 'Delete Exam', 
                    message: `Delete "${exam.title}"?`, 
                    onConfirm: () => onDeleteExam(exam.id) 
                  })} 
                  className="p-2.5 text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors rounded-full"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
