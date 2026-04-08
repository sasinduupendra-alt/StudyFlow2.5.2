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

  const SUBJECT_COLORS = ['#1DB954', '#3b82f6', '#fbbf24', '#ef4444', '#8b5cf6', '#ec4899'];

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

  return (
    <div className="space-y-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#1DB954]/10 rounded-lg text-[#1DB954] group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-gray-400">Total Study Time</span>
          </div>
          <p className="text-3xl font-bold">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</p>
        </div>

        <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-gray-400">Avg Focus Level</span>
          </div>
          <p className="text-3xl font-bold">{avgFocus}/5.0</p>
        </div>

        <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-gray-400">Readiness Avg</span>
          </div>
          <p className="text-3xl font-bold">
            {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.readiness, 0) / subjects.length) : 0}%
          </p>
        </div>

        <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-gray-400">Sessions Logged</span>
          </div>
          <p className="text-3xl font-bold">{studyLogs.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#181818] p-6 rounded-2xl border border-white/5"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1DB954]" />
            Subject Balance
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} />
                <Radar name="Performance" dataKey="Score" stroke="#1DB954" fill="#1DB954" fillOpacity={0.4} />
                <Radar name="Readiness" dataKey="Readiness" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#181818] p-6 rounded-2xl border border-white/5"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
            Topic Mastery Distribution
          </h3>
          <div className="h-[400px] sm:h-[300px] flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4 sm:pr-8 w-full sm:w-auto">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-gray-400">{d.name}</span>
                  <span className="text-sm font-bold ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#181818] p-6 rounded-2xl border border-white/5"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Focus Level Trend (Last 7 Sessions)
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={focusTrendData}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={10} />
              <YAxis stroke="#4b5563" fontSize={10} domain={[0, 5]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="focus" stroke="#fbbf24" fillOpacity={1} fill="url(#focusGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#181818] p-6 rounded-2xl border border-white/5"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#1DB954]" />
          Subject Mastery Trend (Last 14 Days)
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={masteryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={10} />
              <YAxis stroke="#4b5563" fontSize={10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              {subjects.map((subject, index) => (
                <Line 
                  key={subject.id} 
                  type="monotone" 
                  dataKey={subject.name} 
                  stroke={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                  strokeWidth={2} 
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          {subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="text-xs text-gray-400">{subject.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="bg-[#181818] p-6 rounded-2xl border border-white/5">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Exam Performance Trend
        </h3>
        {exams.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} />
                <YAxis stroke="#4b5563" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="average" stroke="#fbbf24" strokeWidth={3} dot={{ r: 6, fill: '#fbbf24' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
            <Trophy className="w-12 h-12 mb-2 opacity-20" />
            <p>No exam data available yet.</p>
          </div>
        )}
      </div>

      <div className="bg-[#181818] p-6 rounded-2xl border border-white/5">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          Subject Performance per Exam
        </h3>
        {exams.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectExamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} />
                <YAxis stroke="#4b5563" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                {subjects.map((subject, index) => (
                  <Bar 
                    key={subject.id} 
                    dataKey={subject.name} 
                    fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
            <BarChart2 className="w-12 h-12 mb-2 opacity-20" />
            <p>No exam data available yet.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          {subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="text-xs text-gray-400">{subject.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1DB954]/10 to-transparent p-8 rounded-3xl border border-[#1DB954]/20">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-[#1DB954]" />
          A/L Study Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="font-bold text-[#1DB954]">Deep Work Block</p>
            <p className="text-sm text-gray-400">90 minutes study + 10–15 min break for maximum cognitive retention.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-[#1DB954]">Tuition Conversion</p>
            <p className="text-sm text-gray-400">Mandatory same-day review of tuition lessons. Non-negotiable.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-[#1DB954]">Nightly Routine</p>
            <p className="text-sm text-gray-400">20–30 min error-log + formula recall before sleep every single day.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
