import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import AIInsights from '../components/AIInsights';
import { db } from '../firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useMutation } from '@tanstack/react-query';
import { getAI } from '../services/gemini';

export default function WeakAreas() {
  const { recommendations, subjects, user, addToast, setRecommendations } = useAppStore();

  const handleLikeRecommendation = async (id: string) => {
    const newRecs = recommendations.map(r => r.id === id ? { ...r, liked: !r.liked } : r);
    setRecommendations(newRecs);

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'recommendations', id), { liked: !recommendations.find(r => r.id === id)?.liked });
      } catch (e) {
        console.error("Failed to like recommendation in cloud", e);
      }
    }
  };

  const handleDismissRecommendation = async (id: string) => {
    const newRecs = recommendations.map(r => r.id === id ? { ...r, dismissed: true } : r);
    setRecommendations(newRecs);

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'recommendations', id), { dismissed: true });
      } catch (e) {
        console.error("Failed to dismiss recommendation in cloud", e);
      }
    }
  };

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze this A/L student's study data and provide 2-3 actionable recommendations. 
      Subjects: ${JSON.stringify(subjects.map(s => ({ name: s.name, readiness: s.readiness, weakCount: s.weakCount })))}
      
      IMPORTANT DIRECTIVES:
      Base your recommendations on these high-signal strategies:
      1. The Syllabus Audit: Use the official NIE syllabus. 1 check = theory covered, 2 checks = 5+ years past papers done.
      2. The Blurt Method: Active recall on a blank sheet, correct with red pen.
      3. Spaced Repetition (2-3-5-7 Rule): Day 1 (Summarize), Day 3 (Answer from memory), Day 5 (3 past paper MCQs), Day 7 (Feynman Technique).
      4. Combined Maths (Ruwan Darshana): 04:30-06:30 Deep Work for his homework. Post-tuition: re-do 3 hardest problems without looking at steps.
      5. Physics (Anuradha Perera): Prioritize his Unit-wise Questions during 06:45-08:45 blocks.
      6. Chemistry (Amila Dasanayake): Post-tuition: first 30 mins for Active Recall. Mid-day: ECHEM theory Tutes. Saturday 14:45: timed MCQ practice.

      Return a JSON array of objects with fields: id, title, description, priority (High/Medium/Low), reason.`;

      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const newRecsFromAI = JSON.parse(result.text || "[]");
      const newRecs = newRecsFromAI.map((rec: any) => ({
        ...rec,
        id: Math.random().toString(36).substr(2, 9),
        liked: false,
        dismissed: false
      }));

      setRecommendations([...recommendations, ...newRecs]);
      
      if (user) {
        const batch = writeBatch(db);
        newRecs.forEach((rec: any) => {
          const recRef = doc(db, 'users', user.uid, 'recommendations', rec.id);
          batch.set(recRef, rec);
        });
        await batch.commit();
      }
      return newRecs;
    },
    onSuccess: () => {
      addToast("New AI recommendations generated!", "success");
    },
    onError: (error) => {
      console.error("AI Analysis failed:", error);
      addToast("AI analysis failed. Please try again later.", "error");
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Weak Areas & AI Insights</h1>
            <p className="text-gray-400">Actionable recommendations based on your study patterns.</p>
          </div>
          <button 
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending}
            className="px-6 py-3 bg-[#1DB954] text-black rounded-full font-bold hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {analysisMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : 'Refresh Insights'}
          </button>
        </div>
        <AIInsights 
          recommendations={recommendations} 
          onLike={handleLikeRecommendation} 
          onDismiss={handleDismissRecommendation} 
          isLoading={analysisMutation.isPending} 
        />
      </div>
    </motion.div>
  );
}
