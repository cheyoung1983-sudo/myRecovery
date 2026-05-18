import React, { useState, useEffect } from 'react';
import { Users, UserPlus, LogIn, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MeetingBuddy, UserProfile } from '../types';

interface MeetingBuddyBeaconProps {
  meetingId: string;
  user: UserProfile | null;
  userId: string;
}

export const MeetingBuddyBeacon: React.FC<MeetingBuddyBeaconProps> = ({ meetingId, user, userId }) => {
  const [buddies, setBuddies] = useState<MeetingBuddy[]>([]);
  const [myStatus, setMyStatus] = useState<MeetingBuddy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'meetingBuddies'), 
      where('meetingId', '==', meetingId),
      where('status', '==', 'waiting')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MeetingBuddy));
      setBuddies(data);
      setMyStatus(data.find(b => b.userId === userId) || null);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [meetingId, userId]);

  const toggleStatus = async () => {
    if (myStatus) {
      // If already waiting, remove
      await deleteDoc(doc(db, 'meetingBuddies', myStatus.id));
    } else {
      // Join waitlist
      await addDoc(collection(db, 'meetingBuddies'), {
        meetingId,
        userId,
        userName: user?.name || 'Someone',
        userAlias: user?.alias || '',
        arrivalTime: serverTimestamp(),
        status: 'waiting'
      });
    }
  };

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meeting Buddy Beacon</h4>
        </div>
        <div className="flex -space-x-2">
          {buddies.slice(0, 3).map((b, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-black text-white uppercase ring-2 ring-slate-950">
              {b.userAlias ? b.userAlias.slice(0, 2) : b.userName.slice(0, 2)}
            </div>
          ))}
          {buddies.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-blue-600 border border-slate-700 flex items-center justify-center text-[8px] font-black text-white ring-2 ring-slate-950">
              +{buddies.length - 3}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {buddies.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium italic">Nobody is waiting yet. Be the first to signal you are here!</p>
        ) : (
          <p className="text-xs text-white font-bold">
            <span className="text-emerald-500">{buddies.length} person</span> {buddies.length === 1 ? 'is' : 'are'} waiting at the door.
          </p>
        )}

        <button
          onClick={toggleStatus}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${myStatus ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-300 hover:bg-white hover:text-slate-950 shadow-xl'}`}
        >
          {myStatus ? (
            <>
              <CheckCircle2 size={16} /> I'm Waiting at the Door
            </>
          ) : (
            <>
              <LogIn size={16} /> I'm Arriving Alone
            </>
          )}
        </button>
        <p className="text-[9px] text-slate-600 font-bold uppercase text-center tracking-tighter">
          {myStatus ? 'Others can see you are waiting for a buddy.' : 'Tap to let others know you’d like a buddy at the door.'}
        </p>
      </div>
    </div>
  );
};
