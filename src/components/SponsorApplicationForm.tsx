import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sponsor } from '../types';
import { SPOKANE_NEIGHBORHOODS } from '../constants';
import { Heart } from 'lucide-react';

interface SponsorApplicationFormProps {
  onSubmit: (app: Omit<Sponsor, 'id' | 'isVerified' | 'status' | 'userId'>) => void;
  onCancel: () => void;
}

export const SponsorApplicationForm: React.FC<SponsorApplicationFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    years: 0,
    specialties: '',
    bio: '',
    neighborhood: 'South Hill',
    isCrisisAvailable: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-8"
      id="sponsor-application-form"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
             <Heart className="text-white" size={20} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-black text-white italic tracking-tight">Join the Network.</h2>
        </div>
        <p className="text-slate-400 text-sm">Help others navigate their early days of recovery in Spokane.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Full Name (or First & Initial)</label>
            <input 
              required
              id="app-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              placeholder="e.g. Sarah J."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Years Sober</label>
              <input 
                required
                id="app-years"
                type="number"
                min="2"
                value={formData.years || ''}
                onChange={e => setFormData({...formData, years: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
                placeholder="Min 2"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Neighborhood</label>
              <select 
                id="app-neighborhood"
                value={formData.neighborhood}
                onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white appearance-none"
              >
                {SPOKANE_NEIGHBORHOODS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Specialties</label>
            <input 
              required
              id="app-specialties"
              type="text"
              value={formData.specialties}
              onChange={e => setFormData({...formData, specialties: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
              placeholder="e.g. Trauma, Big Book, Dual-Diagnosis (comma separated)"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Short Bio</label>
            <textarea 
              required
              id="app-bio"
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-sm focus:outline-none focus:border-blue-500 min-h-[120px] text-white"
              placeholder="Briefly describe your approach to sponsorship..."
            />
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 group">
            <div className="space-y-1">
              <label htmlFor="isCrisisAvailable" className="text-sm font-bold text-white flex items-center gap-2">
                 Crisis Available ?
              </label>
              <p className="text-[10px] text-slate-500 font-medium italic">Available for SOS/Crisis alerts from peers.</p>
            </div>
            <input 
              id="isCrisisAvailable"
              type="checkbox" 
              checked={formData.isCrisisAvailable}
              onChange={e => setFormData({...formData, isCrisisAvailable: e.target.checked})}
              className="w-6 h-6 rounded-lg border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer" 
            />
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
            <input type="checkbox" required className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" id="guidelines" />
            <label htmlFor="guidelines" className="text-xs text-slate-400 font-medium leading-tight">I agree to the community guidelines and prioritize member safety.</label>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            id="cancel-app-btn"
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-900 text-slate-400 rounded-2xl font-bold border border-slate-700 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button 
            id="submit-app-btn"
            type="submit"
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-[0.98]"
          >
            Submit Application
          </button>
        </div>
      </form>
    </motion.div>
  );
};
