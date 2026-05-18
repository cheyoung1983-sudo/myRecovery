
import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'post' | 'user' | 'meeting' | 'mentor';
  targetOwnerId?: string;
  onSuccess: (message: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  targetId, 
  targetType, 
  targetOwnerId,
  onSuccess 
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportReasons = [
    "Harassment or bullying",
    "Spam or fake profile",
    "Inappropriate recovery advice",
    "Thirteenth-stepping",
    "Solicitation or sales",
    "Hate speech or symbols"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || submitting) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        targetId,
        targetType,
        targetOwnerId: targetOwnerId || null,
        reason,
        description,
        status: 'pending',
        createdAt: serverTimestamp(),
        reportedBy: 'annonymous_member' // In a real app, populate with userId
      });
      onSuccess("Report submitted for review.");
      setReason('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error("Report failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600/10 rounded-xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Report Safety Issue</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Protecting Spokane Recovery</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Primary Reason</label>
                <div className="grid grid-cols-1 gap-2">
                  {reportReasons.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`text-left p-4 rounded-2xl border text-xs font-bold transition-all ${reason === r ? 'bg-rose-600/10 border-rose-500 text-rose-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Additional Details (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Help us understand the situation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-rose-500 outline-none transition-all h-24 resize-none"
                />
              </div>

              <div className="bg-slate-800/30 p-4 rounded-2xl flex items-start gap-3 border border-slate-700/50">
                <Flag size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 italic leading-relaxed">
                  Reports are handled anonymously and reviewed by the Sober Spokane moderation team within 24 hours.
                </p>
              </div>

              <button 
                type="submit"
                disabled={!reason || submitting}
                className="w-full py-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-900/40 transition-all active:scale-95"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
