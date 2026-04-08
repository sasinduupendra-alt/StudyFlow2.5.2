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
    addToast
  } = useAppStore();

  useEffect(() => {
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
        // Initialize new user profile
        const newProfile: UserProfile = {
          points: 0,
          streak: 0,
          level: 1,
          xp: 0,
          xpToNextLevel: 1000,
          badges: INITIAL_BADGES,
          totalSessions: 0,
          totalStudyTime: 0
        };
        await setDoc(profileRef, newProfile);
        setUserProfile(newProfile);
      }
    });

    // 2. Sync Subjects
    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const unsubscribeSubjects = onSnapshot(subjectsRef, async (querySnap) => {
      if (!querySnap.empty) {
        const subjectsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
        setSubjects(subjectsData);
      } else {
        // Initialize with default subjects if none exist
        for (const subject of INITIAL_SUBJECTS) {
          await setDoc(doc(db, 'users', userId, 'subjects', subject.id), subject);
        }
        setSubjects(INITIAL_SUBJECTS);
      }
    });

    // 3. Sync Schedule
    const scheduleRef = doc(db, 'users', userId, 'config', 'schedule');
    const unsubscribeSchedule = onSnapshot(scheduleRef, async (docSnap) => {
      if (docSnap.exists()) {
        setSchedule(docSnap.data() as WeeklySchedule);
      } else {
        // Initialize with default schedule
        await setDoc(scheduleRef, WEEKLY_BASE_SCHEDULE);
        setSchedule(WEEKLY_BASE_SCHEDULE);
      }
    });

    // 4. Sync Study Logs (limit to recent 50 for performance)
    const logsRef = collection(db, 'users', userId, 'study_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(logsQuery, (querySnap) => {
      const logsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyLog));
      setStudyLogs(logsData);
    });

    // 5. Sync Exams
    const examsRef = collection(db, 'users', userId, 'exams');
    const examsQuery = query(examsRef, orderBy('date', 'desc'));
    const unsubscribeExams = onSnapshot(examsQuery, (querySnap) => {
      const examsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamRecord));
      setExams(examsData);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSubjects();
      unsubscribeSchedule();
      unsubscribeLogs();
      unsubscribeExams();
    };
  }, [user, setUserProfile, setSubjects, setSchedule, setStudyLogs, setExams]);
}
