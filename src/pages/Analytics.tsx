import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import AnalyticsDashboard from '../components/Analytics';

export default function AnalyticsPage() {
  const { subjects, studyLogs, exams } = useAppStore();

  const processedSubjects = useMemo(() => {
    return subjects.map(s => {
      const avgMastery = s.topics.length > 0 
        ? s.topics.reduce((acc, t) => acc + t.mastery, 0) / s.topics.length
        : 0;
      const readiness = (s.score * 0.4) + (avgMastery * 0.6);
      return { ...s, readiness };
    });
  }, [subjects]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <AnalyticsDashboard subjects={processedSubjects} studyLogs={studyLogs} exams={exams} />
    </motion.div>
  );
}
