
import React from 'react';
import { Clock, MapPin, Bus } from 'lucide-react';
import { motion } from 'motion/react';
import { Meeting } from '../types';
import { TransitArrivals } from './TransitArrivals';

interface MeetingCardProps {
  meeting: Meeting;
  onSelect: (m: Meeting) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onSelect }) => {
  const transitLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${meeting.address}, Spokane, WA`)}&travelmode=transit`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/40 border border-slate-800 p-5 rounded-3xl hover:border-blue-500/40 transition-all group shadow-sm hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span className={`text-[10px] font-black px-2 py-1 bg-slate-900 rounded border border-slate-700 ${meeting.fellowship === 'AA' ? 'text-blue-400' : 'text-purple-400'}`}>
            {meeting.fellowship}
          </span>
          {meeting.format && (
            <span className="text-[10px] font-black px-2 py-1 bg-blue-600/10 text-blue-400 rounded border border-blue-600/20 uppercase tracking-tight">
              {meeting.format}
            </span>
          )}
          {meeting.distance !== undefined && (
            <span className="text-[10px] font-extrabold px-2 py-1 bg-emerald-600/10 text-emerald-400 rounded border border-emerald-600/20 uppercase tracking-tight">
              🎯 {meeting.distance.toFixed(1)} mi away
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{meeting.neighborhood}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{meeting.name}</h3>
      <div className="flex flex-col gap-1 mb-6 text-slate-400 text-sm">
        <p className="flex items-center gap-1.5"><Clock size={14} /> {meeting.day} at {meeting.time}</p>
        <p className="flex items-center gap-1.5 line-clamp-1"><MapPin size={14} /> {meeting.address}</p>
        <div className="pt-2">
          <TransitArrivals neighborhood={meeting.neighborhood} meetingName={meeting.name} />
        </div>
      </div>
      <div className="flex gap-2.5">
        <a 
          href={transitLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 bg-slate-800 hover:bg-slate-750 p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/50"
        >
          <Bus size={16} /> STA BUS
        </a>
        <button 
          onClick={() => onSelect(meeting)}
          className="flex-1 bg-blue-600/10 text-blue-400 border border-blue-600/20 hover:bg-blue-600 hover:text-white p-3.5 rounded-xl text-xs font-bold transition-all"
        >
          DETAILS
        </button>
      </div>
    </motion.div>
  );
};
