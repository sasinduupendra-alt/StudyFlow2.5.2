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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
          <History className="w-4 h-4 text-brand" />
          CHRONO_LOG_HISTORY_INTERFACE
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-700" />
            <input 
              type="text" 
              placeholder="SEARCH_LOGS..." 
              value={logsSearch} 
              onChange={(e) => setLogsSearch(e.target.value)} 
              className="w-full bg-black/40 border border-border-dim pl-10 pr-4 py-2 text-[10px] font-black uppercase outline-none focus:border-brand transition-colors" 
            />
          </div>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Clear All History', 
              message: 'Clear all history?', 
              onConfirm: onClearLogs 
            })} 
            className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
          >
            PURGE_ALL
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {studyLogs.filter(log => {
          const subject = subjects.find(s => s.id === log.subjectId);
          const topic = subject?.topics.find(t => t.id === log.topicId);
          const searchLower = logsSearch.toLowerCase();
          return subject?.name.toLowerCase().includes(searchLower) || topic?.title.toLowerCase().includes(searchLower) || log.notes.toLowerCase().includes(searchLower);
        }).slice().reverse().map(log => {
          const subject = subjects.find(s => s.id === log.subjectId);
          const topic = subject?.topics.find(t => t.id === log.topicId);
          return (
            <div key={log.id} className="scifi-panel p-6 flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 border border-border-dim flex items-center justify-center text-[10px] font-black text-gray-700">
                  {subject?.name[0] || '?'}
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tighter">{subject?.name} <span className="text-gray-700 mx-1">•</span> {topic?.title || 'GENERAL'}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-black text-gray-600 flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {log.duration}_MIN
                    </span>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest tabular-nums">
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
                className="p-3 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
