import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Heart, Check, ArrowRight, UserCircle, BadgeCheck, Sparkles, Wind, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { SPOKANE_NEIGHBORHOODS, RECOVERY_NEEDS } from '../constants';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileOnboardingProps {
  user: { uid: string };
  profile: UserProfile;
  onComplete: () => void;
}

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ user, profile, onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(profile.neighborhood || '');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(profile.recoveryNeeds || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleNeed = (need: string) => {
    setSelectedNeeds(prev => 
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const handleFinish = async () => {
    if (!selectedNeighborhood || selectedNeeds.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        neighborhood: selectedNeighborhood,
        recoveryNeeds: selectedNeeds
      });
      onComplete();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0f172a] border border-slate-800 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
      >
        {/* PROGRESS BAR */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-800">
          <motion.div 
            className="h-full bg-blue-500" 
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 pt-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <MapPin className="text-blue-500" size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Your Spokane Hub</h2>
                  <p className="text-slate-400 text-sm font-medium">Connect with Spokane's local recovery scene. Which neighborhood do you call home?</p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {SPOKANE_NEIGHBORHOODS.map(n => (
                    <button
                      key={n}
                      onClick={() => setSelectedNeighborhood(n)}
                      className={`py-4 px-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${
                        selectedNeighborhood === n 
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40 scale-[1.05]' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-900/50 p-4 rounded-2xl border border-dashed border-slate-800 flex items-center gap-3">
                  <Wind size={18} className="text-blue-400 shrink-0" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight">Setting your home base helps us recommend nearby meetings and mentors in your area.</p>
                </div>
                
                <button
                  disabled={!selectedNeighborhood}
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 active:scale-95"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Heart className="text-emerald-500" size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Support Profile</h2>
                  <p className="text-slate-400 text-sm font-medium">What areas are you focusing on in your recovery? We'll prioritize resources and mentors that match your goals.</p>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {RECOVERY_NEEDS.map(need => (
                    <button
                      key={need}
                      onClick={() => toggleNeed(need)}
                      className={`py-4 px-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all ${
                        selectedNeeds.includes(need)
                          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-inner'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {need}
                      {selectedNeeds.includes(need) ? <BadgeCheck size={18} /> : <div className="w-4 h-4 rounded-full border border-slate-800" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={selectedNeeds.length === 0}
                    onClick={() => setStep(3)}
                    className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 animate-pulse">
                    <Sparkles className="text-blue-500" size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white italic tracking-tight uppercase leading-none">Ready for Day One</h2>
                  <p className="text-slate-400 text-sm font-medium">Your profile is configured. You can update this anytime.</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neighborhood</span>
                    <span className="text-sm font-bold text-blue-400">{selectedNeighborhood}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Priority Focus</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedNeeds.map(n => (
                        <span key={n} className="px-3 py-1 bg-slate-800 rounded-lg text-[9px] font-black text-slate-300 uppercase">{n}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-5 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Edit
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinish}
                    className="flex-[2] py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95"
                  >
                    {isSubmitting ? 'Finalizing...' : 'Enter App'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
