import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sponsor, UserProfile } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { BadgeCheck, X, Check, Clock, User, Award, MapPin, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface AdminDashboardProps {
  pendingSponsors: Sponsor[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  allSponsors: Sponsor[];
  allUserProfiles: (UserProfile & { uid: string })[];
  onUpdateRole: (uid: string, role: 'user' | 'mentor' | 'admin') => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  pendingSponsors, 
  onApprove, 
  onReject,
  allSponsors,
  allUserProfiles,
  onUpdateRole
}) => {
  const needsData = useMemo(() => {
    const counts: Record<string, number> = {};
    allUserProfiles.forEach(u => {
      (u.recoveryNeeds || []).forEach(need => {
        counts[need] = (counts[need] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allUserProfiles]);

  const mentorStats = useMemo(() => {
    const verified = allSponsors.filter(s => s.status === 'verified').length;
    const pending = allSponsors.filter(s => s.status === 'pending').length;
    return [
      { name: 'Verified', value: verified },
      { name: 'Pending', value: pending }
    ];
  }, [allSponsors]);

  const roleStats = useMemo(() => {
    let adminCount = 0;
    let mentorCount = 0;
    let userCount = 0;

    allUserProfiles.forEach(u => {
      if (u.role === 'admin') adminCount++;
      else if (u.role === 'mentor') mentorCount++;
      else userCount++;
    });

    return [
      { name: 'User', value: userCount, color: '#3b82f6' },
      { name: 'Mentor', value: mentorCount, color: '#10b981' },
      { name: 'Admin', value: adminCount, color: '#ef4444' }
    ];
  }, [allUserProfiles]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
      id="admin-dashboard-container"
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">Command Center.</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">myRecovery Insights & Oversight</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-2xl text-blue-500 flex flex-col items-center">
           <span className="text-2xl font-black">{allUserProfiles.length}</span>
           <span className="text-[10px] font-bold uppercase">Members</span>
        </div>
      </div>

      {/* MEMBERSHIP SPLIT SUMMARY CARD WITH DONUT CHART */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-6 flex-1 w-full">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 leading-none">Permission Tiers</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">Active Membership Split</h3>
              <p className="text-slate-400 text-sm font-medium">
                Oversight and breakdown of access roles in Spokane's local recovery and mentorship ecosystem.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Users</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-blue-500">{roleStats[0].value}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    ({allUserProfiles.length > 0 ? Math.round((roleStats[0].value / allUserProfiles.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Mentors</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-emerald-500">{roleStats[1].value}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    ({allUserProfiles.length > 0 ? Math.round((roleStats[1].value / allUserProfiles.length) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Admins</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-rose-500">{roleStats[2].value}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    ({allUserProfiles.length > 0 ? Math.round((roleStats[2].value / allUserProfiles.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-56 h-48 flex items-center justify-center relative bg-slate-950/40 border border-slate-800 rounded-3xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleStats}
                  innerRadius={52}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-2xl font-black text-white">{allUserProfiles.length}</span>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Needs Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Community Needs</h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest leading-none">Popular Recovery Focus Areas</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={needsData.slice(0, 5)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {needsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mentor Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Mentor Network</h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest leading-none">Status of Spokane Partners</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mentorStats}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-3xl font-black text-white">{mentorStats[0].value + mentorStats[1].value}</span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <User className="text-blue-500" size={24} />
          <h3 className="text-xl font-bold text-white">Member Directory</h3>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Neighborhood</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allUserProfiles.map(u => (
                  <tr key={u.email} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                          {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full rounded-full" referrerPolicy="no-referrer" /> : u.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        u.role === 'admin' ? 'bg-rose-500/20 text-rose-500' :
                        u.role === 'mentor' ? 'bg-emerald-500/20 text-emerald-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium">{u.neighborhood || 'Not set'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={u.role}
                        onChange={(e) => {
                          onUpdateRole(u.uid, e.target.value as any);
                        }}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-1 text-[10px] text-white focus:outline-none"
                        disabled={u.email === SUPER_ADMIN_EMAIL}
                      >
                        <option value="user">User</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2">
        <BadgeCheck size={20} className="text-emerald-500" />
        <h3 className="text-xl font-bold text-white">Mentor Oversight</h3>
        <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-xs font-black">{allSponsors.length}</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mentor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Years</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allSponsors.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-xs font-black text-blue-500">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">{s.neighborhood}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        s.status === 'verified' ? 'bg-emerald-500/20 text-emerald-500' :
                        s.status === 'rejected' ? 'bg-rose-500/20 text-rose-500' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                        {s.status}
                      </span>
                      {s.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400 font-bold">{s.years} YRS</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {s.status !== 'verified' && (
                        <button 
                          onClick={() => onApprove(s.id)}
                          className="p-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                          title="Verify Mentor"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {s.status !== 'rejected' && (
                        <button 
                          onClick={() => onReject(s.id)}
                          className="p-2 bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                          title="Reject/Suspend Mentor"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2">
        <Clock size={20} className="text-amber-500" />
        <h3 className="text-xl font-bold text-white">Pending Approvals</h3>
        <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-black">{pendingSponsors.length}</span>
      </div>

      {pendingSponsors.length === 0 ? (
        <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2.5rem] py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
            <User size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold uppercase tracking-widest text-sm">Inbox Zero.</h3>
            <p className="text-slate-500 text-xs font-medium">No pending mentor applications to review at this time.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingSponsors.map((app) => (
            <motion.div 
              key={app.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/40 border border-slate-800 rounded-[2rem] p-8 shadow-xl relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Clock size={120} />
              </div>

              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-2xl">
                      {app.name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{app.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-400/10 px-2.5 py-1 rounded-lg">
                          <Clock size={12} /> {app.years} Years Sober
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-900 px-2.5 py-1 rounded-lg">
                          <MapPin size={12} /> {app.neighborhood}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Specialties</label>
                      <div className="flex flex-wrap gap-2">
                        {app.specialties.map(spec => (
                          <span key={spec} className="px-3 py-1.5 bg-slate-900 border border-slate-700/50 rounded-xl text-xs text-slate-300 font-medium lowercase">
                            #{spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mentor Bio & Approach</label>
                      <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-5 rounded-2xl border border-slate-800 italic">
                        "{app.bio}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 shrink-0">
                  <button 
                    onClick={() => onApprove(String(app.id))}
                    className="flex-1 md:w-36 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
                  >
                    <Check size={20} /> Approve
                  </button>
                  <button 
                    onClick={() => onReject(String(app.id))}
                    className="flex-1 md:w-36 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/40 active:scale-95"
                  >
                    <X size={20} /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ADMIN STATS ACCENT */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center">
            <Award className="mx-auto text-amber-500 mb-2" size={24} />
            <p className="text-2xl font-black text-white italic tracking-tighter">Safety First.</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Verified mentors only.</p>
        </div>
        <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl text-center">
            <User className="mx-auto text-blue-500 mb-2" size={24} />
            <p className="text-2xl font-black text-white italic tracking-tighter">Community.</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Service keeps us sober.</p>
        </div>
      </div>
    </motion.div>
  );
};
