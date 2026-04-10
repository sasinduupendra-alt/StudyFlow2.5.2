import React, { useCallback } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import SyllabusTracker from '../components/SyllabusTracker';
import WeeklyTaskChecklist from '../components/WeeklyTaskChecklist';
import { supabase } from '../lib/supabase';

export default function Syllabus() {
  const { subjects, user, userProfile, highlightedSubjectId, setSubjects, setUserProfile } = useAppStore();

  const handleUpdateMastery = useCallback(async (subjectId: string, topicId: string, mastery: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => t.id === topicId ? { ...t, mastery } : t);
    const updatedSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: updatedTopics } : s);

    // Update local store immediately
    setSubjects(updatedSubjects);

    // Check badges
    const updatedBadges = userProfile.badges.map(badge => {
      if (badge.unlockedAt) return badge;

      let unlocked = false;
      if (badge.type === 'mastery') {
        const mathsTopics = updatedSubjects.find(s => s.id === 'maths')?.topics || [];
        const physicsTopics = updatedSubjects.find(s => s.id === 'physics')?.topics || [];
        const chemistryTopics = updatedSubjects.find(s => s.id === 'chemistry')?.topics || [];
        
        if (badge.id === 'b3') unlocked = mathsTopics.filter(t => t.mastery >= 80).length >= badge.requirement;
        if (badge.id === 'b4') unlocked = physicsTopics.filter(t => t.mastery >= 80).length >= badge.requirement;
        if (badge.id === 'b5') unlocked = chemistryTopics.filter(t => t.mastery >= 80).length >= badge.requirement;
      }

      if (unlocked) {
        return { ...badge, unlockedAt: new Date().toISOString() };
      }
      return badge;
    });

    setUserProfile({ ...userProfile, badges: updatedBadges });

    // Update Supabase if logged in (and not anonymous)
    if (user) {
      try {
        await supabase
          .from('subjects')
          .update({ topics: updatedTopics })
          .eq('id', subjectId)
          .eq('user_id', user.id);
        
        await supabase
          .from('users')
          .update({ badges: updatedBadges })
          .eq('id', user.id);
      } catch (e) {
        console.error("Failed to update mastery in cloud", e);
      }
    }
  }, [user, subjects, userProfile, setSubjects, setUserProfile]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <WeeklyTaskChecklist />
      <SyllabusTracker 
        subjects={subjects} 
        onUpdateMastery={handleUpdateMastery} 
        highlightedSubjectId={highlightedSubjectId || undefined}
      />
    </motion.div>
  );
}
