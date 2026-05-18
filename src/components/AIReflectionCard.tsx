
import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { AIReflection, MoodEntry } from '../types';
import { Sparkles, Brain, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIReflectionCardProps {
  userId: string;
  moodLogs: MoodEntry[];
}

export const AIReflectionCard: React.FC<AIReflectionCardProps> = ({ userId, moodLogs }) => {
  const [reflection, setReflection] = useState<AIReflection | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'users', userId, 'aiReflections'),
      orderBy('generatedAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setReflection({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AIReflection);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'aiReflections');
    });

    return () => unsubscribe();
  }, [userId]);

  const generateNewReflection = async () => {
    if (moodLogs.length === 0) return;
    setGenerating(true);

    try {
      const response = await fetch('/api/ai/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodLogs: moodLogs.slice(0, 10) })
      });

      if (!response.ok) throw new Error('AI generation failed');
      
      const data = await response.json();
      
      await addDoc(collection(db, 'users', userId, 'aiReflections'), {
        userId,
        reflection: data.reflection,
        generatedAt: serverTimestamp(),
        moodDataSummary: `Based on ${moodLogs.length} recent logs`
      });

      // Award points for generating a reflection
      await updateDoc(doc(db, 'users', userId), {
        points: increment(20)
      });
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] relative overflow-hidden group shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-6 transition-transform">
        <Brain size={120} />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
            <Sparkles size={28} />
          </div>
          <button 
            onClick={generateNewReflection}
            disabled={generating || moodLogs.length === 0}
            className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl transition-all active:rotate-180 disabled:opacity-30"
          >
            <RefreshCw size={20} className={generating ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tight">AI Recovery Reflection</h3>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Weekly Strength Summary</p>
        </div>

        <AnimatePresence mode="wait">
          {reflection ? (
            <motion.div
              key={reflection.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-4"
            >
              <p className="text-slate-300 text-sm leading-relaxed italic font-medium">
                "{reflection.reflection}"
              </p>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  Updated {new Date(reflection.generatedAt?.toMillis?.() || Date.now()).toLocaleDateString()}
                </span>
                <span className="text-[9px] font-black text-blue-500 uppercase flex items-center gap-1">
                  View Insights <ChevronRight size={10} />
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="py-6 text-center space-y-4">
              <p className="text-xs text-slate-500 font-bold italic">
                {moodLogs.length === 0 
                  ? "Log your first mood to unlock AI insights." 
                  : "Ready for your weekly strength reflection?"}
              </p>
              {moodLogs.length > 0 && (
                <button 
                  onClick={generateNewReflection}
                  className="px-6 py-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                >
                  Generate First Insight
                </button>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
