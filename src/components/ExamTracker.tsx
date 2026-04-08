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
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Exam Performance Tracker
        </h3>
        <button 
          onClick={() => { resetExamForm(); setIsAddingExam(true); }} 
          className="px-4 py-2 bg-[#1DB954] text-black rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Result
        </button>
      </div>
      <AnimatePresence>
        {(isAddingExam || editingExamId) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-[#181818] p-6 rounded-2xl border border-[#1DB954]/30 space-y-6 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg">{editingExamId ? 'Edit Exam Result' : 'New Exam Result'}</h4>
                <button onClick={resetExamForm} className="p-2"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Exam Title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                  <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                  <textarea value={examNotes} onChange={(e) => setExamNotes(e.target.value)} placeholder="Notes" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none h-24" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {subjects.map(subject => {
                      const mark = examMarks.find(m => m.subjectId === subject.id);
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                          <span className="text-sm font-medium">{subject.name}</span>
                          <input type="number" min="0" max="100" value={mark?.score || 0} onChange={(e) => { const score = parseInt(e.target.value) || 0; setExamMarks(examMarks.map(m => m.subjectId === subject.id ? { ...m, score } : m)); }} className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-right outline-none" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveExam} className="px-8 py-3 bg-[#1DB954] text-black font-bold rounded-xl">
                  {editingExamId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-4">
        {exams.slice().reverse().map(exam => (
          <div key={exam.id} className="bg-[#181818] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{exam.title}</h4>
                <p className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase">Average</p>
                <p className="text-2xl font-black text-[#1DB954]">{exam.averageScore.toFixed(1)}%</p>
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
                  className="p-2 text-gray-500 hover:text-white"
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
                  className="p-2 text-gray-500 hover:text-red-500"
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
