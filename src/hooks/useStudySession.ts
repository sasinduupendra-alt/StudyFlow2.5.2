import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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

    // If logged in and not found locally (or to get real-time updates), use Supabase
    const fetchSession = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('study_logs')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;
        setSession(data as StudyLog);
      } catch (err) {
        console.error('Error fetching study session:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Real-time subscription
    const subscription = supabase
      .channel(`study_log_${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'study_logs', 
        filter: `id=eq.${sessionId}` 
      }, (payload) => {
        if (payload.new) {
          setSession(payload.new as StudyLog);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, sessionId]);

  return { session, loading, error };
}
