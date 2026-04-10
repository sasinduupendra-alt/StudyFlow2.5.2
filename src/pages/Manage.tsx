import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import ManageData from '../components/ManageData';
import { supabase } from '../lib/supabase';
import { WeeklySchedule, Activity, ExamRecord, Subject, Topic, Resource, StudyLog } from '../types';
import { INITIAL_SUBJECTS, INITIAL_BADGES, WEEKLY_BASE_SCHEDULE } from '../constants';

export default function Manage() {
  const { 
    subjects, 
    schedule, 
    studyLogs, 
    exams, 
    user, 
    userProfile, 
    addToast,
    addRecentlyStudied,
    setSchedule,
    setStudyLogs,
    setExams,
    setSubjects,
    setUserProfile,
    resetToDefault
  } = useAppStore();

  const handleUpdateSchedule = async (day: keyof WeeklySchedule, activities: Activity[]) => {
    const newSchedule = { ...schedule, [day]: activities };
    setSchedule(newSchedule);

    if (user) {
      try {
        await supabase
          .from('config')
          .upsert({ user_id: user.id, key: 'schedule', data: newSchedule });
        addToast(`Updated schedule for ${day}`, 'success');
      } catch (e) {
        console.error("Failed to update schedule in cloud", e);
      }
    } else {
      addToast(`Updated schedule for ${day}`, 'success');
    }
  };

  const handleDeleteLog = async (id: string) => {
    const newLogs = studyLogs.filter(log => log.id !== id);
    setStudyLogs(newLogs);

    if (user) {
      try {
        await supabase
          .from('study_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        addToast("Log deleted", "info");
      } catch (e) {
        console.error("Failed to delete log in cloud", e);
      }
    } else {
      addToast("Log deleted", "info");
    }
  };

  const handleClearLogs = async () => {
    setStudyLogs([]);

    if (user) {
      try {
        await supabase
          .from('study_logs')
          .delete()
          .eq('user_id', user.id);
        addToast("All logs cleared", "info");
      } catch (e) {
        console.error("Failed to clear logs in cloud", e);
      }
    } else {
      addToast("All logs cleared", "info");
    }
  };

  const handleAddExam = async (exam: Omit<ExamRecord, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const examData = { ...exam, id } as ExamRecord;
    if (examData.rank === undefined) delete examData.rank;
    if (examData.notes === undefined) delete examData.notes;

    setExams([...exams, examData]);

    if (user) {
      try {
        await supabase
          .from('exams')
          .insert({ ...examData, user_id: user.id });
        addToast("Exam added", "success");
      } catch (e) {
        console.error("Failed to add exam in cloud", e);
      }
    } else {
      addToast("Exam added", "success");
    }
  };

  const handleEditExam = async (id: string, updatedExam: Partial<ExamRecord>) => {
    const newExams = exams.map(e => e.id === id ? { ...e, ...updatedExam } : e);
    setExams(newExams);

    if (user) {
      try {
        const examData = { ...updatedExam };
        if (examData.rank === undefined) delete examData.rank;
        if (examData.notes === undefined) delete examData.notes;
        
        await supabase
          .from('exams')
          .update(examData)
          .eq('id', id)
          .eq('user_id', user.id);
        addToast("Exam updated", "success");
      } catch (e) {
        console.error("Failed to edit exam in cloud", e);
      }
    } else {
      addToast("Exam updated", "success");
    }
  };

  const handleDeleteExam = async (id: string) => {
    const newExams = exams.filter(e => e.id !== id);
    setExams(newExams);

    if (user) {
      try {
        await supabase
          .from('exams')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        addToast("Exam deleted", "info");
      } catch (e) {
        console.error("Failed to delete exam in cloud", e);
      }
    } else {
      addToast("Exam deleted", "info");
    }
  };

  const handleAddSubject = async (name: string, image?: string, examDate?: string, notes?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSubject: Subject = {
      id,
      name,
      score: 0,
      focus: 3,
      weakCount: 0,
      status: 'Weak',
      priorityScore: 0,
      readiness: 0,
      gradient: 'from-gray-500/20 to-gray-900/40',
      ...(image !== undefined && { image }),
      ...(examDate !== undefined && { examDate }),
      ...(notes !== undefined && { notes }),
      topics: []
    };

    setSubjects([...subjects, newSubject]);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .insert({ ...newSubject, user_id: user.id });
        addToast(`Subject ${name} added`, "success");
      } catch (e) {
        console.error("Failed to add subject in cloud", e);
      }
    } else {
      addToast(`Subject ${name} added`, "success");
    }
  };

  const handleEditSubject = async (id: string, name: string, image?: string, examDate?: string, notes?: string) => {
    const newSubjects = subjects.map(s => s.id === id ? { 
      ...s, 
      name, 
      ...(image !== undefined && { image }),
      ...(examDate !== undefined && { examDate }),
      ...(notes !== undefined && { notes })
    } : s);
    setSubjects(newSubjects);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .update({ 
            name, 
            ...(image !== undefined && { image }),
            ...(examDate !== undefined && { examDate }),
            ...(notes !== undefined && { notes })
          })
          .eq('id', id)
          .eq('user_id', user.id);
        addToast("Subject updated", "success");
      } catch (e) {
        console.error("Failed to edit subject in cloud", e);
      }
    } else {
      addToast("Subject updated", "success");
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const newSubjects = subjects.filter(s => s.id !== id);
    setSubjects(newSubjects);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        addToast("Subject deleted", "info");
      } catch (e) {
        console.error("Failed to delete subject in cloud", e);
      }
    } else {
      addToast("Subject deleted", "info");
    }
  };

  const handleAddTopic = async (subjectId: string, title: string, image?: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newTopic: Topic = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      mastery: 0,
      ...(image !== undefined && { image })
    };

    const updatedTopics = [...subject.topics, newTopic];
    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: updatedTopics } : s);
    setSubjects(newSubjects);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .update({ topics: updatedTopics })
          .eq('id', subjectId)
          .eq('user_id', user.id);
        addToast(`Topic ${title} added to ${subject.name}`, "success");
      } catch (e) {
        console.error("Failed to add topic in cloud", e);
      }
    } else {
      addToast(`Topic ${title} added to ${subject.name}`, "success");
    }
  };

  const handleEditTopic = async (subjectId: string, topicId: string, title: string, mastery: number, image?: string, resources?: Resource[]) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => {
      if (t.id === topicId) {
        return {
          ...t,
          title,
          mastery,
          ...(image !== undefined && { image }),
          ...(resources !== undefined && { resources })
        };
      }
      return t;
    });

    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: updatedTopics } : s);
    setSubjects(newSubjects);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .update({ topics: updatedTopics })
          .eq('id', subjectId)
          .eq('user_id', user.id);
        addToast("Topic updated", "success");
      } catch (e) {
        console.error("Failed to edit topic in cloud", e);
      }
    } else {
      addToast("Topic updated", "success");
    }
  };

  const handleUpdateResources = async (subjectId: string, topicId: string, resources: Resource[]) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => t.id === topicId ? { ...t, resources } : t);
    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: updatedTopics } : s);
    setSubjects(newSubjects);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .update({ topics: updatedTopics })
          .eq('id', subjectId)
          .eq('user_id', user.id);
        addToast("Resources updated", "success");
      } catch (e) {
        console.error("Failed to update resources in cloud", e);
      }
    } else {
      addToast("Resources updated", "success");
    }
  };

  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.filter(t => t.id !== topicId);
    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: updatedTopics } : s);
    setSubjects(newSubjects);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .update({ topics: updatedTopics })
          .eq('id', subjectId)
          .eq('user_id', user.id);
        addToast("Topic deleted", "info");
      } catch (e) {
        console.error("Failed to delete topic in cloud", e);
      }
    } else {
      addToast("Topic deleted", "info");
    }
  };

  const handleReorderTopics = async (subjectId: string, topics: Topic[]) => {
    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics } : s);
    setSubjects(newSubjects);

    if (user) {
      try {
        await supabase
          .from('subjects')
          .update({ topics })
          .eq('id', subjectId)
          .eq('user_id', user.id);
      } catch (e) {
        console.error("Failed to reorder topics in cloud", e);
      }
    }
  };

  const handleResetSyllabus = async () => {
    setSubjects(INITIAL_SUBJECTS);

    if (user) {
      try {
        // Delete existing
        await supabase
          .from('subjects')
          .delete()
          .eq('user_id', user.id);
        
        // Add initial
        const subjectsToInsert = INITIAL_SUBJECTS.map(s => ({ ...s, user_id: user.id }));
        await supabase.from('subjects').insert(subjectsToInsert);
        
        addToast("Syllabus reset to default", "success");
      } catch (e) {
        console.error("Failed to reset syllabus in cloud", e);
      }
    } else {
      addToast("Syllabus reset to default", "success");
    }
  };

  const handleResetProfile = async () => {
    const initialProfile = {
      points: 0,
      streak: 0,
      badges: INITIAL_BADGES,
      totalSessions: 0,
      totalStudyTime: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100
    };
    setUserProfile(initialProfile);

    if (user) {
      try {
        await supabase
          .from('users')
          .upsert({ id: user.id, ...initialProfile });
        addToast("Profile reset to default", "success");
      } catch (e) {
        console.error("Failed to reset profile in cloud", e);
      }
    } else {
      addToast("Profile reset to default", "success");
    }
  };

  const handleResetScheduleAction = async () => {
    setSchedule(WEEKLY_BASE_SCHEDULE);

    if (user) {
      try {
        await supabase
          .from('config')
          .upsert({ user_id: user.id, key: 'schedule', data: WEEKLY_BASE_SCHEDULE });
        addToast("Schedule reset to default", "success");
      } catch (e) {
        console.error("Failed to reset schedule in cloud", e);
      }
    } else {
      addToast("Schedule reset to default", "success");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <ManageData 
        subjects={subjects}
        schedule={schedule}
        studyLogs={studyLogs}
        onUpdateSchedule={handleUpdateSchedule}
        onDeleteLog={handleDeleteLog}
        onClearLogs={handleClearLogs}
        onAddLog={() => {}} // This is handled globally in Layout or we can add a specific handler
        onAddSubject={handleAddSubject}
        onEditSubject={handleEditSubject}
        onDeleteSubject={handleDeleteSubject}
        onAddTopic={handleAddTopic}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
        onReorderTopics={handleReorderTopics}
        onUpdateResources={handleUpdateResources}
        onResetSyllabus={handleResetSyllabus}
        onResetProfile={handleResetProfile}
        onResetSchedule={handleResetScheduleAction}
        exams={exams}
        onAddExam={handleAddExam}
        onEditExam={handleEditExam}
        onDeleteExam={handleDeleteExam}
      />
    </motion.div>
  );
}
