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

  const toggleStatus = async (status: 'waiting' | 'on_my_way') => {
    if (myStatus && myStatus.status === status) {
      // If same status, remove
      await deleteDoc(doc(db, 'meetingBuddies', myStatus.id));
    } else if (myStatus) {
      // Switch status
      await updateDoc(doc(db, 'meetingBuddies', myStatus.id), { status });
    } else {
      // Join waitlist or signal arrival
      await addDoc(collection(db, 'meetingBuddies'), {
        meetingId,
        userId,
        userName: user?.name || 'Someone',
        userAlias: user?.alias || '',
        arrivalTime: serverTimestamp(),
        status
      });
    }
  };

  const waitingCount = buddies.filter(b => b.status === 'waiting').length;
  const omwCount = buddies.filter(b => b.status === 'on_my_way').length;

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
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

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
             <p className="text-xl font-black text-white">{omwCount}</p>
             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">On Their Way</p>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
             <p className="text-xl font-black text-emerald-500">{waitingCount}</p>
             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">At The Door</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => toggleStatus('on_my_way')}
            className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${myStatus?.status === 'on_my_way' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            {myStatus?.status === 'on_my_way' ? <CheckCircle2 size={14} /> : <Users size={14} />} 
            I'm On My Way
          </button>
          
          <button
            onClick={() => toggleStatus('waiting')}
            className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${myStatus?.status === 'waiting' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-300 hover:bg-white hover:text-slate-950'}`}
          >
            {myStatus?.status === 'waiting' ? <CheckCircle2 size={14} /> : <LogIn size={14} />} 
            I'm Waiting at the Door
          </button>
        </div>

        <p className="text-[9px] text-slate-600 font-bold uppercase text-center tracking-tighter">
          Beacons are active for the duration of the meeting.
        </p>
      </div>
    </div>
  );
};
