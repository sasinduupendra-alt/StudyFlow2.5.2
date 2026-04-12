import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Subject, StudyLog, ExamRecord } from '../types';
import { TrendingUp, Clock, Star, Target, Zap, CheckCircle2, AlertTriangle, Trophy, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalyticsProps {
  subjects: Subject[];
  studyLogs: StudyLog[];
  exams: ExamRecord[];
}

export default function Analytics({ subjects, studyLogs, exams }: AnalyticsProps) {
  const totalStudyTime = studyLogs.reduce((acc, log) => acc + log.duration, 0);
  const avgFocus = studyLogs.length > 0 
    ? (studyLogs.reduce((acc, log) => acc + log.focusLevel, 0) / studyLogs.length).toFixed(1)
    : 0;

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

  const focusTrendData = studyLogs.slice(-7).map((log, i) => ({
    name: `Session ${i + 1}`,
    focus: log.focusLevel
  }));

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

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
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10 p-6 md:p-10 max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="enterprise-card p-8 group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total Study Time</span>
          </div>
          <p className="text-4xl font-mono text-white tabular-nums uppercase tracking-[0.15em]">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</p>
        </motion.div>

        <motion.div variants={itemVariants} className="enterprise-card p-8 group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Avg Focus Level</span>
          </div>
          <p className="text-4xl font-mono text-white tabular-nums uppercase tracking-[0.15em]">{avgFocus}/5.0</p>
        </motion.div>

        <motion.div variants={itemVariants} className="enterprise-card p-8 group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Readiness Avg</span>
          </div>
          <p className="text-4xl font-mono text-white tabular-nums uppercase tracking-[0.15em]">
            {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.readiness, 0) / subjects.length) : 0}%
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="enterprise-card p-8 group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-transparent border border-white/20 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sessions Logged</span>
          </div>
          <p className="text-4xl font-mono text-white tabular-nums uppercase tracking-[0.15em]">{studyLogs.length}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div 
          variants={itemVariants}
          className="enterprise-card p-10"
        >
          <h3 className="text-sm font-mono text-white uppercase tracking-widest mb-12 flex items-center gap-4">
            <TrendingUp className="w-5 h-5 text-white" />
            Subject Balance Matrix
          </h3>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#18181b" strokeWidth={1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#3f3f46', fontSize: 9 }} />
                <Radar name="Performance" dataKey="Score" stroke="#fff" fill="#fff" fillOpacity={0.03} strokeWidth={1} />
                <Radar name="Readiness" dataKey="Readiness" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '0px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="enterprise-card p-10"
        >
          <h3 className="text-sm font-mono text-white uppercase tracking-widest mb-12 flex items-center gap-4">
            <CheckCircle2 className="w-5 h-5 text-white" />
            Topic Mastery Distribution
          </h3>
          <div className="h-[450px] flex flex-col sm:flex-row items-center gap-12">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '0px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-6 sm:pr-12 w-full sm:w-auto">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-5">
                  <div className="w-4 h-4 rounded-none shadow-lg" style={{ backgroundColor: d.color, boxShadow: `0 0 15px ${d.color}33` }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{d.name}</span>
                    <span className="text-lg font-bold text-white tabular-nums">{d.value} <span className="text-[10px] font-mono text-zinc-600">Topics</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        variants={itemVariants}
        className="enterprise-card p-10"
      >
        <h3 className="text-sm font-mono text-white uppercase tracking-widest mb-12 flex items-center gap-4">
          <Star className="w-5 h-5 text-white" />
          Focus Level Trend Analysis
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={focusTrendData}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#3f3f46" fontSize={10} fontWeight={700} domain={[0, 5]} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '0px', padding: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}
              />
              <Area type="monotone" dataKey="focus" stroke="#ffffff" fillOpacity={1} fill="url(#focusGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="enterprise-card p-8"
      >
        <h3 className="text-sm font-mono text-white uppercase tracking-widest mb-10 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-white" />
          Subject Mastery Timeline
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={masteryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis dataKey="name" stroke="#3f3f46" fontSize={9} fontWeight={600} />
              <YAxis stroke="#3f3f46" fontSize={9} fontWeight={600} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '0px' }}
                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}
              />
              {subjects.map((subject, index) => (
                <Line 
                  key={subject.id} 
                  type="monotone" 
                  dataKey={subject.name} 
                  stroke={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-6 mt-10 justify-center">
          {subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-none" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{subject.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="enterprise-card p-8">
        <h3 className="text-sm font-mono text-white uppercase tracking-widest mb-10 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-white" />
          Exam Performance Metrics
        </h3>
        {exams.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="name" stroke="#3f3f46" fontSize={9} fontWeight={600} />
                <YAxis stroke="#3f3f46" fontSize={9} fontWeight={600} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '0px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
                <Line type="monotone" dataKey="average" stroke="#ffffff" strokeWidth={3} dot={{ r: 5, fill: '#ffffff', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-zinc-800">
            <Trophy className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">No Data Detected</p>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="enterprise-card p-8">
        <h3 className="text-sm font-mono text-white uppercase tracking-widest mb-10 flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-white" />
          Subject Performance Per Exam
        </h3>
        {exams.length > 0 ? (
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectExamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="name" stroke="#3f3f46" fontSize={9} fontWeight={600} />
                <YAxis stroke="#3f3f46" fontSize={9} fontWeight={600} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '0px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
                {subjects.map((subject, index) => (
                  <Bar 
                    key={subject.id} 
                    dataKey={subject.name} 
                    fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                    fillOpacity={0.4}
                    radius={[0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-zinc-800">
            <BarChart2 className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">No Data Detected</p>
          </div>
        )}
        <div className="flex flex-wrap gap-6 mt-10 justify-center">
          {subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-none" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{subject.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="enterprise-card p-10">
        <h3 className="text-sm font-mono text-white uppercase tracking-widest mb-10 flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-white" />
          Mission Protocol Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="space-y-3">
            <p className="text-xs font-mono text-white uppercase tracking-widest">Deep Work Block</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">90m study + 15m break for maximum cognitive retention metrics.</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-mono text-white uppercase tracking-widest">Tuition Conversion</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">Mandatory same-day review of tuition lessons. Non-negotiable sync.</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-mono text-white uppercase tracking-widest">Nightly Routine</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">20m error-log + formula recall before sleep cycle initialization.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
