
import React, { useState } from 'react';
import { Eye, Fingerprint, Volume2, Flower2, Coffee, Wind } from 'lucide-react';
import { motion } from 'motion/react';

export const GroundingTool: React.FC = () => {
  const [step, setStep] = useState(0);
  const groundingSteps = [
    { label: "Look: 5 things you can see", icon: <Eye className="text-blue-400" /> },
    { label: "Touch: 4 things you can feel", icon: <Fingerprint className="text-emerald-400" /> },
    { label: "Hear: 3 things you can hear", icon: <Volume2 className="text-purple-400" /> },
    { label: "Smell: 2 things you can smell", icon: <Flower2 className="text-pink-400" /> },
    { label: "Taste: 1 thing you can taste", icon: <Coffee className="text-amber-400" /> },
  ];

  return (
    <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 shadow-xl">
      <div className="text-center mb-8">
        <Wind className="mx-auto text-blue-400 mb-4 animate-pulse" size={48} />
        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Feeling Overwhelmed?</h2>
        <p className="text-slate-400 text-sm">Let's stay present together.</p>
      </div>
      
      <div className="flex flex-col items-center text-center">
        <motion.div 
          key={step}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 p-8 bg-slate-900 rounded-full"
        >
          {groundingSteps[step].icon}
        </motion.div>
        <motion.p 
          key={groundingSteps[step].label}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-medium mb-10 text-slate-100"
        >
          {groundingSteps[step].label}
        </motion.p>
        
        <button 
          onClick={() => setStep((prev) => (prev + 1) % 5)}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-white shadow-lg shadow-blue-900/30 transition-all active:scale-95"
        >
          {step === 4 ? "Restart Exercise" : "Next Step"}
        </button>
      </div>
    </div>
  );
};
