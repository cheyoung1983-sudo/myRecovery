import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sponsor, UserProfile, SpokaneResource } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { BadgeCheck, X, Check, Clock, User, Award, MapPin, BarChart3, PieChart as PieIcon, TrendingUp, Plus, Edit2, Trash2, Globe, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminDashboardProps {
  pendingSponsors: Sponsor[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  allSponsors: Sponsor[];
  allUserProfiles: (UserProfile & { uid: string })[] | any[];
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
  const [adminTab, setAdminTab] = useState<'stats' | 'users' | 'mentors' | 'resources'>('stats');
  const [resources, setResources] = useState<SpokaneResource[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  const [newResource, setNewResource] = useState<Partial<SpokaneResource>>({
    name: '',
    category: 'health',
    description: '',
    address: '',
    phone: '',
    website: '',
    tags: []
  });

  useEffect(() => {
    const q = query(collection(db, 'spokaneResources'), orderBy('name', 'asc'));
    return onSnapshot(q, (snap) => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as SpokaneResource)));
    });
  }, []);

  const handleSaveResource = async () => {
    try {
      if (editingResourceId) {
        await updateDoc(doc(db, 'spokaneResources', editingResourceId), newResource);
      } else {
        await addDoc(collection(db, 'spokaneResources'), newResource);
      }
      setIsAddingResource(false);
      setEditingResourceId(null);
      setNewResource({ name: '', category: 'health', description: '', address: '', phone: '', website: '', tags: [] });
    } catch (e) {
      alert("Failed to save resource");
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      await deleteDoc(doc(db, 'spokaneResources', id));
    }
  };

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
      id="admin-dashboard-container"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">Command Center.</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Spokane Recovery Insights & Oversight</p>
        </div>

        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
           {(['stats', 'users', 'mentors', 'resources'] as const).map(t => (
             <button
               key={t}
               onClick={() => setAdminTab(t)}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      {adminTab === 'stats' && (
        <div className="space-y-12">
          {/* STATS OVERVIEW */}
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
        </div>
      )}

      {adminTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <User className="text-blue-500" size={24} />
            <h3 className="text-xl font-bold text-white">Member Directory</h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
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
                    <tr key={u.uid} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 overflow-hidden">
                            {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : u.name[0]}
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
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
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
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/admin/sync-role', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ uid: u.uid, role: u.role })
                              });
                              if (response.ok) alert(`Security claims synced for ${u.name}`);
                            } catch (e) {
                              alert("Failed to sync security claims.");
                            }
                          }}
                          className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                          title="Sync Security Claims"
                        >
                           <Check size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'mentors' && (
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <BadgeCheck size={20} className="text-emerald-500" />
              <h3 className="text-xl font-bold text-white">Mentor Roster</h3>
              <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-xs font-black">{allSponsors.length}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mentor</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience</th>
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
          </div>

          {/* PENDING APPROVALS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-amber-500" />
              <h3 className="text-xl font-bold text-white">Pending Approvals</h3>
              <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-black">{pendingSponsors.length}</span>
            </div>

            {pendingSponsors.length === 0 ? (
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2.5rem] py-10 text-center">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No pending applications</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingSponsors.map((app) => (
                  <div key={app.id} className="bg-slate-800/40 border border-slate-800 rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 font-bold">
                        {app.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{app.name} ({app.years} yrs)</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black">{app.neighborhood}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => onApprove(app.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase">Approve</button>
                       <button onClick={() => onReject(app.id)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'resources' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="text-blue-500" size={24} />
              <h3 className="text-xl font-bold text-white">Resource Manager</h3>
            </div>
            <button
              onClick={() => {
                setEditingResourceId(null);
                setNewResource({ name: '', category: 'health', description: '', address: '', phone: '', website: '', tags: [] });
                setIsAddingResource(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40"
            >
              <Plus size={16} /> Add Resource
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-900/30 rounded-[2.5rem] border border-dashed border-slate-800 space-y-4">
                 <p className="text-slate-500 font-bold italic">No dynamic resources found.</p>
                 <button
                  onClick={async () => {
                    const { SPOKANE_RESOURCES } = await import('../constants');
                    for (const r of SPOKANE_RESOURCES) {
                      let mappedCategory: any = 'health';
                      if (r.category === 'Detox' || r.category === 'Inpatient' || r.category === 'Outpatient') mappedCategory = 'health';
                      if (r.category === 'Sober Living') mappedCategory = 'shelter';

                      await addDoc(collection(db, 'spokaneResources'), {
                        name: r.name,
                        category: mappedCategory,
                        description: r.description,
                        address: r.address,
                        phone: r.phone,
                        website: r.website,
                        tags: []
                      });
                    }
                    alert("Seeded Firestore with initial resources!");
                  }}
                  className="px-6 py-3 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                 >
                   Seed Initial Resources
                 </button>
              </div>
            )}
            {resources.map(r => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4 relative group">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-black px-2 py-1 bg-slate-800 text-slate-400 rounded-md uppercase tracking-widest">{r.category}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingResourceId(r.id);
                        setNewResource(r);
                        setIsAddingResource(true);
                      }}
                      className="p-1.5 bg-slate-800 text-blue-400 rounded-lg hover:bg-blue-400 hover:text-white transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(r.id)}
                      className="p-1.5 bg-slate-800 text-rose-400 rounded-lg hover:bg-rose-400 hover:text-white transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white italic uppercase tracking-tight">{r.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mt-1">{r.description}</p>
                </div>
                <div className="pt-2 space-y-1">
                   {r.phone && <p className="text-[10px] text-slate-400 flex items-center gap-2"><Phone size={10} className="text-emerald-500" /> {r.phone}</p>}
                   {r.website && <p className="text-[10px] text-slate-400 flex items-center gap-2 truncate"><Globe size={10} className="text-blue-500" /> {r.website.replace('https://', '')}</p>}
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {isAddingResource && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{editingResourceId ? 'Edit Resource' : 'New Resource'}</h3>
                    <button onClick={() => setIsAddingResource(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Resource Name</label>
                      <input
                        type="text"
                        value={newResource.name}
                        onChange={e => setNewResource({...newResource, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Category</label>
                        <select
                          value={newResource.category}
                          onChange={e => setNewResource({...newResource, category: e.target.value as any})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none"
                        >
                          <option value="health">Health/Detox</option>
                          <option value="food">Food/Supplies</option>
                          <option value="shelter">Shelter/Housing</option>
                          <option value="crisis">Crisis/ER</option>
                          <option value="legal">Legal/Advocacy</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Phone</label>
                        <input
                          type="text"
                          value={newResource.phone}
                          onChange={e => setNewResource({...newResource, phone: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Website URL</label>
                      <input
                        type="text"
                        value={newResource.website}
                        onChange={e => setNewResource({...newResource, website: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Description</label>
                      <textarea
                        value={newResource.description}
                        onChange={e => setNewResource({...newResource, description: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none h-24 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Physical Address</label>
                      <input
                        type="text"
                        value={newResource.address}
                        onChange={e => setNewResource({...newResource, address: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveResource}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95"
                  >
                    {editingResourceId ? 'Update Resource' : 'Publish Resource'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h4 className="text-xl font-black text-white italic tracking-tight uppercase">AI Synchronization</h4>
              <p className="text-xs text-slate-400 mt-1">Update the global AI index so the guide knows about these new resources.</p>
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/admin/index-resources', { method: 'POST' });
                if (res.ok) alert("AI Index Updated!");
              }}
              className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              Sync AI Index
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
