import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { StudyLog } from '../types';
import { useAppStore } from '../store/useAppStore';

export function useStudySession(sessionId: string | undefined) {
  const [session, setSession] = useState<StudyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, studyLogs } = useAppStore();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // First check local store (works for guests and recently synced logs)
    const localSession = studyLogs.find(log => log.id === sessionId);
    if (localSession) {
      setSession(localSession);
      setLoading(false);
      // If we found it locally, we still might want to listen for updates if logged in
      if (!user) return;
    }

    if (!user) {
      if (!localSession) {
        setSession(null);
        setLoading(false);
      }
      return;
    }

    // If logged in and not found locally (or to get real-time updates), use Firestore
    const sessionRef = doc(db, 'users', user.uid, 'study_logs', sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSession(docSnap.data() as StudyLog);
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to study session:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, sessionId]);

  return { session, loading, error };
}
