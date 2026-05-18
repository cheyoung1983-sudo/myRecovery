
import React, { useMemo } from 'react';
import { Sparkles, Trophy, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { MoodEntry, UserProfile, Sponsor } from '../types';
import { AIReflectionCard } from './AIReflectionCard';

interface RecoveryHubProps {
  daysSober: number;
  moodLogs: MoodEntry[];
  onLogMood: (mood: MoodEntry['mood'], note: string) => void;
  userProfile: UserProfile | null;
  topMatches: { sponsor: Sponsor; score: number }[];
  onSponsorClick: (sponsor: Sponsor) => void;
  currentUser: FirebaseUser | null;
  tab: string;
  handleAIMentorMatch: () => void;
}

export const RecoveryHub: React.FC<RecoveryHubProps> = ({ 
  daysSober, 
  moodLogs, 
  onLogMood,
  userProfile,
  topMatches,
  onSponsorClick,
  currentUser,
  tab,
  handleAIMentorMatch
}) => {
  const milestones = [
    { label: '24 Hours', days: 1, icon: '🌟' },
    { label: '1 Week', days: 7, icon: '🔥' },
    { label: '1 Month', days: 30, icon: '💎' },
    { label: '3 Months', days: 90, icon: '🏆' },
    { label: '6 Months', days: 180, icon: '🛡️' },
    { label: '1 Year', days: 365, icon: '👑' },
  ];

  const nextMilestone = milestones.find(m => daysSober < m.days) || milestones[milestones.length - 1];
  const prevMilestoneDays = milestones.filter(m => daysSober >= m.days).pop()?.days || 0;
  const progressToNext = ((daysSober - prevMilestoneDays) / (nextMilestone.days - prevMilestoneDays)) * 100;

  const streak = useMemo(() => {
    if (moodLogs.length === 0) return 0;
    const dates = new Set(moodLogs.map(log => {
      const date = log.timestamp && typeof log.timestamp === 'object' && 'toDate' in log.timestamp 
        ? (log.timestamp as any).toDate() 
        : new Date(log.timestamp);
      return date.toISOString().split('T')[0];
    }));
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    if (!dates.has(checkDate.toISOString().split('T')[0])) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (dates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return currentStreak;
  }, [moodLogs]);

  const points = userProfile?.points || 0;
  const rank = points >= 1000 ? 'Mentor' : points >= 500 ? 'Guide' : points >= 100 ? 'Contributor' : 'Newcomer';
  const rankColor = points >= 1000 ? 'text-amber-400' : points >= 500 ? 'text-blue-400' : points >= 100 ? 'text-emerald-400' : 'text-slate-400';

  return (
    <div className="space-y-8 pb-10">
      {userProfile && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800"
        >
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner relative">
            <Sparkles size={40} />
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[8px] font-black uppercase tracking-widest ${rankColor} shadow-xl`}>
              {rank}
            </div>
          </div>
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">
              Hey, {userProfile.name.split(' ')[0]}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Checking in from <span className="text-blue-400 font-bold">{userProfile.neighborhood}</span> today? 
              {userProfile.recoveryNeeds.length > 0 && (
                <> Focus: <span className="text-emerald-400 font-bold">{userProfile.recoveryNeeds[0]}</span></>
              )}
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <Trophy size={160} />
          </div>
          
          <div className="relative z-10">
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Recovery Journey</p>
            <div className="flex items-baseline justify-center gap-3">
              <span className="text-8xl font-black text-white tracking-tighter drop-shadow-xl">{daysSober}</span>
              <span className="text-3xl font-black text-blue-200 uppercase tracking-tighter italic">Days</span>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black text-blue-200 uppercase">Next Milestone: {nextMilestone.label}</span>
                <span className="text-[10px] font-black text-white">{Math.floor(progressToNext)}%</span>
              </div>
              <div className="h-4 bg-blue-900/40 rounded-full overflow-hidden p-1 border border-blue-400/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                />
              </div>
              <p className="text-[9px] text-blue-100 font-bold italic opacity-75">
                {nextMilestone.days - daysSober} days until you unlock {nextMilestone.icon} {nextMilestone.label}
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-blue-400/30 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[8px] text-blue-200 font-black uppercase tracking-widest whitespace-nowrap">Current Streak</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl font-black text-white">{streak}</span>
                <span className="text-[10px] font-bold text-orange-400 italic">🔥</span>
              </div>
            </div>
            <div className="text-center border-x border-blue-400/20 px-4">
              <p className="text-[8px] text-blue-200 font-black uppercase tracking-widest whitespace-nowrap">Total Wins</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl font-black text-white">{moodLogs.length}</span>
                <span className="text-[10px] font-bold text-emerald-400">🛡️</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-blue-200 font-black uppercase tracking-widest whitespace-nowrap">Community Points</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl font-black text-white">{userProfile?.points || 0}</span>
                <span className="text-[10px] font-bold text-amber-400">✨</span>
              </div>
            </div>
          </div>
        </div>

        {currentUser && (
          <AIReflectionCard userId={currentUser.uid} moodLogs={moodLogs} />
        )}
      </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} /> Achievement Tiers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Badges</p>
              <div className="flex flex-wrap gap-3">
                {userProfile?.badges && userProfile.badges.length > 0 ? (
                  userProfile.badges.map((badge, idx) => (
                    <div key={idx} className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                      <span className="text-lg">🏅</span>
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{badge}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600 font-bold italic">No badges yet. Attend meetings to earn them!</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank Progression</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                  <span>Newcomer</span>
                  <span>Contributor (100)</span>
                  <span>Guide (500)</span>
                  <span>Mentor (1000)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((points / 1000) * 100, 100)}%` }}
                    className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-bold italic">
                  {points < 100 ? `${100 - points} points to Contributor` : 
                   points < 500 ? `${500 - points} points to Guide` :
                   points < 1000 ? `${1000 - points} points to Mentor` :
                   "Maximum Rank Reached!"}
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
