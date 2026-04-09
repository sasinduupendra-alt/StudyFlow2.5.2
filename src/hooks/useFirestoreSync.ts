import { useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAppStore } from '../store/useAppStore';
import { 
  INITIAL_SUBJECTS, 
  WEEKLY_BASE_SCHEDULE, 
  INITIAL_BADGES 
} from '../constants';
import { UserProfile, Subject, WeeklySchedule, StudyLog, ExamRecord } from '../types';

export function useFirestoreSync() {
  const { 
    user, 
    setUserProfile, 
    setSubjects, 
    setSchedule, 
    setStudyLogs, 
    setExams,
    subjects,
    schedule,
    userProfile,
    studyLogs,
    exams
  } = useAppStore();

  useEffect(() => {
    // Skip sync for anonymous users to keep it "Local Only" as promised
    if (!user) return;

    const userId = user.uid;

    // 1. Sync User Profile
    const profileRef = doc(db, 'users', userId);
    const unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<UserProfile>;
        setUserProfile({
          ...data,
          level: data.level || 1,
          xp: data.xp || 0,
          xpToNextLevel: data.xpToNextLevel || 1000,
        } as UserProfile);
      } else {
        // Initialize cloud with current local profile
        await setDoc(profileRef, userProfile);
      }
    });

    // 2. Sync Subjects
    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const unsubscribeSubjects = onSnapshot(subjectsRef, async (querySnap) => {
      if (!querySnap.empty) {
        const subjectsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
        setSubjects(subjectsData);
      } else {
        // Initialize cloud with current local subjects
        for (const subject of subjects) {
          await setDoc(doc(db, 'users', userId, 'subjects', subject.id), subject);
        }
      }
    });

    // 3. Sync Schedule
    const scheduleRef = doc(db, 'users', userId, 'config', 'schedule');
    const unsubscribeSchedule = onSnapshot(scheduleRef, async (docSnap) => {
      if (docSnap.exists()) {
        setSchedule(docSnap.data() as WeeklySchedule);
      } else {
        // Initialize cloud with current local schedule
        await setDoc(scheduleRef, schedule);
      }
    });

    // 4. Sync Study Logs
    const logsRef = collection(db, 'users', userId, 'study_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(logsQuery, async (querySnap) => {
      if (!querySnap.empty) {
        const logsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyLog));
        setStudyLogs(logsData);
      } else {
        // Initialize cloud with current local logs
        for (const log of studyLogs) {
          await setDoc(doc(db, 'users', userId, 'study_logs', log.id), log);
        }
      }
    });

    // 5. Sync Exams
    const examsRef = collection(db, 'users', userId, 'exams');
    const examsQuery = query(examsRef, orderBy('date', 'desc'));
    const unsubscribeExams = onSnapshot(examsQuery, async (querySnap) => {
      if (!querySnap.empty) {
        const examsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamRecord));
        setExams(examsData);
      } else {
        // Initialize cloud with current local exams
        for (const exam of exams) {
          await setDoc(doc(db, 'users', userId, 'exams', exam.id), exam);
        }
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSubjects();
      unsubscribeSchedule();
      unsubscribeLogs();
      unsubscribeExams();
    };
  }, [user, setUserProfile, setSubjects, setSchedule, setStudyLogs, setExams, subjects, schedule, userProfile, studyLogs, exams]);
}
