import { useEffect, useRef } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAppStore } from '../store/useAppStore';
import { 
  UserProfile, 
  Subject, 
  WeeklySchedule, 
  StudyLog, 
  ExamRecord,
  Task
} from '../types';

export function useFirestoreSync() {
  const { 
    user, 
    setUserProfile, 
    setSubjects, 
    setSchedule, 
    setStudyLogs, 
    setExams,
    setTasks,
    subjects,
    schedule,
    userProfile,
    studyLogs,
    exams,
    tasks
  } = useAppStore();

  // Use refs to store the initial local data for cloud initialization
  // This avoids the infinite loop caused by depending on the state itself
  const initialDataRef = useRef({
    subjects,
    schedule,
    userProfile,
    studyLogs,
    exams,
    tasks
  });

  useEffect(() => {
    // Skip sync for anonymous users to keep it "Local Only"
    if (!user) return;

    const userId = user.uid;
    const initial = initialDataRef.current;

    // 1. Sync User Profile
    const profileRef = doc(db, 'users', userId);
    const unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
      try {
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
          await setDoc(profileRef, initial.userProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    });

    // 2. Sync Subjects
    const subjectsPath = `users/${userId}/subjects`;
    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const unsubscribeSubjects = onSnapshot(subjectsRef, async (querySnap) => {
      try {
        if (!querySnap.empty) {
          const subjectsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
          setSubjects(subjectsData);
        } else {
          // Initialize cloud with current local subjects
          for (const subject of initial.subjects) {
            await setDoc(doc(db, 'users', userId, 'subjects', subject.id), subject);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, subjectsPath);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, subjectsPath);
    });

    // 3. Sync Schedule
    const schedulePath = `users/${userId}/config/schedule`;
    const scheduleRef = doc(db, 'users', userId, 'config', 'schedule');
    const unsubscribeSchedule = onSnapshot(scheduleRef, async (docSnap) => {
      try {
        if (docSnap.exists()) {
          setSchedule(docSnap.data() as WeeklySchedule);
        } else {
          // Initialize cloud with current local schedule
          await setDoc(scheduleRef, initial.schedule);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, schedulePath);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, schedulePath);
    });

    // 4. Sync Study Logs
    const logsPath = `users/${userId}/study_logs`;
    const logsRef = collection(db, 'users', userId, 'study_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(logsQuery, async (querySnap) => {
      try {
        if (!querySnap.empty) {
          const logsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyLog));
          setStudyLogs(logsData);
        } else {
          // Initialize cloud with current local logs
          for (const log of initial.studyLogs) {
            await setDoc(doc(db, 'users', userId, 'study_logs', log.id), log);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, logsPath);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, logsPath);
    });

    // 5. Sync Exams
    const examsPath = `users/${userId}/exams`;
    const examsRef = collection(db, 'users', userId, 'exams');
    const examsQuery = query(examsRef, orderBy('date', 'desc'));
    const unsubscribeExams = onSnapshot(examsQuery, async (querySnap) => {
      try {
        if (!querySnap.empty) {
          const examsData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamRecord));
          setExams(examsData);
        } else {
          // Initialize cloud with current local exams
          for (const exam of initial.exams) {
            await setDoc(doc(db, 'users', userId, 'exams', exam.id), exam);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, examsPath);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, examsPath);
    });

    // 6. Sync Tasks
    const tasksPath = `users/${userId}/tasks`;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const unsubscribeTasks = onSnapshot(tasksRef, async (querySnap) => {
      try {
        if (!querySnap.empty) {
          const tasksData = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
          setTasks(tasksData);
        } else {
          // Initialize cloud with current local tasks
          for (const task of initial.tasks) {
            await setDoc(doc(db, 'users', userId, 'tasks', task.id), task);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, tasksPath);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, tasksPath);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSubjects();
      unsubscribeSchedule();
      unsubscribeLogs();
      unsubscribeExams();
      unsubscribeTasks();
    };
  }, [user?.uid, setUserProfile, setSubjects, setSchedule, setStudyLogs, setExams, setTasks]);
}
