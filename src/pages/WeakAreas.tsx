import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import AIInsights from '../components/AIInsights';
import { supabase } from '../lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { getAI } from '../services/gemini';

export default function WeakAreas() {
  const { recommendations, subjects, user, addToast, setRecommendations } = useAppStore();

  const handleLikeRecommendation = async (id: string) => {
    const newRecs = recommendations.map(r => r.id === id ? { ...r, liked: !r.liked } : r);
    setRecommendations(newRecs);

    if (user) {
      try {
        await supabase
          .from('recommendations')
          .update({ liked: !recommendations.find(r => r.id === id)?.liked })
          .eq('id', id)
          .eq('user_id', user.id);
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
        await supabase
          .from('recommendations')
          .update({ dismissed: true })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (e) {
        console.error("Failed to dismiss recommendation in cloud", e);
      }
    }
  };

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze this A/L student's study data and provide 2-3 actionable recommendations. 
      Subjects: ${JSON.stringify(subjects.map(s => ({ name: s.name, readiness: s.readiness, weakCount: s.weakCount })))}
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
        const recsToInsert = newRecs.map((rec: any) => ({
          ...rec,
          user_id: user.id
        }));
        await supabase.from('recommendations').insert(recsToInsert);
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
