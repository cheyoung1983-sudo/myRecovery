
import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Sponsor } from '../types';

interface WarmHandshakeModalProps {
  sponsor: Sponsor;
  onClose: () => void;
  onStartChat: (text: string) => void;
}

export const WarmHandshakeModal: React.FC<WarmHandshakeModalProps> = ({ sponsor, onClose, onStartChat }) => {
  const templates = [
    { id: 'crisis', label: 'Crisis Support', text: `I'm feeling a trigger and saw you specialize in ${sponsor.specialties[0]}. Can we talk?` },
    { id: 'intro', label: 'Intro Request', text: `I'm new to myRecovery and looking for a guide who understands ${sponsor.specialties[1] || sponsor.specialties[0]}.` },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1e293b] w-full max-w-md rounded-3xl p-8 border border-slate-700 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">Message {sponsor.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={20}/></button>
        </div>
        
        <p className="text-slate-400 mb-6 text-sm flex items-center gap-2">
          <ShieldAlert size={14} className="text-blue-400"/>
          Choose a pre-filled template to start securely.
        </p>

        <div className="space-y-4">
          {templates.map(t => (
            <button 
              key={t.id}
              className="w-full text-left p-6 bg-slate-800 hover:bg-slate-750 rounded-2xl border border-slate-700 transition-all hover:border-blue-500/50 shadow-sm"
              onClick={() => {
                onStartChat(t.text);
              }}
            >
              <span className="block font-black text-blue-400 mb-1.5 uppercase tracking-widest text-[10px]">{t.label}</span>
              <span className="text-sm italic text-slate-300 leading-relaxed font-medium">"{t.text}"</span>
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">End-to-End Encrypted Communication</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
