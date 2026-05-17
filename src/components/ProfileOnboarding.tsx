import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Heart, Check, ArrowRight, UserCircle } from 'lucide-react';
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-8 pt-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <UserCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Complete Your Profile</h2>
              <p className="text-slate-400 text-sm">Help us connect you to the Spokane community.</p>
            </div>
          </div>

          <div className="flex gap-2 mb-10">
            {[1, 2].map(i => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i ? 'bg-blue-500' : 'bg-slate-800'}`} 
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <MapPin size={16} /> Which neighborhood do you live in?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {SPOKANE_NEIGHBORHOODS.filter(n => n !== 'All').map(n => (
                      <button
                        key={n}
                        onClick={() => setSelectedNeighborhood(n)}
                        className={`py-4 px-4 rounded-2xl border text-sm font-medium transition-all ${
                          selectedNeighborhood === n 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-[1.02]' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  disabled={!selectedNeighborhood}
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-slate-100 hover:bg-white text-slate-900 rounded-3xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Next Step <ArrowRight size={20} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <Heart size={16} /> What are your recovery needs?
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {RECOVERY_NEEDS.map(need => (
                      <button
                        key={need}
                        onClick={() => toggleNeed(need)}
                        className={`py-3 px-4 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          selectedNeeds.includes(need)
                            ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {need}
                        {selectedNeeds.includes(need) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl font-bold transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={selectedNeeds.length === 0 || isSubmitting}
                    onClick={handleFinish}
                    className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-bold shadow-lg shadow-blue-900/40 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Finish Profile'}
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
