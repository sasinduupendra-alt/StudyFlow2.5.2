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
        <div className="scifi-panel-sm p-6 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand/10 border border-brand/20 text-brand group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <span className="hud-label">TOTAL_STUDY_TIME</span>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tighter">{Math.floor(totalStudyTime / 60)}H {totalStudyTime % 60}M</p>
        </div>

        <div className="scifi-panel-sm p-6 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 group-hover:scale-110 transition-transform">
              <Star className="w-4 h-4" />
            </div>
            <span className="hud-label">AVG_FOCUS_LVL</span>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tighter">{avgFocus}/5.0</p>
        </div>

        <div className="scifi-panel-sm p-6 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <span className="hud-label">READINESS_AVG</span>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tighter">
            {subjects.length > 0 ? Math.round(subjects.reduce((acc, s) => acc + s.readiness, 0) / subjects.length) : 0}%
          </p>
        </div>

        <div className="scifi-panel-sm p-6 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-500 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <span className="hud-label">SESSIONS_LOGGED</span>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tighter">{studyLogs.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="scifi-panel p-6"
        >
          <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <TrendingUp className="w-4 h-4 text-brand" />
            SUBJECT_BALANCE_MATRIX
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#444', fontSize: 9, fontWeight: 900 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#333', fontSize: 7 }} />
                <Radar name="Performance" dataKey="Score" stroke="var(--color-brand)" fill="var(--color-brand)" fillOpacity={0.2} />
                <Radar name="Readiness" dataKey="Readiness" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0px' }}
                  itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="scifi-panel p-6"
        >
          <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <CheckCircle2 className="w-4 h-4 text-brand" />
            TOPIC_MASTERY_DISTRIBUTION
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
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0px' }}
                  itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 sm:pr-8 w-full sm:w-auto">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-2 h-2" style={{ backgroundColor: d.color }} />
                  <span className="hud-label !text-gray-600">{d.name}</span>
                  <span className="text-[10px] font-black ml-auto tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="scifi-panel p-6"
      >
        <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
          <Star className="w-4 h-4 text-yellow-500" />
          FOCUS_LEVEL_TREND_ANALYSIS
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={focusTrendData}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
              <XAxis dataKey="name" stroke="#333" fontSize={7} fontWeight={900} />
              <YAxis stroke="#333" fontSize={7} fontWeight={900} domain={[0, 5]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0px' }}
                itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}
              />
              <Area type="monotone" dataKey="focus" stroke="#fbbf24" fillOpacity={1} fill="url(#focusGradient)" strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="scifi-panel p-6"
      >
        <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
          <TrendingUp className="w-4 h-4 text-brand" />
          SUBJECT_MASTERY_TIMELINE
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={masteryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
              <XAxis dataKey="name" stroke="#333" fontSize={7} fontWeight={900} />
              <YAxis stroke="#333" fontSize={7} fontWeight={900} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0px' }}
                itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}
              />
              {subjects.map((subject, index) => (
                <Line 
                  key={subject.id} 
                  type="monotone" 
                  dataKey={subject.name} 
                  stroke={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                  strokeWidth={1} 
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          {subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center gap-2">
              <div className="w-2 h-2" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="hud-label !text-gray-600">{subject.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="scifi-panel p-6">
        <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
          <Trophy className="w-4 h-4 text-yellow-500" />
          EXAM_PERFORMANCE_METRICS
        </h3>
        {exams.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" stroke="#333" fontSize={7} fontWeight={900} />
                <YAxis stroke="#333" fontSize={7} fontWeight={900} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0px' }}
                  itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Line type="monotone" dataKey="average" stroke="#fbbf24" strokeWidth={2} dot={{ r: 4, fill: '#fbbf24' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-gray-700">
            <Trophy className="w-8 h-8 mb-2 opacity-20" />
            <p className="hud-label !text-gray-800">NO_DATA_DETECTED</p>
          </div>
        )}
      </div>

      <div className="scifi-panel p-6">
        <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
          <BarChart2 className="w-4 h-4 text-blue-500" />
          SUBJECT_PERFORMANCE_PER_EXAM
        </h3>
        {exams.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectExamPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" stroke="#333" fontSize={7} fontWeight={900} />
                <YAxis stroke="#333" fontSize={7} fontWeight={900} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0px' }}
                  itemStyle={{ color: '#fff', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                {subjects.map((subject, index) => (
                  <Bar 
                    key={subject.id} 
                    dataKey={subject.name} 
                    fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
                    fillOpacity={0.6}
                    radius={[0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-gray-700">
            <BarChart2 className="w-8 h-8 mb-2 opacity-20" />
            <p className="hud-label !text-gray-800">NO_DATA_DETECTED</p>
          </div>
        )}
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          {subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center gap-2">
              <div className="w-2 h-2" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }} />
              <span className="hud-label !text-gray-600">{subject.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand/5 p-8 border border-brand/20">
        <h3 className="text-sm font-black mb-6 flex items-center gap-3 uppercase tracking-tighter">
          <AlertTriangle className="w-4 h-4 text-brand" />
          A/L_PROTOCOL_RULES
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-brand uppercase tracking-widest">DEEP_WORK_BLOCK</p>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">90M study + 15M break for maximum cognitive retention metrics.</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-brand uppercase tracking-widest">TUITION_CONVERSION</p>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Mandatory same-day review of tuition lessons. Non-negotiable sync.</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-brand uppercase tracking-widest">NIGHTLY_ROUTINE</p>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">20M error-log + formula recall before sleep cycle initialization.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
