import React from 'react';
import { History, Search, Clock, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { StudyLog, Subject } from '../types';

interface LogHistoryProps {
  studyLogs: StudyLog[];
  subjects: Subject[];
  logsSearch: string;
  setLogsSearch: (val: string) => void;
  onDeleteLog: (id: string) => void;
  onClearLogs: () => void;
  setConfirmModal: (val: any) => void;
}

export default function LogHistory({
  studyLogs,
  subjects,
  logsSearch,
  setLogsSearch,
  onDeleteLog,
  onClearLogs,
  setConfirmModal
}: LogHistoryProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white tracking-tight">
          <History className="w-5 h-5 text-brand" />
          Log History
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={logsSearch} 
              onChange={(e) => setLogsSearch(e.target.value)} 
              className="w-full bg-[#1C1C1E] border border-white/5 pl-11 pr-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-all rounded-full placeholder:text-[#8E8E93]" 
            />
          </div>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Clear All History', 
              message: 'Clear all history?', 
              onConfirm: onClearLogs 
            })} 
            className="text-sm font-semibold text-[#FF453A] hover:text-[#FF453A]/80 transition-colors w-full md:w-auto text-center"
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {studyLogs.filter(log => {
          const subject = subjects.find(s => s.id === log.subjectId);
          const topic = subject?.topics.find(t => t.id === log.topicId);
          const searchLower = (logsSearch || '').toLowerCase();
          return (subject?.name || '').toLowerCase().includes(searchLower) || (topic?.title || '').toLowerCase().includes(searchLower) || (log.notes || '').toLowerCase().includes(searchLower);
        }).slice().reverse().map(log => {
          const subject = subjects.find(s => s.id === log.subjectId);
          const topic = subject?.topics.find(t => t.id === log.topicId);
          return (
            <div key={log.id} className="bg-[#1C1C1E] border border-white/5 p-6 flex items-center justify-between group rounded-[24px] hover:bg-white/5 transition-colors shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-black border border-white/5 flex items-center justify-center text-lg font-bold text-[#8E8E93] rounded-[16px]">
                  {subject?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">{subject?.name} <span className="text-[#8E8E93] mx-1.5">•</span> <span className="text-[#8E8E93] font-medium">{topic?.title || 'General'}</span></h4>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-sm font-medium text-[#8E8E93] flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {log.duration} min
                    </span>
                    <span className="text-sm font-medium text-[#8E8E93] tabular-nums">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setConfirmModal({ 
                  isOpen: true, 
                  title: 'Delete Log', 
                  message: 'Delete log?', 
                  onConfirm: () => onDeleteLog(log.id) 
                })} 
                className="p-3 text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 opacity-0 group-hover:opacity-100 transition-all rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
