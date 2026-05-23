
import React, { useMemo, useState, useEffect } from 'react';
import { X, Bell, BellOff, Clock, MapPin, Bus, Info, ShieldCheck, Check, Calendar, Heart, BadgeCheck, ChevronRight, Accessibility, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Meeting, Sponsor, AttendanceRecord, UserProfile } from '../types';
import { TransitArrivals } from './TransitArrivals';
import { MeetingMap } from './MeetingMap';
import { MeetingBuddyBeacon } from './MeetingBuddyBeacon';
import { MeetingReviews } from './MeetingReviews';
import { ErrorBoundary } from './ErrorBoundary';
import { 
  isCalendarConnected, 
  connectGoogleCalendar, 
  getNextOccurrence, 
  checkTimeConflict, 
  addMeetingToCalendar,
  getCachedToken,
  clearCachedToken
} from '../lib/googleCalendar';

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
  const [calendarConnected, setCalendarConnected] = useState(isCalendarConnected());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictEvent, setConflictEvent] = useState<any | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const nextOccur = useMemo(() => {
    return getNextOccurrence(meeting.day, meeting.time);
  }, [meeting.day, meeting.time]);

  const runConflictCheck = async (token: string) => {
    setIsCheckingConflict(true);
    setErrorMsg('');
    try {
      const conflict = await checkTimeConflict(token, nextOccur.start, nextOccur.end);
      setConflictEvent(conflict);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('expired') || e.message?.includes('connection')) {
        setCalendarConnected(false);
      }
    } finally {
      setIsCheckingConflict(false);
    }
  };

  useEffect(() => {
    const token = getCachedToken();
    if (token) {
      setCalendarConnected(true);
      runConflictCheck(token);
    } else {
      setCalendarConnected(false);
    }
  }, [nextOccur]);

  const handleConnectCalendar = async () => {
    setIsSyncing(true);
    setErrorMsg('');
    try {
      const token = await connectGoogleCalendar();
      setCalendarConnected(true);
      await runConflictCheck(token);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to connect Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddToCalendar = async () => {
    const token = getCachedToken();
    if (!token) {
      setCalendarConnected(false);
      setErrorMsg('Google connection expired. Please reconnect.');
      return;
    }
    setIsSyncing(true);
    setErrorMsg('');
    try {
      await addMeetingToCalendar(token, meeting, nextOccur.start, nextOccur.end);
      setIsAdded(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to add event to Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

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
            
            <ErrorBoundary 
              fallback={
                <div className="w-full h-48 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-2">
                   <MapPin size={32} className="text-slate-700" />
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Map currently unavailable<br/>{meeting.address}</p>
                </div>
              }
            >
              <MeetingMap lat={meeting.lat} lng={meeting.lng} name={meeting.name} />
            </ErrorBoundary>

            <ErrorBoundary>
              <TransitArrivals neighborhood={meeting.neighborhood} meetingName={meeting.name} />
            </ErrorBoundary>

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

          {/* Google Calendar Sync Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Google Calendar Sync</h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Keep recovery on your schedule</p>
                </div>
              </div>
              <div>
                {calendarConnected ? (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 rounded-full tracking-wider">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[8px] font-black uppercase text-slate-500 rounded-full tracking-wider">
                    Disconnected
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {!calendarConnected ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Connect your Google Calendar to seamlessly copy recovery events, set automatic reminders, and check for scheduling conflicts.
                  </p>
                  <button
                    onClick={handleConnectCalendar}
                    disabled={isSyncing}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isSyncing ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-500 border-t-white rounded-full" />
                    ) : (
                      <>
                        <Calendar size={16} className="text-blue-500" />
                        Connect Google Calendar
                      </>
                    )}
                  </button>
                  {errorMsg && (
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight text-center">
                      Error: {errorMsg}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Next Sync Target</span>
                      <span className="text-blue-500">Weekly occurrence</span>
                    </div>
                    <div className="text-white text-sm font-bold">
                      {nextOccur.start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at{' '}
                      {nextOccur.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {isCheckingConflict ? (
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
                        <span className="animate-spin inline-block w-3.5 h-3.5 border border-slate-500 border-t-blue-500 rounded-full" />
                        Checking calendar conflicts...
                      </div>
                    ) : conflictEvent ? (
                      <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-500">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <div className="text-[10px] uppercase font-bold tracking-tight">
                          <span className="font-black">Conflict Warning:</span> You have "{conflictEvent.summary || 'an event'}" scheduled at this time.
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-emerald-500 text-[10px] uppercase font-bold tracking-tight">
                        <Check size={14} className="bg-emerald-500/10 border border-emerald-500/20 rounded-full p-0.5 text-emerald-500" />
                        <span>Your schedule is free for this meeting!</span>
                      </div>
                    )}
                  </div>

                  {isAdded ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center text-center space-y-1">
                      <Check size={28} className="text-emerald-500 bg-emerald-500/10 rounded-full p-1.5 border border-emerald-500/30" />
                      <p className="text-xs text-white font-black uppercase tracking-widest pt-1">Event Synced Successfully</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        Added to primary calendar with 30 & 60-minute pre-meeting alert notifications.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCalendar}
                      disabled={isSyncing}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98] cursor-pointer"
                    >
                      {isSyncing ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-200 border-t-white rounded-full" />
                      ) : (
                        <>
                          <Calendar size={16} />
                          {conflictEvent ? 'Sync Event Anyway' : 'Add to Google Calendar'}
                        </>
                      )}
                    </button>
                  )}

                  {errorMsg && (
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight text-center">
                      Error: {errorMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

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
              myRecovery Network • Community Feedback
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
