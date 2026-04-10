import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { Subject, WeeklySchedule, StudyLog, ExamRecord, UserProfile } from '../types';

export function useSupabaseSync() {
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
    if (!user) return;

    const userId = user.id;

    const fetchData = async () => {
      // 1. Sync User Profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setUserProfile(profileData as UserProfile);
      } else {
        await supabase.from('users').upsert({ id: userId, ...userProfile });
      }

      // 2. Sync Subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId);

      if (subjectsData && subjectsData.length > 0) {
        setSubjects(subjectsData as Subject[]);
      } else {
        const subjectsToInsert = subjects.map(s => ({ ...s, user_id: userId }));
        await supabase.from('subjects').upsert(subjectsToInsert);
      }

      // 3. Sync Schedule
      const { data: scheduleData } = await supabase
        .from('config')
        .select('data')
        .eq('user_id', userId)
        .eq('key', 'schedule')
        .single();

      if (scheduleData) {
        setSchedule(scheduleData.data as WeeklySchedule);
      } else {
        await supabase.from('config').upsert({ user_id: userId, key: 'schedule', data: schedule });
      }

      // 4. Sync Study Logs
      const { data: logsData } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (logsData && logsData.length > 0) {
        setStudyLogs(logsData as StudyLog[]);
      } else {
        const logsToInsert = studyLogs.map(l => ({ ...l, user_id: userId }));
        if (logsToInsert.length > 0) {
          await supabase.from('study_logs').upsert(logsToInsert);
        }
      }

      // 5. Sync Exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (examsData && examsData.length > 0) {
        setExams(examsData as ExamRecord[]);
      } else {
        const examsToInsert = exams.map(e => ({ ...e, user_id: userId }));
        if (examsToInsert.length > 0) {
          await supabase.from('exams').upsert(examsToInsert);
        }
      }
    };

    fetchData();

    // Set up real-time subscriptions if needed
    const subjectsSubscription = supabase
      .channel('subjects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects', filter: `user_id=eq.${userId}` }, (payload) => {
        // Handle real-time updates here if desired
        console.log('Real-time subject change:', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subjectsSubscription);
    };
  }, [user]); // Only re-run when user changes
}
