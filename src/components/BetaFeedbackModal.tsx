import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, trackEvent } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export const BetaFeedbackModal: React.FC<BetaFeedbackModalProps> = ({ isOpen, onClose, userId, userName }) => {
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<'suggestion' | 'bug' | 'question'>('suggestion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId,
        userName,
        feedback,
        category,
        timestamp: serverTimestamp(),
        status: 'new',
        appVersion: 'beta-1.0.0'
      });

      trackEvent('beta_feedback_submitted', { category });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFeedback('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-blue-500/20 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {isSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Thank You!</h3>
                <p className="text-slate-400 text-sm font-medium">Your feedback helps us build a safer recovery community for Spokane.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Beta Feedback</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Help Shape myRecovery</p>
                  </div>
                </div>

                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {(['suggestion', 'bug', 'question'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                        category === cat ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Your Message</label>
                  <textarea
                    autoFocus
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={category === 'bug' ? "What happened? What did you expect?" : "Tell us what you're thinking..."}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm text-white focus:border-blue-500 outline-none transition-all h-32 resize-none"
                  />
                </div>

                <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 flex items-start gap-3">
                  <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                    This message will be sent directly to the development team along with your display name.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send size={18} /> Submit Feedback</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
