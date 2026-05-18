
import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { MeetingBuddy, UserProfile } from '../types';
import { User, Users, Clock, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeetingBuddyQueueProps {
  meetingId: string;
  userProfile: UserProfile | null;
  userId: string;
}

export const MeetingBuddyQueue: React.FC<MeetingBuddyQueueProps> = ({ meetingId, userProfile, userId }) => {
  const [buddies, setBuddies] = useState<MeetingBuddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'meetingBuddies'),
      where('meetingId', '==', meetingId),
      where('status', 'in', ['waiting', 'matched'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const buddyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingBuddy));
      setBuddies(buddyData.sort((a, b) => {
        const timeA = a.arrivalTime?.toMillis ? a.arrivalTime.toMillis() : 0;
        const timeB = b.arrivalTime?.toMillis ? b.arrivalTime.toMillis() : 0;
        return timeA - timeB;
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'meetingBuddies');
    });

    return () => unsubscribe();
  }, [meetingId]);

  const joinQueue = async () => {
    if (!userProfile) return;
    try {
      await addDoc(collection(db, 'meetingBuddies'), {
        meetingId,
        userId,
        userName: userProfile.name,
        userAlias: userProfile.alias || `${userProfile.name.split(' ')[0]} ${userProfile.name.split(' ')[1]?.[0] || ''}`.trim(),
        arrivalTime: serverTimestamp(),
        status: 'waiting'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'meetingBuddies');
    }
  };

  const leaveQueue = async (buddyId: string) => {
    try {
      await deleteDoc(doc(db, 'meetingBuddies', buddyId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'meetingBuddies');
    }
  };

  const userBuddyEntry = buddies.find(b => b.userId === userId);

  if (loading) return <div className="animate-pulse h-20 bg-slate-800/50 rounded-2xl" />;

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white italic flex items-center gap-2">
          <Users size={18} className="text-blue-500" /> Meeting Buddy Queue
        </h3>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{buddies.length} waiting</span>
      </div>

      <p className="text-xs text-slate-400 italic">
        Meet someone at the door to walk in together. Safe, simple peer-matching for this meeting.
      </p>

      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {buddies.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl">
              <p className="text-[10px] text-slate-600 font-bold uppercase">No one is waiting yet</p>
            </div>
          ) : (
            buddies.map((buddy) => (
              <motion.div
                key={buddy.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 10, opacity: 0 }}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  buddy.userId === userId 
                    ? 'bg-blue-600/10 border-blue-500/30' 
                    : 'bg-slate-800/30 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                    <User size={14} className={buddy.userId === userId ? 'text-blue-400' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{buddy.userAlias}</p>
                    <p className="text-[9px] text-slate-500 flex items-center gap-1 uppercase font-black">
                      <Clock size={10} /> Waiting {new Date(buddy.arrivalTime?.toMillis?.() || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {buddy.userId === userId && (
                  <button 
                    onClick={() => leaveQueue(buddy.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                  >
                    <AlertCircle size={16} />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {!userBuddyEntry ? (
        <button
          onClick={joinQueue}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Users size={18} /> Join Buddy Queue
        </button>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
          <Check size={20} className="text-emerald-500" />
          <p className="text-xs text-emerald-400 font-bold">You are in the queue. Mentors and peers can see you're looking for a buddy!</p>
        </div>
      )}
    </div>
  );
};
