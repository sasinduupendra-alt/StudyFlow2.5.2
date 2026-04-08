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
        <h3 className="text-xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-[#1DB954]" />
          Study History Logs
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={logsSearch} 
              onChange={(e) => setLogsSearch(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none" 
            />
          </div>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, 
              title: 'Clear All History', 
              message: 'Clear all history?', 
              onConfirm: onClearLogs 
            })} 
            className="text-xs font-bold text-red-500 hover:underline"
          >
            Clear All
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
            <div key={log.id} className="bg-[#181818] p-6 rounded-2xl border border-white/5 flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold">
                  {subject?.name[0] || '?'}
                </div>
                <div>
                  <h4 className="font-bold">{subject?.name} • {topic?.title || 'General'}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {log.duration} min
                    </span>
                    <span className="text-xs text-gray-500">
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
                className="p-3 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
