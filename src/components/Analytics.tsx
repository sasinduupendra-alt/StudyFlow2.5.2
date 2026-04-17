import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Subject, StudyLog, ExamRecord, Task } from '../types';
import { TrendingUp, Clock, Star, Target, Zap, CheckCircle2, AlertTriangle, Trophy, BarChart2, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateUserSNR, cn } from '../lib/utils';
import SNRVisualizer from './SNRVisualizer';

interface AnalyticsProps {
  subjects: Subject[];
  studyLogs: StudyLog[];
  exams: ExamRecord[];
  tasks: Task[];
}

export default function Analytics({ subjects, studyLogs, exams, tasks }: AnalyticsProps) {
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  const totalStudyTime = studyLogs.reduce((acc, log) => acc + log.duration, 0);
  const avgFocus = studyLogs.length > 0 
    ? (studyLogs.reduce((acc, log) => acc + log.focusLevel, 0) / studyLogs.length).toFixed(1)
    : 0;

  const snrData = calculateUserSNR(tasks);
  const userSNR = snrData.snr;

  const snrChartData = [
    { name: 'Signal (Impact)', value: Math.round(snrData.signal), color: '#0A84FF' },
    { name: 'Noise (Effort)', value: Math.round(snrData.noise), color: '#8E8E93' },
  ];

  const radarData = subjects.map(s => ({
    subject: s.name,
    Score: s.score,
    Focus: s.focus * 20,
    Readiness: s.readiness,
    Mastery: s.topics.length > 0 ? s.topics.reduce((acc, t) => acc + t.mastery, 0) / s.topics.length : 0
  }));

  const pieData = [
    { name: 'Mastered', value: subjects.reduce((acc, s) => acc + s.topics.filter(t => t.mastery >= 80).length, 0), color: '#1DB954' },
    { name: 'Proficient', value: subjects.reduce((acc, s) => acc + s.topics.filter(t => t.mastery >= 50 && t.mastery < 80).length, 0), color: '#fbbf24' },
    { name: 'Learning', value: subjects.reduce((acc, s) => acc + s.topics.filter(t => t.mastery < 50).length, 0), color: '#ef4444' },
  ];

  const focusTrendData = studyLogs.slice(-14).map((log, i) => ({
    name: `S${i + 1}`,
    focus: log.focusLevel,
    duration: log.duration
  }));

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const snrWaveformData = React.useMemo(() => {
    return last14Days.map((date) => {
      const tasksUpToDate = tasks.filter(t => t.createdAt.split('T')[0] <= date);
      const snrMetrics = calculateUserSNR(tasksUpToDate);
      return {
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        snr: snrMetrics.snr,
        rawDate: date
      };
    });
  }, [tasks, last14Days]);

  const masteryTrendData = last14Days.map(date => {
    const data: any = { 
      name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      rawDate: date
    };
    
    subjects.forEach(subject => {
      const subjectLogs = studyLogs.filter(log => 
        log.subjectId === subject.id && 
        log.timestamp.split('T')[0] <= date
      );
      
      const totalWeightedTime = subjectLogs.reduce((acc, log) => acc + (log.duration * (log.focusLevel / 5)), 0);
      data[subject.name] = Math.min(100, Math.round((subject.score * 0.7) + (totalWeightedTime / 10)));
    });
    
    return data;
  });

  const SUBJECT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const focusRatioData = React.useMemo(() => {
    const signalMinutes = studyLogs.filter(l => l.sessionType === 'self-study').reduce((acc, l) => acc + l.duration, 0);
    const noiseMinutes = studyLogs.filter(l => l.sessionType === 'tuition').reduce((acc, l) => acc + l.duration, 0);
    const total = signalMinutes + noiseMinutes;
    if (total === 0) return [
      { name: 'Signal Hours', value: 1, color: '#0A84FF' },
      { name: 'Noise Hours', value: 0, color: '#8E8E93' }
    ];
    return [
      { name: 'Signal Hours', value: signalMinutes / 60, color: '#0A84FF' },
      { name: 'Noise Hours', value: noiseMinutes / 60, color: '#ef4444' }
    ];
  }, [studyLogs]);

  const signalRatio = React.useMemo(() => {
    const total = focusRatioData[0].value + focusRatioData[1].value;
    return total > 0 ? (focusRatioData[0].value / total) * 100 : 100;
  }, [focusRatioData]);

  // Heatmap Data Preparation
  const heatmapData = subjects.map((subject, index) => {
    return {
      id: subject.id,
      name: subject.name,
      color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
      days: last14Days.map(date => {
        const logs = studyLogs.filter(log => log.subjectId === subject.id && log.timestamp.split('T')[0] === date);
        const totalTime = logs.reduce((acc, log) => acc + log.duration, 0);
        return { date, totalTime };
      })
    };
  });

  const getHeatmapOpacity = (time: number) => {
    if (time === 0) return 0.05;
    if (time < 30) return 0.3;
    if (time < 60) return 0.6;
    if (time < 120) return 0.8;
    return 1;
  };

  const examTrendData = exams.map(exam => ({
    name: exam.title,
    average: exam.averageScore,
    total: exam.totalScore,
    date: new Date(exam.date).toLocaleDateString()
  }));

  const subjectExamPerformanceData = exams.map(exam => {
    const data: any = {
      name: exam.title,
      date: new Date(exam.date).toLocaleDateString()
    };
    exam.marks.forEach(mark => {
      const subject = subjects.find(s => s.id === mark.subjectId);
      if (subject) {
        data[subject.name] = mark.score;
      }
    });
    return data;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1C1E]/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[#8E8E93] text-sm">{entry.name}:</span>
              <span className="text-white font-mono font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10 p-6 md:p-10 max-w-7xl mx-auto relative"
    >
      <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.03]" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-8 group transition-all hover:border-brand/30 relative overflow-hidden">
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#8E8E93] group-hover:text-brand transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Total Study Time</span>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight relative z-10">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</p>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-8 group transition-all hover:border-brand/30 relative overflow-hidden">
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#8E8E93] group-hover:text-brand transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Focus Ratio</span>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <p className="text-4xl font-bold text-white tracking-tight">{Math.round(signalRatio)}%</p>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter mb-1",
              signalRatio >= 80 ? "bg-brand/20 text-brand" : "bg-red-500/20 text-red-500"
            )}>
              {signalRatio >= 80 ? "Efficient" : "Noise Heavy"}
            </span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-8 group transition-all hover:border-brand/30 relative overflow-hidden">
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#8E8E93] group-hover:text-brand transition-colors">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Avg Focus Level</span>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight relative z-10">{avgFocus}/5.0</p>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-8 group transition-all hover:border-brand/30 relative overflow-hidden">
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#8E8E93] group-hover:text-brand transition-colors">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">User SNR Index</span>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight relative z-10">{userSNR.toFixed(2)}</p>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2 relative z-10">Signal Efficiency</p>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-8 group transition-all hover:border-brand/30 relative overflow-hidden">
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#8E8E93] group-hover:text-brand transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">Sessions Logged</span>
          </div>
          <p className="text-4xl font-bold text-white tracking-tight relative z-10">{studyLogs.length}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <motion.div variants={itemVariants} className="lg:col-span-8 bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group">
          <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex flex-col lg:flex-row gap-12 relative z-10">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white tracking-tight mb-8 flex items-center gap-3">
                <Radio className="w-5 h-5 text-brand" />
                Signal-to-Noise Ratio Analysis
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                <div className="p-6 bg-white/5 rounded-[24px] border border-white/5">
                  <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-[0.2em] mb-2">Total Signal</p>
                  <p className="text-3xl font-black text-white tracking-tighter">{Math.round(snrData.signal)}</p>
                  <p className="text-xs text-[#8E8E93] mt-2">Weighted Impact Score</p>
                </div>
                <div className="p-6 bg-white/5 rounded-[24px] border border-white/5">
                  <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-[0.2em] mb-2">Total Noise</p>
                  <p className="text-3xl font-black text-white tracking-tighter">{Math.round(snrData.noise)}</p>
                  <p className="text-xs text-[#8E8E93] mt-2">Weighted Effort Score</p>
                </div>
              </div>

              <div className="h-[200px] mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={snrChartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#8E8E93" fontSize={12} axisLine={false} tickLine={false} width={100} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#1C1C1E] border border-white/10 p-3 rounded-xl shadow-xl">
                              <p className="text-white font-bold">{payload[0].value} Units</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                      {snrChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8">
                <SNRVisualizer 
                  signal={snrData.signal} 
                  noise={snrData.noise} 
                  className="h-40 shadow-2xl neural-glow"
                />
              </div>
            </div>

            <div className="w-full lg:w-[300px] space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">High Signal Objectives</h4>
              <div className="space-y-3">
                {snrData.taskDetails.slice(0, 5).map((task, i) => (
                  <div key={task.id} className="p-4 bg-white/5 rounded-[20px] border border-white/5 flex items-center justify-between group/task hover:bg-white/10 transition-all">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-mono text-[#8E8E93]">Ratio: {task.ratio.toFixed(1)}x</span>
                        <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand" 
                            style={{ width: `${Math.min(100, task.ratio * 20)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-brand">+{Math.round(task.signal)}</p>
                      <p className="text-[10px] text-[#8E8E93]">Signal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4 bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group flex flex-col">
          <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />
          <h3 className="text-lg font-bold text-white tracking-tight mb-8 flex items-center gap-3 relative z-10">
            <Zap className="w-5 h-5 text-brand" />
            Focus Ratio Matrix
          </h3>

          <div className="flex-1 flex flex-col justify-center items-center relative z-10">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={focusRatioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                    isAnimationActive={true}
                  >
                    {focusRatioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="text-center mt-6">
              <p className="text-4xl font-black text-white tracking-tighter mb-2">{Math.round(signalRatio)}% Signal</p>
              <p className={cn(
                "text-xs font-mono uppercase tracking-[0.2em]",
                signalRatio < 80 ? "text-red-500 animate-pulse" : "text-brand"
              )}>
                {signalRatio < 80 ? "CRITICAL: REDUCE NOISE" : "NESTED STABILITY"}
              </p>
              {signalRatio < 80 && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-[10px] text-left">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="leading-relaxed">System Warning: Tuition/Noise levels exceeding capacity. Recalibrate Deep Work blocks to restore flow.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SNR Waveform Section */}
      <motion.div variants={itemVariants} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group">
        <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />
        <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <h3 className="text-lg font-bold text-white tracking-tight mb-8 flex items-center gap-3 relative z-10">
          <Activity className="w-5 h-5 text-brand" />
          Dynamic SNR Waveform
        </h3>
        <div className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={snrWaveformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSnr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1DB954" stopOpacity={0.6}/>
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis dataKey="date" stroke="#8E8E93" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#8E8E93" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const value = Number(payload[0].value);
                    const color = value > 2 ? '#1DB954' : value > 1 ? '#f59e0b' : '#ef4444';
                    return (
                      <div className="bg-[#1C1C1E]/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                        <p className="text-white font-bold mb-2">{label}</p>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-[#8E8E93] text-sm">SNR:</span>
                          <span className="text-white font-mono font-bold" style={{ color }}>{value.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="snr" 
                name="SNR Value"
                stroke="#1DB954" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSnr)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Heatmap Section */}
      <motion.div variants={itemVariants} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group">
        <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />
        <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <h3 className="text-lg font-bold text-white tracking-tight mb-8 flex items-center gap-3 relative z-10">
          <Activity className="w-5 h-5 text-brand" />
          Study Intensity Heatmap (Last 14 Days)
        </h3>
        <div className="overflow-x-auto pb-4 relative z-10">
          <div className="min-w-[600px]">
            <div className="flex mb-2">
              <div className="w-32 shrink-0"></div>
              <div className="flex-1 grid grid-cols-14 gap-2">
                {last14Days.map((date, i) => (
                  <div key={date} className="text-[10px] font-mono text-[#8E8E93] text-center">
                    {i % 2 === 0 ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {heatmapData.map((subject) => (
                <div key={subject.id} className="flex items-center group">
                  <div className="w-32 shrink-0 text-xs font-bold text-white truncate pr-4 transition-colors group-hover:text-brand">
                    {subject.name}
                  </div>
                  <div className="flex-1 grid grid-cols-14 gap-2">
                    {subject.days.map((day, i) => (
                      <motion.div
                        key={day.date}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 + 0.2, type: 'spring' }}
                        className="aspect-square rounded-md relative group/cell cursor-pointer"
                        style={{ 
                          backgroundColor: subject.color,
                          opacity: getHeatmapOpacity(day.totalTime)
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2C2C2E] text-white text-xs rounded-lg opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl border border-white/10">
                          <span className="font-bold">{day.totalTime} mins</span> on {new Date(day.date).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div 
          variants={itemVariants}
          className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group"
        >
          <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <h3 className="text-lg font-bold text-white tracking-tight mb-12 flex items-center gap-3 relative z-10">
            <TrendingUp className="w-5 h-5 text-brand" />
            Subject Balance Matrix
          </h3>
          <div className="h-[450px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2C2C2E" strokeWidth={1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8E8E93', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#48484A', fontSize: 10 }} />
                <Radar name="Performance" dataKey="Score" stroke="#fff" fill="#fff" fillOpacity={0.05} strokeWidth={2} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
                <Radar name="Readiness" dataKey="Readiness" stroke="#0A84FF" fill="#0A84FF" fillOpacity={0.2} strokeWidth={2} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group"
        >
          <div className="grid-background absolute inset-0 pointer-events-none opacity-[0.02]" />
          <div className="scan-line opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <h3 className="text-lg font-bold text-white tracking-tight mb-12 flex items-center gap-3 relative z-10">
            <CheckCircle2 className="w-5 h-5 text-brand" />
            Topic Mastery Distribution
          </h3>
          <div className="h-[450px] flex flex-col sm:flex-row items-center gap-12 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-6 sm:pr-12 w-full sm:w-auto">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-5">
                  <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: d.color, boxShadow: `0 0 15px ${d.color}33` }} />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">{d.name}</span>
                    <span className="text-xl font-bold text-white">{d.value} <span className="text-sm font-medium text-[#8E8E93]">Topics</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        variants={itemVariants}
        className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10"
      >
        <h3 className="text-lg font-bold text-white tracking-tight mb-12 flex items-center gap-3">
          <Star className="w-5 h-5 text-brand" />
          Focus Level Trend Analysis
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={focusTrendData}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0A84FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis dataKey="name" stroke="#8E8E93" fontSize={12} fontWeight={500} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#8E8E93" fontSize={12} fontWeight={500} domain={[0, 5]} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="focus" stroke="#0A84FF" fillOpacity={1} fill="url(#focusGradient)" strokeWidth={3} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10"
      >
        <h3 className="text-lg font-bold text-white tracking-tight mb-10 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-brand" />
          Subject Mastery Timeline
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={masteryTrendData} onMouseLeave={() => setHoveredSubject(null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis dataKey="name" stroke="#8E8E93" fontSize={11} fontWeight={500} />
              <YAxis stroke="#8E8E93" fontSize={11} fontWeight={500} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              {subjects.map((subject, index) => (
                <Line 
                  key={subject.id} 
                  type="monotone" 
                  dataKey={subject.name} 
                  stroke={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                  strokeWidth={hoveredSubject === subject.name ? 5 : 3} 
                  strokeOpacity={hoveredSubject && hoveredSubject !== subject.name ? 0.2 : 1}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={true} 
                  animationDuration={1500} 
                  animationEasing="ease-out"
                  onMouseEnter={() => setHoveredSubject(subject.name)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-6 mt-10 justify-center">
          {subjects.map((subject, index) => (
            <div 
              key={subject.id} 
              className="flex items-center gap-3 cursor-pointer transition-opacity"
              style={{ opacity: hoveredSubject && hoveredSubject !== subject.name ? 0.4 : 1 }}
              onMouseEnter={() => setHoveredSubject(subject.name)}
              onMouseLeave={() => setHoveredSubject(null)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">{subject.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10">
        <h3 className="text-lg font-bold text-white tracking-tight mb-10 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-brand" />
          Exam Performance Metrics
        </h3>
        {exams.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
                <XAxis dataKey="name" stroke="#8E8E93" fontSize={11} fontWeight={500} />
                <YAxis stroke="#8E8E93" fontSize={11} fontWeight={500} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="average" stroke="#0A84FF" strokeWidth={3} dot={{ r: 5, fill: '#0A84FF', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-[#8E8E93]">
            <Trophy className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No Data Detected</p>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10">
        <h3 className="text-lg font-bold text-white tracking-tight mb-10 flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-brand" />
          Subject Performance Per Exam
        </h3>
        {exams.length > 0 ? (
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectExamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
                <XAxis dataKey="name" stroke="#8E8E93" fontSize={11} fontWeight={500} />
                <YAxis stroke="#8E8E93" fontSize={11} fontWeight={500} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                {subjects.map((subject, index) => (
                  <Bar 
                    key={subject.id} 
                    dataKey={subject.name} 
                    fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true} 
                    animationDuration={1500} 
                    animationEasing="ease-out"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-[#8E8E93]">
            <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No Data Detected</p>
          </div>
        )}
        <div className="flex flex-wrap gap-6 mt-10 justify-center">
          {subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">{subject.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-10">
        <h3 className="text-lg font-bold text-white tracking-tight mb-10 flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-brand" />
          Mission Protocol Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-3">
            <p className="text-sm font-bold text-white">Deep Work Block</p>
            <p className="text-sm text-[#8E8E93] leading-relaxed">90m study + 15m break for maximum cognitive retention metrics.</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-white">Tuition Conversion</p>
            <p className="text-sm text-[#8E8E93] leading-relaxed">Mandatory same-day review of tuition lessons. Non-negotiable sync.</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-white">Nightly Routine</p>
            <p className="text-sm text-[#8E8E93] leading-relaxed">20m error-log + formula recall before sleep cycle initialization.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
