
import React, { useMemo } from 'react';
import { Sparkles, Trophy, Heart, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { MoodEntry, UserProfile, Sponsor } from '../types';
import { AIReflectionCard } from './AIReflectionCard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface RecoveryHubProps {
  daysSober: number;
  moodLogs: MoodEntry[];
  streak: number;
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
  streak,
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

  const points = userProfile?.points || 0;
  const rank = points >= 1000 ? 'Mentor' : points >= 500 ? 'Guide' : points >= 100 ? 'Contributor' : 'Newcomer';
  const rankColor = points >= 1000 ? 'text-amber-400' : points >= 500 ? 'text-blue-400' : points >= 100 ? 'text-emerald-400' : 'text-slate-400';

  // Mood scoring map and 30-day datasets
  const moodScoreMap: Record<MoodEntry['mood'], number> = useMemo(() => ({
    great: 5,
    good: 4,
    okay: 3,
    struggling: 2,
    crisis: 1
  }), []);

  const moodChartData = useMemo(() => {
    const dataMap: { [key: string]: { sum: number; count: number; notes: string[] } } = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Sort oldest to layout chronologically
    const sortedLogs = [...moodLogs].sort((a, b) => {
      const getMs = (item: any) => {
        if (!item || !item.timestamp) return 0;
        if (typeof item.timestamp === 'object' && 'toMillis' in item.timestamp) {
          return item.timestamp.toMillis();
        }
        if (typeof item.timestamp === 'object' && 'seconds' in item.timestamp) {
          return item.timestamp.seconds * 1000;
        }
        return new Date(item.timestamp).getTime();
      };
      return getMs(a) - getMs(b);
    });

    sortedLogs.forEach(log => {
      if (!log.timestamp) return;
      const dateObj = log.timestamp && typeof log.timestamp === 'object' && 'toDate' in log.timestamp 
        ? (log.timestamp as any).toDate() 
        : new Date(log.timestamp);
      
      if (dateObj < thirtyDaysAgo) return;

      const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const score = moodScoreMap[log.mood] || 3;

      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { sum: 0, count: 0, notes: [] };
      }
      dataMap[dateStr].sum += score;
      dataMap[dateStr].count += 1;
      if (log.note && log.note.trim()) {
        dataMap[dateStr].notes.push(log.note.trim());
      }
    });

    const chartData = [];
    const tempDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(tempDate.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayData = dataMap[dateStr];
      
      chartData.push({
        date: dateStr,
        moodScore: dayData ? Math.round((dayData.sum / dayData.count) * 10) / 10 : null,
        count: dayData ? dayData.count : 0,
        notes: dayData ? dayData.notes.join('; ') : ''
      });
    }

    return chartData;
  }, [moodLogs, moodScoreMap]);

  const moodMetrics = useMemo(() => {
    let sum = 0;
    let count = 0;
    const moodCounts: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    moodLogs.forEach(log => {
      if (!log.timestamp) return;
      const dateObj = log.timestamp && typeof log.timestamp === 'object' && 'toDate' in log.timestamp 
        ? (log.timestamp as any).toDate() 
        : new Date(log.timestamp);
      
      if (dateObj >= thirtyDaysAgo) {
        const score = moodScoreMap[log.mood] || 3;
        sum += score;
        count += 1;
        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
      }
    });

    let topMood = 'N/A';
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([m, c]) => {
      if (c > maxCount) {
        maxCount = c;
        topMood = m;
      }
    });

    return {
      average: count > 0 ? (sum / count).toFixed(1) : 'N/A',
      totalLogs: count,
      topMood: topMood !== 'N/A' ? topMood.charAt(0).toUpperCase() + topMood.slice(1) : 'N/A'
    };
  }, [moodLogs, moodScoreMap]);

  // Premium custom tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const score = data.moodScore;
      if (score === null) return null;

      let labelStr = 'Okay';
      let labelColor = 'text-blue-400';
      if (score >= 4.5) { labelStr = 'Great 😊'; labelColor = 'text-emerald-400'; }
      else if (score >= 3.5) { labelStr = 'Good 🙂'; labelColor = 'text-teal-400'; }
      else if (score >= 2.5) { labelStr = 'Okay 😐'; labelColor = 'text-blue-400'; }
      else if (score >= 1.5) { labelStr = 'Struggling 🙁'; labelColor = 'text-orange-400'; }
      else { labelStr = 'Crisis 😢'; labelColor = 'text-red-400'; }

      return (
        <div className="bg-slate-950/95 border border-slate-800 backdrop-blur-md rounded-2xl p-4 shadow-2xl space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{data.date}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Average:</span>
            <span className={`text-xs font-black uppercase tracking-wider ${labelColor}`}>{labelStr} ({score})</span>
          </div>
          {data.count > 1 && (
            <p className="text-[10px] text-slate-400 font-medium">({data.count} check-ins)</p>
          )}
          {data.notes && (
            <p className="text-[10px] text-slate-500 italic max-w-[200px] line-clamp-3 mt-1">"{data.notes}"</p>
          )}
        </div>
      );
    }
    return null;
  };

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

      {/* Mood Trends Chart Panel */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1">
              <Activity size={12} /> Analytics
            </span>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" /> 30-Day Mood Trends
            </h2>
            <p className="text-slate-400 text-xs">A comprehensive premium visualization of your sobriety emotional check-ins</p>
          </div>

          {/* Metrics summary cards */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-2xl">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">30D Avg Mood</span>
              <span className="text-sm font-black text-blue-400">{moodMetrics.average}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-2xl">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Common Vibe</span>
              <span className="text-sm font-black text-emerald-400">{moodMetrics.topMood}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-2xl">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Total Check-ins</span>
              <span className="text-sm font-black text-amber-500">{moodMetrics.totalLogs}</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full bg-slate-950/30 rounded-2xl border border-slate-900/40 p-4 relative overflow-hidden">
          {moodMetrics.totalLogs > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  domain={[1, 5]} 
                  ticks={[1, 2, 3, 4, 5]} 
                  tickFormatter={(val) => {
                    const labels: Record<number, string> = { 1: '😢', 2: '🙁', 3: '😐', 4: '🙂', 5: '😊' };
                    return labels[val] || '';
                  }}
                  stroke="#475569" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false} 
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="moodScore" 
                  connectNulls={true}
                  stroke="#3b82f6" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorMood)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No mood logs registered yet</p>
              <p className="text-slate-600 text-[11px] max-w-xs leading-relaxed">
                Start logging your check-ins in the Recovery Hub to begin tracking your 30-day emotional trajectory.
              </p>
            </div>
          )}
        </div>

        {/* Legend representation */}
        {moodMetrics.totalLogs > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-900">
            <div className="flex items-center gap-1.5"><span className="text-red-400 text-xs">😢</span> Crisis (1)</div>
            <div className="flex items-center gap-1.5"><span className="text-orange-400 text-xs">🙁</span> Struggling (2)</div>
            <div className="flex items-center gap-1.5"><span className="text-blue-400 text-xs">😐</span> Okay (3)</div>
            <div className="flex items-center gap-1.5"><span className="text-teal-400 text-xs">🙂</span> Good (4)</div>
            <div className="flex items-center gap-1.5"><span className="text-emerald-400 text-xs">😊</span> Great (5)</div>
          </div>
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
