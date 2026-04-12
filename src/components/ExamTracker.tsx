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
        <h3 className="text-sm font-mono uppercase tracking-widest flex items-center gap-2 text-white">
          <Trophy className="w-4 h-4 text-white" />
          Performance Metrics
        </h3>
        <button 
          onClick={() => { resetExamForm(); setIsAddingExam(true); }} 
          className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest bg-transparent border border-white/20 text-white hover:bg-white/10 transition-colors rounded-none flex items-center gap-2"
        >
          <Plus className="w-3 h-3" />
          Add Result
        </button>
      </div>
      <AnimatePresence>
        {(isAddingExam || editingExamId) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-transparent border border-white/20 p-6 space-y-6 mb-6 rounded-none">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-mono uppercase tracking-widest text-white">{editingExamId ? 'Edit Exam Result' : 'New Exam Result'}</h4>
                <button onClick={resetExamForm} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-none"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Exam Title</label>
                    <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="E.G. TERM TEST 1" className="w-full bg-black border border-white/20 rounded-none px-4 py-3 text-xs font-mono uppercase tracking-widest text-white outline-none focus:border-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Date</label>
                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-black border border-white/20 rounded-none px-4 py-3 text-xs font-mono uppercase tracking-widest text-white outline-none focus:border-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Notes</label>
                    <textarea value={examNotes} onChange={(e) => setExamNotes(e.target.value)} placeholder="OPTIONAL NOTES..." className="w-full bg-black border border-white/20 rounded-none px-4 py-3 text-xs font-mono uppercase tracking-widest text-white outline-none focus:border-white transition-colors h-24 resize-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Subject Scores</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {subjects.map(subject => {
                      const mark = examMarks.find(m => m.subjectId === subject.id);
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-3 bg-transparent rounded-none border border-white/10">
                          <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">{subject.name}</span>
                          <input type="number" min="0" max="100" value={mark?.score || 0} onChange={(e) => { const score = parseInt(e.target.value) || 0; setExamMarks(examMarks.map(m => m.subjectId === subject.id ? { ...m, score } : m)); }} className="w-20 bg-black border border-white/20 rounded-none px-3 py-1 text-right text-xs font-mono text-white outline-none focus:border-white transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveExam} className="px-8 py-3 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-colors rounded-none">
                  {editingExamId ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-4">
        {exams.slice().reverse().map(exam => (
          <div key={exam.id} className="bg-transparent border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group rounded-none">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-transparent border border-white/20 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-mono uppercase tracking-widest text-white">{exam.title}</h4>
                <p className="text-[10px] font-mono text-zinc-500 tabular-nums uppercase tracking-widest">{new Date(exam.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Average Score</p>
                <p className="text-2xl font-mono text-white tabular-nums tracking-tight">{exam.averageScore.toFixed(1)}%</p>
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
                  className="p-2 text-zinc-500 hover:text-white transition-colors rounded-none"
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
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors rounded-none"
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
