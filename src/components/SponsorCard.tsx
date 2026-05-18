
import React, { useState } from 'react';
import { BadgeCheck, Heart, MessageCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sponsor } from '../types';
import { MentorReviews } from './MentorReviews';

interface SponsorCardProps {
  sponsor: Sponsor;
  onReachOut: (s: Sponsor) => void;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({ sponsor, onReachOut }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/40 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Heart size={80} />
      </div>
      <div className="flex items-center gap-4 mb-5 relative z-1">
        <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center font-bold text-blue-400 text-2xl shadow-inner">
          {sponsor.name[0]}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
            {sponsor.name} 
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-blue-400 font-medium">{sponsor.years} Years Sober</p>
            {sponsor.isVerified && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600/10 border border-blue-500/20 rounded-md text-[9px] font-black uppercase tracking-widest text-blue-400">
                <BadgeCheck size={10} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-5 leading-relaxed italic">"{sponsor.bio}"</p>
      <div className="flex flex-wrap gap-2 mb-8 lowercase">
        {sponsor.specialties.map(tag => (
          <span key={tag} className="text-[10px] font-semibold bg-slate-900 border border-slate-700/50 px-2.5 py-1 rounded-full text-slate-300">#{tag}</span>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => onReachOut(sponsor)}
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          <MessageCircle size={20} /> Reach Out
        </button>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-6 py-4 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold transition-all"
        >
           {isExpanded ? <ChevronRight className="rotate-90 transition-transform" /> : <ChevronRight className="transition-transform" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-6 pt-6 border-t border-slate-800"
          >
            <MentorReviews mentorId={sponsor.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
