
import React, { useMemo } from 'react';
import { X, Bell, BellOff, Clock, MapPin, Bus, Info, ShieldCheck, Check, Calendar, Heart, BadgeCheck, ChevronRight, Accessibility } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Meeting, Sponsor, AttendanceRecord, UserProfile } from '../types';
import { TransitArrivals } from './TransitArrivals';
import { MeetingMap } from './MeetingMap';
import { MeetingBuddyBeacon } from './MeetingBuddyBeacon';
import { MeetingReviews } from './MeetingReviews';

interface MeetingDetailModalProps {
  meeting: Meeting;
  onClose: () => void;
  sponsors: Sponsor[];
  onConnect: (s: Sponsor) => void;
  reminders: string[];
  onToggleReminder: (id: string) => void;
  onLogAttendance: (m: Meeting) => void;
  attendance: AttendanceRecord[];
  userProfile: UserProfile | null;
  userId: string;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({ 
  meeting, 
  onClose, 
  sponsors, 
  onConnect, 
  reminders, 
  onToggleReminder, 
  onLogAttendance, 
  attendance, 
  userProfile, 
  userId 
}) => {
  const transitLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${meeting.address}, Spokane, WA`)}&travelmode=transit`;

  const homeGroupSponsors = useMemo(() => {
    return sponsors.filter(s => meeting.sponsors?.includes(s.id));
  }, [meeting, sponsors]);

  const suggestedSponsors = useMemo(() => {
    if (homeGroupSponsors.length > 0) return [];
    
    return sponsors
      .filter(s => s.status === 'verified')
      .sort((a, b) => {
        const aSameNeighborhood = a.neighborhood === meeting.neighborhood;
        const bSameNeighborhood = b.neighborhood === meeting.neighborhood;
        if (aSameNeighborhood && !bSameNeighborhood) return -1;
        if (!aSameNeighborhood && bSameNeighborhood) return 1;

        const formatLower = meeting.format?.toLowerCase() || '';
        const aMatches = a.specialties.some(spec => formatLower.includes(spec.toLowerCase()));
        const bMatches = b.specialties.some(spec => formatLower.includes(spec.toLowerCase()));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;

        return 0;
      })
      .slice(0, 2);
  }, [meeting, sponsors, homeGroupSponsors]);

  const isReminderSet = reminders.includes(meeting.id);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-[#0f172a] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-slate-800 shadow-2xl max-h-[95vh] overflow-y-auto"
      >
        <div className="sticky top-0 right-0 p-6 flex justify-end gap-3 z-[70] pointer-events-none">
          <button 
            onClick={() => onToggleReminder(meeting.id)}
            className={`p-2.5 backdrop-blur-md rounded-full pointer-events-auto shadow-lg border transition-all ${
              isReminderSet 
                ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-blue-400'
            }`}
            title={isReminderSet ? "Remove Reminder" : "Set Reminder"}
          >
            {isReminderSet ? <BellOff size={24} /> : <Bell size={24} />}
          </button>
          <button 
            onClick={onClose}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md rounded-full text-slate-400 hover:text-white pointer-events-auto shadow-lg border border-slate-800"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 pt-0 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm ${meeting.fellowship === 'AA' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {meeting.fellowship}
              </span>
              {meeting.format && (
                <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-700 shadow-sm">
                  {meeting.format}
                </span>
              )}
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">{meeting.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Schedule</p>
              <div className="flex items-center gap-2 text-slate-100 font-bold">
                <Clock size={16} className="text-blue-400"/>
                {meeting.day}s, {meeting.time}
              </div>
            </div>
            <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Accessibility</p>
              <div className="flex items-center gap-2 text-slate-100 font-bold">
                <Accessibility size={16} className="text-emerald-400"/>
                Wheelchair Access
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <MapPin size={14} /> Location Details
            </h4>
            
            <MeetingMap lat={meeting.lat} lng={meeting.lng} name={meeting.name} />

            <TransitArrivals neighborhood={meeting.neighborhood} meetingName={meeting.name} />

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-inner">
              <p className="text-lg text-slate-100 font-bold mb-1">{meeting.address}</p>
              <p className="text-sm text-slate-500 font-medium mb-6 uppercase tracking-wider">{meeting.neighborhood} Spokane</p>
              
              {meeting.description && (
                <div className="flex gap-3.5 text-sm text-blue-200 bg-blue-900/15 p-4 rounded-2xl border border-blue-900/30 leading-relaxed shadow-sm">
                  <span className="shrink-0 mt-0.5"><Info size={18} className="text-blue-400" /></span>
                  <p>{meeting.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href={transitLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 py-5 bg-slate-100 text-slate-900 rounded-[1.25rem] font-bold shadow-lg hover:bg-white transition-all transform hover:-translate-y-0.5"
            >
              <Bus size={20} />
              Open Bus Route
            </a>
            <div className="flex items-center justify-center gap-3 py-5 bg-slate-800 border border-slate-700 text-slate-300 rounded-[1.25rem]">
              <ShieldCheck size={20} className="text-emerald-400" />
              <span className="font-bold">{meeting.isOpen ? 'Open Meeting' : 'Closed Meeting'}</span>
            </div>
          </div>

          <button 
            onClick={() => onLogAttendance(meeting)}
            disabled={attendance.some(a => a.meetingId === meeting.id && a.date === new Date().toISOString().split('T')[0])}
            className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
              attendance.some(a => a.meetingId === meeting.id && a.date === new Date().toISOString().split('T')[0])
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 active:scale-[0.98]'
            }`}
          >
            {attendance.some(a => a.meetingId === meeting.id && a.date === new Date().toISOString().split('T')[0]) ? (
              <><Check size={24} /> Attendance Logged</>
            ) : (
              <><Calendar size={24} /> Log My Attendance</>
            )}
          </button>

          <MeetingBuddyBeacon 
            meetingId={meeting.id} 
            userId={userId} 
            user={userProfile} 
          />

          <div className="pt-6 border-t border-slate-800/50">
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-900/10 border border-blue-500/20 p-8 rounded-[2rem] text-center shadow-sm">
              <div className="w-14 h-14 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <Heart size={28} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-white">Feeling anxious?</h3>
              <p className="text-sm text-slate-400 mt-2 mb-8 max-w-sm mx-auto leading-relaxed">
                Walking into a new room can be scary. Connect with a local sponsor who attends this meeting to meet you at the door.
              </p>
              
              {homeGroupSponsors.length > 0 ? (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-left mb-2 px-1">Frequent Attendees</p>
                  {homeGroupSponsors.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => onConnect(s)}
                      className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-xs">
                          {s.name[0]}
                        </div>
                        <span className="font-bold text-white text-sm">{s.name}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : suggestedSponsors.length > 0 ? (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-left mb-2 px-1">Suggested Matches ({meeting.neighborhood})</p>
                  {suggestedSponsors.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => onConnect(s)}
                      className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center text-emerald-500 font-bold text-xs uppercase tracking-tighter">
                          {s.neighborhood?.slice(0, 3)}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="block font-bold text-white text-sm">{s.name}</span>
                            {s.isVerified && <BadgeCheck size={14} className="text-blue-400" />}
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{s.years} Years • {s.specialties[0]}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <button 
                  onClick={() => alert("We'll find a partner for you!")}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-[0.98]"
                >
                  Request a "Meeting Buddy"
                </button>
              )}
            </div>
          </div>
          
          <div className="pt-10 border-t border-slate-800/50">
            <MeetingReviews meetingId={meeting.id} />
          </div>

          <div className="pb-8 text-center pt-10">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em]">
              Spokane Recovery Network • Community Feedback
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
