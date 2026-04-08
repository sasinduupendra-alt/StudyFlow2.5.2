import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { StudyLog } from '../types';
import { useAppStore } from '../store/useAppStore';

export function useStudySession(sessionId: string | undefined) {
  const [session, setSession] = useState<StudyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAppStore();

  useEffect(() => {
    if (!user || !sessionId) {
      setLoading(false);
      return;
    }

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
