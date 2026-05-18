
import React from 'react';
import { Trophy, Award, Star, Shield, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chip {
  label: string;
  days: number;
  color: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

interface ChipCaseProps {
  daysSober: number;
}

export const ChipCase: React.FC<ChipCaseProps> = ({ daysSober }) => {
  const chips: Chip[] = [
    { label: '24 Hours', days: 1, color: 'bg-slate-100', icon: <Star className="text-slate-800" />, unlocked: daysSober >= 1 },
    { label: '1 Month', days: 30, color: 'bg-rose-600', icon: <Heart className="text-white" />, unlocked: daysSober >= 30 },
    { label: '3 Months', days: 90, color: 'bg-emerald-600', icon: <Shield className="text-white" />, unlocked: daysSober >= 90 },
    { label: '6 Months', days: 180, color: 'bg-blue-600', icon: <Award className="text-white" />, unlocked: daysSober >= 180 },
    { label: '1 Year', days: 365, color: 'bg-amber-500', icon: <Trophy className="text-white" />, unlocked: daysSober >= 365 },
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Recovery Chip Case</h3>
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Your Milestones</span>
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        {chips.map((chip) => (
          <div key={chip.label} className="flex flex-col items-center gap-3">
            <motion.div 
              initial={false}
              animate={{ 
                scale: chip.unlocked ? 1 : 0.8,
                opacity: chip.unlocked ? 1 : 0.4,
                filter: chip.unlocked ? 'grayscale(0)' : 'grayscale(1)'
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl relative ${chip.unlocked ? chip.color : 'bg-slate-800 border-2 border-dashed border-slate-700'}`}
            >
              {React.cloneElement(chip.icon as React.ReactElement, { size: 32 })}
              {chip.unlocked && (
                <div className="absolute inset-0 rounded-full bg-white/10" />
              )}
              {chip.unlocked && (
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-white/20 rounded-full border-t-transparent"
                />
              )}
            </motion.div>
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${chip.unlocked ? 'text-white' : 'text-slate-600'}`}>{chip.label}</p>
              {!chip.unlocked && (
                <p className="text-[8px] text-slate-700 font-bold uppercase">{chip.days - daysSober} days left</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
