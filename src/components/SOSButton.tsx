
import React, { useState } from 'react';
import { ShieldAlert, Send, Phone, MessageCircle, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Sponsor } from '../types';
import { db, handleFirestoreError, OperationType, trackEvent } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';

interface SOSButtonProps {
  userProfile: UserProfile | null;
  userId: string;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ userProfile, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string[]>([]);

  const triggerSOS = async () => {
    if (!userProfile) return;
    setLoading(true);
    trackEvent('sos_triggered', {
      neighborhood: userProfile.neighborhood,
      hasEmergencyMentor: !!userProfile.emergencyMentorId
    });
    try {
      const alertedUids: string[] = [];

      // 1. Send notification to emergency mentor if assigned
      if (userProfile.emergencyMentorId) {
        await addDoc(collection(db, 'chats', `${userId}_${userProfile.emergencyMentorId}`, 'messages'), {
          senderId: userId,
          text: "🆘 EMERGENCY SOS: I am in crisis and need immediate support. This is a system-generated alert.",
          timestamp: serverTimestamp(),
          isCrisis: true
        });
        setSentTo(prev => [...prev, 'Emergency Mentor']);
        alertedUids.push(userProfile.emergencyMentorId);
      }

      // 2. Find "Crisis-Available" Sponsors
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'mentor'),
        where('isCrisisAvailable', '==', true),
        limit(5)
      );

      const snapshot = await getDocs(q);
      for (const doc of snapshot.docs) {
        if (doc.id === userProfile.emergencyMentorId) continue;
        
        await addDoc(collection(db, 'chats', `${userId}_${doc.id}`, 'messages'), {
          senderId: userId,
          text: "🆘 EMERGENCY SOS: I am in crisis and looking for support. You are listed as crisis-available.",
          timestamp: serverTimestamp(),
          isCrisis: true
        });
        alertedUids.push(doc.id);
      }
      
      setSentTo(prev => [...prev, 'Crisis Response Network']);

      // 3. Trigger Server-Side Push Notification Broadcast
      await fetch('/api/sos/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          targetUids: alertedUids
        })
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'SOS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-red-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-200 animate-pulse"></div>
        <div className="relative p-2.5 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-xl flex items-center justify-center border border-red-400/30 transition-all active:scale-90">
          <ShieldAlert size={24} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-rose-500/30 p-8 shadow-[0_0_50px_rgba(244,63,94,0.3)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
              
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/30 animate-bounce">
                <ShieldAlert size={48} />
              </div>

              <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">Emergency SOS</h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">
                Feeling triggered? This will instantly alert your assigned mentor and our crisis-available peer network.
              </p>

              <div className="grid grid-cols-1 gap-4">
                {sentTo.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-emerald-400 font-bold flex items-center justify-center gap-2">
                       <Send size={16} /> Alerts sent to:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {sentTo.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={triggerSOS}
                    disabled={loading}
                    className="group relative w-full py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xl shadow-2xl shadow-rose-900/40 transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    {loading ? <RefreshCw className="animate-spin" /> : <ShieldAlert size={32} />}
                    ACTIVATE SOS
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href="tel:988"
                    className="py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
                  >
                    <Phone size={18} className="text-rose-400" /> Call 988
                  </a>
                  <a 
                    href="sms:988"
                    className="py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
                  >
                    <MessageCircle size={18} className="text-blue-400" /> Text 988
                  </a>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                  <AlertCircle size={14} /> Remember: You are not alone.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
