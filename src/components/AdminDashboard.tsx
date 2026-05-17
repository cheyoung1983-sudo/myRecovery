import React from 'react';
import { motion } from 'motion/react';
import { Sponsor } from '../types';
import { BadgeCheck, X, Check, Clock, User, Award, MapPin } from 'lucide-react';

interface AdminDashboardProps {
  pendingSponsors: Sponsor[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  pendingSponsors, 
  onApprove, 
  onReject 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
      id="admin-dashboard-container"
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tight">Admin Control Panel.</h2>
          <p className="text-slate-400 text-sm mt-1">Reviewing {pendingSponsors.length} pending mentor applications.</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl text-amber-500">
           <BadgeCheck size={24} />
        </div>
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
