import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import ManageData from '../components/ManageData';
import { db, auth } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { WeeklySchedule, Activity, ExamRecord, Subject, Topic, Resource, StudyLog } from '../types';
import { INITIAL_SUBJECTS, INITIAL_BADGES } from '../constants';

export default function Manage() {
  const { 
    subjects, 
    schedule, 
    studyLogs, 
    exams, 
    user, 
    userProfile, 
    addToast,
    addRecentlyStudied
  } = useAppStore();

  const handleUpdateSchedule = async (day: keyof WeeklySchedule, activities: Activity[]) => {
    if (!user) return;
    try {
      const scheduleRef = doc(db, 'users', user.uid, 'schedules', 'weekly');
      await setDoc(scheduleRef, { ...schedule, [day]: activities });
      addToast(`Updated schedule for ${day}`, 'success');
    } catch (e) {
      console.error("Failed to update schedule", e);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'study_logs', id));
      addToast("Log deleted", "info");
    } catch (e) {
      console.error("Failed to delete log", e);
    }
  };

  const handleClearLogs = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      studyLogs.forEach(log => {
        batch.delete(doc(db, 'users', user.uid, 'study_logs', log.id));
      });
      await batch.commit();
      addToast("All logs cleared", "info");
    } catch (e) {
      console.error("Failed to clear logs", e);
    }
  };

  const handleAddExam = async (exam: Omit<ExamRecord, 'id'>) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const examData = { ...exam, id };
      if (examData.rank === undefined) delete examData.rank;
      if (examData.notes === undefined) delete examData.notes;
      
      await setDoc(doc(db, 'users', user.uid, 'exams', id), examData);
      addToast("Exam added", "success");
    } catch (e) {
      console.error("Failed to add exam", e);
    }
  };

  const handleEditExam = async (id: string, updatedExam: Partial<ExamRecord>) => {
    if (!user) return;
    try {
      const examData = { ...updatedExam };
      if (examData.rank === undefined) delete examData.rank;
      if (examData.notes === undefined) delete examData.notes;
      
      await updateDoc(doc(db, 'users', user.uid, 'exams', id), examData);
      addToast("Exam updated", "success");
    } catch (e) {
      console.error("Failed to edit exam", e);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'exams', id));
      addToast("Exam deleted", "info");
    } catch (e) {
      console.error("Failed to delete exam", e);
    }
  };

  const handleAddSubject = async (name: string, image?: string, examDate?: string, notes?: string) => {
    if (!user) return;
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
    try {
      await setDoc(doc(db, 'users', user.uid, 'subjects', id), newSubject);
      addToast(`Subject ${name} added`, "success");
    } catch (e) {
      console.error("Failed to add subject", e);
    }
  };

  const handleEditSubject = async (id: string, name: string, image?: string, examDate?: string, notes?: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'subjects', id), { 
        name, 
        ...(image !== undefined && { image }),
        ...(examDate !== undefined && { examDate }),
        ...(notes !== undefined && { notes })
      });
      addToast("Subject updated", "success");
    } catch (e) {
      console.error("Failed to edit subject", e);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'subjects', id));
      addToast("Subject deleted", "info");
    } catch (e) {
      console.error("Failed to delete subject", e);
    }
  };

  const handleAddTopic = async (subjectId: string, title: string, image?: string) => {
    if (!user) return;
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newTopic: Topic = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      mastery: 0,
      ...(image !== undefined && { image })
    };

    try {
      await updateDoc(doc(db, 'users', user.uid, 'subjects', subjectId), {
        topics: [...subject.topics, newTopic]
      });
      addToast(`Topic ${title} added to ${subject.name}`, "success");
    } catch (e) {
      console.error("Failed to add topic", e);
    }
  };

  const handleEditTopic = async (subjectId: string, topicId: string, title: string, mastery: number, image?: string, resources?: Resource[]) => {
    if (!user) return;
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

    try {
      await updateDoc(doc(db, 'users', user.uid, 'subjects', subjectId), {
        topics: updatedTopics
      });
      addToast("Topic updated", "success");
    } catch (e) {
      console.error("Failed to edit topic", e);
    }
  };

  const handleUpdateResources = async (subjectId: string, topicId: string, resources: Resource[]) => {
    if (!user) return;
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => t.id === topicId ? { ...t, resources } : t);

    try {
      await updateDoc(doc(db, 'users', user.uid, 'subjects', subjectId), {
        topics: updatedTopics
      });
      addToast("Resources updated", "success");
    } catch (e) {
      console.error("Failed to update resources", e);
    }
  };

  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    if (!user) return;
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.filter(t => t.id !== topicId);

    try {
      await updateDoc(doc(db, 'users', user.uid, 'subjects', subjectId), {
        topics: updatedTopics
      });
      addToast("Topic deleted", "info");
    } catch (e) {
      console.error("Failed to delete topic", e);
    }
  };

  const handleResetSyllabus = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      subjects.forEach(s => {
        batch.delete(doc(db, 'users', user.uid, 'subjects', s.id));
      });
      INITIAL_SUBJECTS.forEach(s => {
        const id = Math.random().toString(36).substr(2, 9);
        batch.set(doc(db, 'users', user.uid, 'subjects', id), { ...s, id });
      });
      await batch.commit();
      addToast("Syllabus reset to default", "success");
    } catch (e) {
      console.error("Failed to reset syllabus", e);
    }
  };

  const handleResetProfile = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        points: 0,
        streak: 0,
        badges: INITIAL_BADGES,
        totalSessions: 0,
        totalStudyTime: 0
      });
      addToast("Profile reset to default", "success");
    } catch (e) {
      console.error("Failed to reset profile", e);
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
        onUpdateResources={handleUpdateResources}
        onResetSyllabus={handleResetSyllabus}
        onResetProfile={handleResetProfile}
        exams={exams}
        onAddExam={handleAddExam}
        onEditExam={handleEditExam}
        onDeleteExam={handleDeleteExam}
      />
    </motion.div>
  );
}
