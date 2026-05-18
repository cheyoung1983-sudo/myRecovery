/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, ShieldAlert, MapPin, Bus, Heart, 
  Wind, MessageCircle, ChevronRight, X, BadgeCheck,
  Eye, Fingerprint, Volume2, Flower2, Coffee,
  UserCheck, Clock, ShieldCheck, Info, Accessibility,
  ArrowLeft, Send, Search, Menu, Bell, BellOff, Settings2,
  LogOut, LogIn, Mail, Sparkles, Calendar, TrendingUp, Trophy,
  Smile, Frown, Meh, AlertCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { 
  auth, db, googleProvider, OperationType, handleFirestoreError,
  requestForToken, onMessage, messaging
} from './lib/firebase';
import { 
  signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser,
  sendEmailVerification, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, setDoc, onSnapshot, collection, query, where, orderBy, 
  serverTimestamp, updateDoc, addDoc, getDoc, getDocs, deleteDoc,
  Timestamp, or, increment
} from 'firebase/firestore';

import { Meeting, Sponsor, AttendanceRecord, Message, ChatSession, Resource, UserProfile, MoodEntry } from './types';
import { SPOKANE_NEIGHBORHOODS, RECOVERY_NEEDS, SUPER_ADMIN_EMAIL, SPOKANE_RESOURCES } from './constants';
import { SponsorApplicationForm } from './components/SponsorApplicationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { MeetingReviews } from './components/MeetingReviews';
import { MentorReviews } from './components/MentorReviews';
import { ChatList } from './components/ChatList';
import { AdBanner } from './components/AdBanner';
import { NativeAd } from './components/NativeAd';
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { useRewardedAd } from './hooks/useRewardedAd';
import { Analytics } from '@vercel/analytics/react';

// New Components
import { MeetingBuddyBeacon } from './components/MeetingBuddyBeacon';
import { NeighborhoodFeed } from './components/NeighborhoodFeed';
import { AIReflectionCard } from './components/AIReflectionCard';
import { SOSButton } from './components/SOSButton';
import { TransitArrivals } from './components/TransitArrivals';
import { SpokaneResources } from './components/SpokaneResources';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

// --- MOCK DATA ---
const INITIAL_MEETINGS: any[] = [
  { 
    id: "1", 
    name: "Sunday Morning Serenity", 
    neighborhood: "South Hill", 
    address: "Manito Park, Spokane, WA", 
    time: "10:00 AM", 
    day: "Sunday",
    fellowship: "AA",
    format: "Discussion",
    description: "Outdoor meeting near the duck pond. Bring a chair.",
    isOpen: true,
    sponsors: ["1"],
    lat: 47.6366,
    lng: -117.4116
  },
  { 
    id: "2", 
    name: "North Hill Group", 
    neighborhood: "North Side", 
    address: "North Hill Christian Church", 
    time: "7:00 PM", 
    day: "Tuesday",
    fellowship: "NA",
    format: "Basic Text Study",
    description: "Enter through the side door by the playground.",
    isOpen: false,
    sponsors: ["2"],
    lat: 47.7025,
    lng: -117.4180
  },
  { 
    id: "3", 
    name: "Valley Clean & Serene", 
    neighborhood: "Valley", 
    address: "Spokane Valley Alano Club", 
    time: "6:30 PM", 
    day: "Thursday",
    fellowship: "NA",
    format: "Speaker",
    description: "Large room, plenty of parking.",
    isOpen: true,
    sponsors: ["1", "2"],
    lat: 47.6695,
    lng: -117.2285
  },
  { 
    id: "4", 
    name: "Downtown High Noon", 
    neighborhood: "Downtown", 
    address: "Central United Methodist", 
    time: "12:00 PM", 
    day: "Monday",
    fellowship: "AA",
    format: "Big Book Study",
    description: "Basement meeting room. Quick 1-hour format.",
    isOpen: true,
    sponsors: [],
    lat: 47.6534,
    lng: -117.4187
  },
];

const INITIAL_SPONSORS: any[] = [
  { 
    id: "1", 
    name: "Sarah J.", 
    years: 12, 
    specialties: ["Trauma", "Grief", "Dual-Diagnosis"], 
    bio: "Walking this path since 2012. I specialize in dual-diagnosis recovery and trauma-informed support.",
    neighborhood: "South Hill",
    isVerified: true,
    status: 'verified'
  },
  { 
    id: "2", 
    name: "Michael K.", 
    years: 8, 
    specialties: ["Big Book", "Step Work", "Sponsorship"], 
    bio: "Focusing on the solution. Available for morning check-ins and structured step work.",
    neighborhood: "Valley",
    isVerified: true,
    status: 'verified'
  },
  {
    id: "3",
    name: "James R.",
    years: 10,
    specialties: ["Dual-Diagnosis", "Trauma"],
    bio: "Focuses on dual-diagnosis and trauma recovery.",
    neighborhood: "North Side",
    isVerified: false,
    status: 'pending'
  },
  {
    id: "4",
    name: "David L.",
    years: 5,
    specialties: ["Step Work", "Accountability"],
    bio: "Active in the downtown community. Happy to help newcomers find their footing.",
    neighborhood: "Downtown",
    isVerified: true,
    status: 'verified'
  }
];

// --- COMPONENTS ---

const GroundingTool = () => {
  const [step, setStep] = useState(0);
  const groundingSteps = [
    { label: "Look: 5 things you can see", icon: <Eye className="text-blue-400" /> },
    { label: "Touch: 4 things you can feel", icon: <Fingerprint className="text-emerald-400" /> },
    { label: "Hear: 3 things you can hear", icon: <Volume2 className="text-purple-400" /> },
    { label: "Smell: 2 things you can smell", icon: <Flower2 className="text-pink-400" /> },
    { label: "Taste: 1 thing you can taste", icon: <Coffee className="text-amber-400" /> },
  ];

  return (
    <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700 shadow-xl">
      <div className="text-center mb-8">
        <Wind className="mx-auto text-blue-400 mb-4 animate-pulse" size={48} />
        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Feeling Overwhelmed?</h2>
        <p className="text-slate-400 text-sm">Let's stay present together.</p>
      </div>
      
      <div className="flex flex-col items-center text-center">
        <motion.div 
          key={step}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 p-8 bg-slate-900 rounded-full"
        >
          {groundingSteps[step].icon}
        </motion.div>
        <motion.p 
          key={groundingSteps[step].label}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-medium mb-10 text-slate-100"
        >
          {groundingSteps[step].label}
        </motion.p>
        
        <button 
          onClick={() => setStep((prev) => (prev + 1) % 5)}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-white shadow-lg shadow-blue-900/30 transition-all active:scale-95"
        >
          {step === 4 ? "Restart Exercise" : "Next Step"}
        </button>
      </div>
    </div>
  );
};

const MeetingCard: React.FC<{ meeting: Meeting, onSelect: (m: Meeting) => void }> = ({ meeting, onSelect }) => {
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

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl space-y-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-black px-2 py-1 bg-blue-600/10 text-blue-500 rounded border border-blue-500/20 uppercase tracking-widest leading-none">
            {resource.category}
          </span>
          <h3 className="text-xl font-bold text-white mt-3">{resource.name}</h3>
        </div>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{resource.neighborhood}</div>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{resource.description}</p>
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <MapPin size={14} className="text-blue-500" />
          {resource.address}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Phone size={14} className="text-emerald-500" />
          {resource.phone}
        </div>
      </div>
      <a 
        href={resource.website} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/50"
      >
        <Eye size={16} /> VISIT WEBSITE
      </a>
    </motion.div>
  );
};

const SponsorCard: React.FC<{ sponsor: Sponsor, onReachOut: (s: Sponsor) => void }> = ({ sponsor, onReachOut }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/40 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Heart size={80} />
      </div>
      <div className="flex items-center gap-4 mb-5 relative z-1">
        <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center font-bold text-blue-400 text-2xl shadow-inner">
          {sponsor.name[0]}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
            {sponsor.name} 
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-blue-400 font-medium">{sponsor.years} Years Sober</p>
            {sponsor.isVerified && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600/10 border border-blue-500/20 rounded-md text-[9px] font-black uppercase tracking-widest text-blue-400">
                <BadgeCheck size={10} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-5 leading-relaxed italic">"{sponsor.bio}"</p>
      <div className="flex flex-wrap gap-2 mb-8 lowercase">
        {sponsor.specialties.map(tag => (
          <span key={tag} className="text-[10px] font-semibold bg-slate-900 border border-slate-700/50 px-2.5 py-1 rounded-full text-slate-300">#{tag}</span>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => onReachOut(sponsor)}
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          <MessageCircle size={20} /> Reach Out
        </button>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-6 py-4 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold transition-all"
        >
           {isExpanded ? <ChevronRight className="rotate-90" /> : <ChevronRight />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-6 pt-6 border-t border-slate-800"
          >
            <MentorReviews mentorId={sponsor.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MeetingMap = ({ lat, lng, name }: { lat: number, lng: number, name: string }) => {
  return (
    <div className="w-full h-48 sm:h-64 rounded-3xl overflow-hidden border border-slate-800 shadow-inner group relative">
      <Map
        defaultCenter={{ lat, lng }}
        defaultZoom={15}
        mapId="DEMO_MAP_ID"
        disableDefaultUI={true}
        gestureHandling={'greedy'}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
      >
        <AdvancedMarker position={{ lat, lng }} title={name}>
          <Pin background="#3b82f6" glyphColor="#fff" borderColor="#1e3a8a" />
        </AdvancedMarker>
      </Map>
      <div className="absolute top-4 left-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700 pointer-events-none">
        <p className="text-[10px] font-black text-white uppercase tracking-widest">Live Interactive Map</p>
      </div>
    </div>
  );
};

const MeetingDetailModal = ({ meeting, onClose, sponsors, onConnect, reminders, onToggleReminder, onLogAttendance, attendance, userProfile, userId }: { 
  meeting: Meeting, 
  onClose: () => void, 
  sponsors: Sponsor[], 
  onConnect: (s: Sponsor) => void,
  reminders: string[],
  onToggleReminder: (id: string) => void,
  onLogAttendance: (m: Meeting) => void,
  attendance: AttendanceRecord[],
  userProfile: UserProfile | null,
  userId: string
}) => {
  const transitLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${meeting.address}, Spokane, WA`)}&travelmode=transit`;

  const homeGroupSponsors = useMemo(() => {
    return sponsors.filter(s => meeting.sponsors?.includes(s.id));
  }, [meeting, sponsors]);

  const suggestedSponsors = useMemo(() => {
    if (homeGroupSponsors.length > 0) return [];
    
    // Logic for finding a suitable sponsor based on proximity or shared specialties
    return sponsors
      .filter(s => s.status === 'verified')
      .sort((a, b) => {
        // Priority 1: Same Neighborhood
        const aSameNeighborhood = a.neighborhood === meeting.neighborhood;
        const bSameNeighborhood = b.neighborhood === meeting.neighborhood;
        if (aSameNeighborhood && !bSameNeighborhood) return -1;
        if (!aSameNeighborhood && bSameNeighborhood) return 1;

        // Priority 2: Shared Specialties (simple keyword check)
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

          {/* LOG ATTENDANCE BUTTON */}
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

          {/* MEETING BUDDY BEACON */}
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
          
          {/* REVIEWS SECTION */}
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

const WarmHandshakeModal = ({ sponsor, onClose, onStartChat }: { sponsor: Sponsor, onClose: () => void, onStartChat: (text: string) => void }) => {
  const templates = [
    { id: 'crisis', label: 'Crisis Support', text: `I'm feeling a trigger and saw you specialize in ${sponsor.specialties[0]}. Can we talk?` },
    { id: 'intro', label: 'Intro Request', text: `I'm new to myRecovery and looking for a guide who understands ${sponsor.specialties[1] || sponsor.specialties[0]}.` },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1e293b] w-full max-w-md rounded-3xl p-8 border border-slate-700 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">Message {sponsor.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={20}/></button>
        </div>
        
        <p className="text-slate-400 mb-6 text-sm flex items-center gap-2">
          <ShieldAlert size={14} className="text-blue-400"/>
          Choose a pre-filled template to start securely.
        </p>

        <div className="space-y-4">
          {templates.map(t => (
            <button 
              key={t.id}
              className="w-full text-left p-6 bg-slate-800 hover:bg-slate-750 rounded-2xl border border-slate-700 transition-all hover:border-blue-500/50 shadow-sm"
              onClick={() => {
                onStartChat(t.text);
              }}
            >
              <span className="block font-black text-blue-400 mb-1.5 uppercase tracking-widest text-[10px]">{t.label}</span>
              <span className="text-sm italic text-slate-300 leading-relaxed font-medium">"{t.text}"</span>
            </button>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">End-to-End Encrypted Communication</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MoodLogger = ({ onLog }: { onLog: (mood: MoodEntry['mood'], note: string) => void }) => {
  const [note, setNote] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodEntry['mood'] | null>(null);

  const moods: { type: MoodEntry['mood'], icon: React.ReactNode, color: string, label: string }[] = [
    { type: 'great', icon: <Sparkles size={24} />, color: 'bg-emerald-500', label: 'Great' },
    { type: 'good', icon: <Smile size={24} />, color: 'bg-blue-500', label: 'Good' },
    { type: 'okay', icon: <Meh size={24} />, color: 'bg-slate-500', label: 'Okay' },
    { type: 'struggling', icon: <Frown size={24} />, color: 'bg-orange-500', label: 'Struggling' },
    { type: 'crisis', icon: <ShieldAlert size={24} />, color: 'bg-rose-500', label: 'Crisis' },
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-white italic tracking-tight">How are you today?</h3>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Daily Wellness Check-in</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {moods.map((m) => (
          <button
            key={m.type}
            onClick={() => setSelectedMood(m.type)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
              selectedMood === m.type 
                ? `${m.color} text-white scale-105 shadow-lg` 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            {m.icon}
            <span className="text-[8px] font-black uppercase tracking-tighter">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a private note about your day..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-all resize-none h-24"
        />
        <button
          onClick={() => {
            if (selectedMood) {
              onLog(selectedMood, note);
              setNote('');
              setSelectedMood(null);
            }
          }}
          disabled={!selectedMood}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
        >
          Save Daily Log
        </button>
      </div>
    </div>
  );
};

const RecoveryHub = ({ 
  daysSober, 
  moodLogs, 
  onLogMood,
  userProfile,
  topMatches,
  onSponsorClick,
  currentUser,
  tab,
  handleAIMentorMatch
}: { 
  daysSober: number, 
  moodLogs: MoodEntry[], 
  onLogMood: (mood: MoodEntry['mood'], note: string) => void,
  userProfile: UserProfile | null,
  topMatches: { sponsor: Sponsor, score: number }[],
  onSponsorClick: (sponsor: Sponsor) => void,
  currentUser: FirebaseUser | null,
  tab: string,
  handleAIMentorMatch: () => void
}) => {
  const milestones = [
    { label: '24 Hours', days: 1, icon: '🌟' },
    { label: '1 Week', days: 7, icon: '🔥' },
    { label: '1 Month', days: 30, icon: '💎' },
    { label: '3 Months', days: 90, icon: '🏆' },
    { label: '6 Months', days: 180, icon: '🛡️' },
    { label: '1 Year', days: 365, icon: '👑' },
  ];

  const nextMilestone = milestones.find(m => daysSober < m.days) || milestones[milestones.length - 1];
  const prevMilestoneDays = milestones.filter(m => daysSober >= m.days).pop()?.days || 0;
  const progressToNext = ((daysSober - prevMilestoneDays) / (nextMilestone.days - prevMilestoneDays)) * 100;

  // Calculate check-in streak (consecutive days of mood logs)
  const streak = useMemo(() => {
    if (moodLogs.length === 0) return 0;
    const dates = new Set(moodLogs.map(log => {
      const date = log.timestamp && typeof log.timestamp === 'object' && 'toDate' in log.timestamp 
        ? (log.timestamp as any).toDate() 
        : new Date();
      return date.toISOString().split('T')[0];
    }));
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    // If they haven't logged today, check from yesterday
    if (!dates.has(checkDate.toISOString().split('T')[0])) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (dates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return currentStreak;
  }, [moodLogs]);

  const points = userProfile?.points || 0;
  const rank = points >= 1000 ? 'Mentor' : points >= 500 ? 'Guide' : points >= 100 ? 'Contributor' : 'Newcomer';
  const rankColor = points >= 1000 ? 'text-amber-400' : points >= 500 ? 'text-blue-400' : points >= 100 ? 'text-emerald-400' : 'text-slate-400';

  return (
    <div className="space-y-8 pb-10">
      {/* PERSONALIZED WELCOME */}
      {userProfile && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800"
        >
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner relative">
            <Sparkles size={40} />
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[8px] font-black uppercase tracking-widest ${rankColor} shadow-xl`}>
              {rank}
            </div>
          </div>
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">
              Hey, {userProfile.name.split(' ')[0]}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Checking in from <span className="text-blue-400 font-bold">{userProfile.neighborhood}</span> today? 
              {userProfile.recoveryNeeds.length > 0 && (
                <> Focus: <span className="text-emerald-400 font-bold">{userProfile.recoveryNeeds[0]}</span></>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* MAIN SOBRIETY DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BIG CLOCK */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <Trophy size={160} />
          </div>
          
          <div className="relative z-10">
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Recovery Journey</p>
            <div className="flex items-baseline justify-center gap-3">
              <span className="text-8xl font-black text-white tracking-tighter drop-shadow-xl">{daysSober}</span>
              <span className="text-3xl font-black text-blue-200 uppercase tracking-tighter italic">Days</span>
            </div>

            {/* NEXT MILESTONE PROGRESS */}
            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black text-blue-200 uppercase">Next Milestone: {nextMilestone.label}</span>
                <span className="text-[10px] font-black text-white">{Math.floor(progressToNext)}%</span>
              </div>
              <div className="h-4 bg-blue-900/40 rounded-full overflow-hidden p-1 border border-blue-400/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                />
              </div>
              <p className="text-[9px] text-blue-100 font-bold italic opacity-75">
                {nextMilestone.days - daysSober} days until you unlock {nextMilestone.icon} {nextMilestone.label}
              </p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-blue-400/30 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[8px] text-blue-200 font-black uppercase tracking-widest whitespace-nowrap">Current Streak</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl font-black text-white">{streak}</span>
                <span className="text-[10px] font-bold text-orange-400 italic">🔥</span>
              </div>
            </div>
            <div className="text-center border-x border-blue-400/20 px-4">
              <p className="text-[8px] text-blue-200 font-black uppercase tracking-widest whitespace-nowrap">Total Wins</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl font-black text-white">{moodLogs.length}</span>
                <span className="text-[10px] font-bold text-emerald-400">🛡️</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-blue-200 font-black uppercase tracking-widest whitespace-nowrap">Community Points</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl font-black text-white">{userProfile?.points || 0}</span>
                <span className="text-[10px] font-bold text-amber-400">✨</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI REFLECTION CARD */}
        {currentUser && (
          <AIReflectionCard userId={currentUser.uid} moodLogs={moodLogs} />
        )}
      </div>

        {/* BADGES SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} /> Achievement Tiers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Badges</p>
              <div className="flex flex-wrap gap-3">
                {userProfile?.badges && userProfile.badges.length > 0 ? (
                  userProfile.badges.map((badge, idx) => (
                    <div key={idx} className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                      <span className="text-lg">🏅</span>
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{badge}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600 font-bold italic">No badges yet. Attend meetings to earn them!</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank Progression</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                  <span>Newcomer</span>
                  <span>Contributor (100)</span>
                  <span>Guide (500)</span>
                  <span>Mentor (1000)</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((points / 1000) * 100, 100)}%` }}
                    className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-bold italic">
                  {points < 100 ? `${100 - points} points to Contributor` : 
                   points < 500 ? `${500 - points} points to Guide` :
                   points < 1000 ? `${1000 - points} points to Mentor` :
                   "Maximum Rank Reached!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SMART MENTOR MATCHING */}
      {tab === 'sponsors' && userProfile?.recoveryNeeds && userProfile.recoveryNeeds.length > 0 && (
        <div className="px-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles size={100} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
                  <Heart className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">AI Mentor Match</h3>
              </div>
              <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-xs">
                Let Gemini find the perfect mentor based on your recovery needs: 
                <span className="font-bold"> {userProfile.recoveryNeeds.join(', ')}</span>.
              </p>
              <button 
                onClick={handleAIMentorMatch}
                className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95 flex items-center gap-2"
              >
                Find My Best Match <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEIGHBORHOOD FEED */}
      {userProfile?.neighborhood && (
        <NeighborhoodFeed 
          neighborhood={userProfile.neighborhood} 
          userId={currentUser?.uid || ''}
          userProfile={userProfile}
        />
      )}

      {/* RECOMMENDED SPONSORS */}
      {topMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <UserCheck className="text-blue-500" size={20} /> Top Mentor Matches
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMatches.map(({ sponsor, score }) => (
              <button 
                key={sponsor.id}
                onClick={() => onSponsorClick(sponsor)}
                className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all text-left group shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <BadgeCheck size={24} />
                  </div>
                  <div className="px-3 py-1 bg-blue-600/10 rounded-full">
                    <span className="text-[10px] font-black text-blue-500 uppercase">{score > 4 ? 'Best' : 'Great'} Match</span>
                  </div>
                </div>
                <h4 className="text-lg font-black text-white italic leading-tight mb-1">{sponsor.name}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">{sponsor.neighborhood} • {sponsor.years}yrs Strong</p>
                <div className="flex flex-wrap gap-1.5 line-clamp-1 mb-4">
                  {sponsor.specialties.slice(0, 2).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-800 rounded-md text-[9px] font-black text-slate-400 border border-slate-700 uppercase">{s}</span>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Connect Now</span>
                  <ChevronRight size={16} className="text-slate-700" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MOOD TREND */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
            <TrendingUp className="text-blue-500" /> Daily Pulse
          </h2>
          <MoodLogger onLog={onLogMood} />
          
          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-[2rem] space-y-4">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Logs</h4>
             {moodLogs.length === 0 ? (
               <p className="text-xs text-slate-600 font-bold italic">No logs yet. Start today!</p>
             ) : (
               <div className="space-y-3">
                 {moodLogs.slice(0, 3).map(log => (
                   <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-800">
                     <div className={`p-2 rounded-lg ${
                       log.mood === 'great' ? 'bg-emerald-500/20 text-emerald-500' :
                       log.mood === 'good' ? 'bg-blue-500/20 text-blue-500' :
                       log.mood === 'okay' ? 'bg-slate-500/20 text-slate-500' :
                       log.mood === 'struggling' ? 'bg-orange-500/20 text-orange-500' :
                       'bg-rose-500/20 text-rose-500'
                     }`}>
                       {log.mood === 'great' ? <Sparkles size={16} /> :
                        log.mood === 'good' ? <Smile size={16} /> :
                        log.mood === 'okay' ? <Meh size={16} /> :
                        log.mood === 'struggling' ? <Frown size={16} /> :
                        <ShieldAlert size={16} />}
                     </div>
                     <div className="flex-1">
                       <p className="text-xs font-bold text-slate-100 line-clamp-1">{log.note || 'No note added'}</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                         {log.timestamp && typeof log.timestamp === 'object' && 'toDate' in log.timestamp ? (log.timestamp as any).toDate().toLocaleDateString() : 'Just now'}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* MILESTONES */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
            <Trophy className="text-amber-500" /> Milestones
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {milestones.map((m) => {
              const isUnlocked = daysSober >= m.days;
              return (
                <div 
                  key={m.label}
                  className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden ${
                    isUnlocked 
                      ? 'bg-slate-800/80 border-amber-500/30' 
                      : 'bg-slate-900/30 border-slate-800 grayscale'
                  }`}
                >
                  <div className="text-3xl mb-2">{m.icon}</div>
                  <h4 className="text-sm font-black text-white uppercase">{m.label}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{m.days} Days</p>
                  {isUnlocked && <BadgeCheck size={16} className="absolute top-4 right-4 text-amber-500" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatView = ({ session, messages, currentUser, onBack, onSendMessage, onTyping }: { 
  session: ChatSession, 
  messages: Message[], 
  currentUser: FirebaseUser | null,
  onBack: () => void,
  onSendMessage: (text: string) => void,
  onTyping: (isTyping: boolean) => void
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] flex flex-col h-[70vh] overflow-hidden shadow-2xl relative">
       <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0f172a]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><ArrowLeft size={20}/></button>
            <div>
              <h3 className="font-bold text-white leading-none mb-1">
                {currentUser?.uid === session.userId ? session.mentorName : session.userName}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-blue-500" /> Peer Support Connection
              </p>
            </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-30">
               <MessageCircle size={48} />
               <p className="text-sm font-medium">Say hi to start your support journey.</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isOwn = m.senderId === currentUser?.uid;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={m.id || idx} 
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${isOwn ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                    {m.text}
                    {m.timestamp && (
                      <p className={`text-[8px] mt-1 font-bold ${isOwn ? 'text-blue-200' : 'text-slate-500'}`}>
                        {(m.timestamp as any)?.toDate?.() ? (m.timestamp as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
       </div>

       <form onSubmit={handleSend} className="p-6 bg-[#0f172a]/95 border-t border-slate-800 flex gap-2">
          <input 
            type="text" 
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping(true);
            }}
            onBlur={() => onTyping(false)}
            placeholder="Write a message..."
            className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
          />
          <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg active:scale-95">
            <Send size={20} />
          </button>
       </form>
    </div>
  );
};

const AISupportView = ({ currentUser, moodLogs }: { currentUser: FirebaseUser | null, moodLogs: MoodEntry[] }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hello! I'm your Spokane Recovery Guide. How's your journey going today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);
  const [anxietyDetected, setAnxietyDetected] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Vibe Check Logic
  useEffect(() => {
    if (messages.length > 3 || moodLogs.length > 0) {
      const checkMood = async () => {
        try {
          const res = await fetch('/api/ai/analyze-mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              moodLogs: moodLogs.slice(-5), 
              chatHistory: messages.slice(-5) 
            })
          });
          const data = await res.json();
          if (data.triggerVibeCheck) {
            setAnxietyDetected(true);
            setMessages(prev => [...prev, { 
              role: 'model', 
              text: `⚠️ Vibe Check: ${data.recommendation}. Would you like to try a 1-minute grounding exercise?` 
            }]);
          }
        } catch (e) {
          console.error("Mood analysis failed");
        }
      };
      const timer = setTimeout(checkMood, 15000); // Check after some interaction
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userMsg, 
          history: messages,
          isCrisis 
        })
      });
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a little trouble connecting. Check your local Spokane resources or reach out to a peer mentor!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-slate-900/50 border rounded-[2.5rem] flex flex-col h-[70vh] overflow-hidden transition-all duration-500 ${isCrisis ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-slate-800'}`}>
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className={isCrisis ? 'text-rose-500' : 'text-blue-500'} />
          <div>
            <h3 className="font-bold text-white">{isCrisis ? 'Crisis Assistant' : 'Recovery Guide'}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {isCrisis ? 'Safety Mode Active' : 'AI Assistance • Gemini'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsCrisis(!isCrisis)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCrisis ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          {isCrisis ? 'Deactivate Crisis Mode' : 'I am in Crisis'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isCrisis && messages.length === 1 && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-4">
            <p className="text-xs text-rose-400 font-bold leading-relaxed">
              🆘 Crisis mode active. I will prioritize immediate safety strategies and help you ground yourself. Remember you can call 988 at any time.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none animate-pulse text-slate-500 italic text-xs">
              Thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={handleSend} className="p-6 border-t border-slate-800 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about local resources, coping tips..."
          className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-2xl text-sm focus:outline-none focus:border-blue-500 text-white"
        />
        <button type="submit" disabled={isLoading} className="p-4 bg-blue-600 text-white rounded-2xl disabled:opacity-50">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default function App() {
  const [tab, setTab] = useState<'meetings' | 'sponsors' | 'crisis' | 'profile' | 'admin' | 'apply' | 'chat' | 'resources' | 'hub' | 'ai'>('meetings');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [userNeeds, setUserNeeds] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [sobrietyDate, setSobrietyDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');

  useEffect(() => {
    if (userProfile?.neighborhood && selectedNeighborhood === 'All') {
      setSelectedNeighborhood(userProfile.neighborhood);
    }
  }, [userProfile?.neighborhood]);

  useEffect(() => {
    if (!currentUser) {
      setAttendance([]);
      return;
    }

    const q = query(
      collection(db, 'users', currentUser.uid, 'attendance'),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendance(records);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}/attendance`));
  }, [currentUser]);

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [reachingOutTo, setReachingOutTo] = useState<Sponsor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotifications, setAdminNotifications] = useState(0);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState<string | null>(null);
  const [editBio, setEditBio] = useState('');
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [reminders, setReminders] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{id: string, text: string, type?: 'info' | 'success' | 'alert'}[]>([]);

  const showToast = (text: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [moodLogs, setMoodLogs] = useState<MoodEntry[]>([]);
  const [isGroundingActive, setIsGroundingActive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUserProfiles, setAllUserProfiles] = useState<(UserProfile & { uid: string })[]>([]);

  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        if (payload.notification) {
          triggerSystemNotification(
            payload.notification.title || 'New Message',
            payload.notification.body || ''
          );
        }
      });
      return unsubscribe;
    }
  }, []);

  const incompleteProfile = useMemo(() => {
    if (!userProfile) return false;
    return !userProfile.neighborhood || (userProfile.recoveryNeeds || []).length === 0;
  }, [userProfile]);

  const isMentor = useMemo(() => userProfile?.role === 'mentor', [userProfile]);

  const activeChat = useMemo(() => {
    return chatSessions.find(s => s.id === activeChatId);
  }, [chatSessions, activeChatId]);

  const activeSponsor = useMemo(() => {
    if (!activeChat) return null;
    return sponsors.find(s => s.id === activeChat.sponsorId);
  }, [activeChat, sponsors]);

  const unreadCount = useMemo(() => {
    return chatSessions.filter(s => {
      if (!currentUser) return false;
      const lastRead = s.lastRead?.[currentUser.uid] || 0;
      const lastMsgAt = s.lastMessageAt instanceof Timestamp ? s.lastMessageAt.toMillis() : s.lastMessageAt;
      return lastMsgAt > lastRead;
    }).length;
  }, [chatSessions, currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setIsSuperAdmin(user.email === SUPER_ADMIN_EMAIL);
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const profile: UserProfile = {
              email: user.email || '',
              name: user.displayName || 'Anonymous Player',
              photoURL: user.photoURL || '',
              sobrietyDate: new Date().toISOString().split('T')[0],
              recoveryNeeds: [],
              role: 'user'
            };
            await setDoc(userDocRef, profile);
            setUserProfile(profile);
          } else {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
        setIsSuperAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('name', 'asc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Meeting[];
      setMeetings(list.length > 0 ? list : INITIAL_MEETINGS);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'sponsors'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sponsor[];
      setSponsors(list.length > 0 ? list : INITIAL_SPONSORS);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'), 
      or(where('userId', '==', currentUser.uid), where('mentorUserId', '==', currentUser.uid)),
      orderBy('lastMessageAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setChatSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession)));
    });
  }, [currentUser]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, 'chats', activeChatId, 'messages'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
  }, [activeChatId]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users', currentUser.uid, 'moodLogs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setMoodLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as MoodEntry)));
    });
  }, [currentUser]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snap) => {
      setAllUserProfiles(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile & { uid: string })));
    });
  }, [isSuperAdmin]);

  const triggerSystemNotification = (title: string, body: string) => {
    showToast(`${title}: ${body}`, "info");
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'auth');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      setResetSent(true);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleResendVerification = async () => {
    if (currentUser) {
      setVerificationLoading(true);
      try {
        await sendEmailVerification(currentUser);
        setVerificationSent(true);
        showToast("Verification email sent!", "success");
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'auth');
      } finally {
        setVerificationLoading(false);
      }
    }
  };

  const checkVerification = async () => {
    if (currentUser) {
      await currentUser.reload();
      setCurrentUser({ ...auth.currentUser! });
    }
  };

  const daysSober = useMemo(() => {
    if (!userProfile?.sobrietyDate) return 0;
    const start = new Date(userProfile.sobrietyDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [userProfile?.sobrietyDate]);

  const handleUpdateSponsor = async (id: string, updates: Partial<Sponsor>) => {
    try {
      await updateDoc(doc(db, 'sponsors', id), updates);
      showToast("Profile Updated!", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `sponsors/${id}`);
    }
  };

  const handleVerifySponsor = async (id: string) => {
    if (!currentUser) return;
    await handleUpdateSponsor(id, { 
      isVerified: true, 
      status: 'verified',
      verifiedAt: serverTimestamp(),
      verifiedBy: currentUser.email || currentUser.uid
    });
  };

  const handleRejectSponsor = async (id: string) => {
    if (!currentUser) return;
    await handleUpdateSponsor(id, { 
      isVerified: false, 
      status: 'rejected',
      verifiedAt: serverTimestamp(),
      verifiedBy: currentUser.email || currentUser.uid
    });
  };

  const toggleEditSpecialty = (spec: string) => {
    setEditSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleApplySponsor = async (app: Omit<Sponsor, 'id' | 'isVerified' | 'status' | 'userId'>) => {
    if (!currentUser) return;
    if (!currentUser.emailVerified) {
      showToast("Verification required to apply", "alert");
      handleResendVerification();
      return;
    }
    try {
      await addDoc(collection(db, 'sponsors'), {
        ...app,
        userId: currentUser.uid,
        isVerified: false,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setTab('meetings');
      triggerSystemNotification('Application Sent', 'The Spokane Admin team will review your mentor profile shortly.');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'sponsors');
    }
  };

  const handleStartChat = async (sponsor: Sponsor, initialText: string) => {
    if (!currentUser) {
      setTab('profile');
      return;
    }

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('userId', '==', currentUser.uid), where('sponsorId', '==', String(sponsor.id)));
      const snap = await getDocs(q);
      
      let chatId = '';
      if (snap.empty) {
        const newChat = await addDoc(chatsRef, {
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Member',
          mentorUserId: sponsor.userId,
          sponsorId: String(sponsor.id),
          sponsorName: sponsor.name,
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        chatId = newChat.id;
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: currentUser.uid,
          text: initialText,
          timestamp: serverTimestamp()
        });
      } else {
        chatId = snap.docs[0].id;
      }
      
      setActiveChatId(chatId);
      setReachingOutTo(null);
      setTab('chat');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'chats');
    }
  };

  const handleLogMood = async (mood: MoodEntry['mood'], note: string) => {
    if (!currentUser) return;
    if (!currentUser.emailVerified) {
      showToast("Verification required to log mood", "alert");
      handleResendVerification();
      return;
    }
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'moodLogs'), {
        userId: currentUser.uid,
        mood,
        note,
        timestamp: serverTimestamp()
      });
      triggerSystemNotification('Mood Logged', 'Stay consistent. You are doing great.');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${currentUser.uid}/moodLogs`);
    }
  };

  const handleUpdateUserRole = async (targetUid: string, newRole: 'user' | 'mentor' | 'admin') => {
    if (!isSuperAdmin) return;
    try {
      await updateDoc(doc(db, 'users', targetUid), {
        role: newRole
      });
      triggerSystemNotification('Success', `User role updated to ${newRole}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleEnableNotifications = async () => {
    if (!currentUser) return;
    const token = await requestForToken();
    if (token) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          fcmToken: token,
          notificationsEnabled: true
        });
        setNotificationPermission('granted');
        showToast("Push notifications enabled!", "success");
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    } else {
      showToast("Could not enable notifications. Please check site settings.", "alert");
    }
  };

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        handleEnableNotifications();
      } else if (Notification.permission === 'granted') {
        handleEnableNotifications();
      } else {
        showToast("Notifications are blocked in your browser settings.", "alert");
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !currentUser) return;
    try {
      const chatRef = doc(db, 'chats', activeChatId);
      await addDoc(collection(chatRef, 'messages'), {
        senderId: currentUser.uid,
        text,
        timestamp: serverTimestamp()
      });
      await updateDoc(chatRef, { 
        lastMessageAt: serverTimestamp(),
        [`lastRead.${currentUser.uid}`]: serverTimestamp(),
        [`typingStatus.${currentUser.uid}`]: false
      });
      showToast("Message sent", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `chats/${activeChatId}/messages`);
    }
  };

  const handleUpdateTyping = async (isTyping: boolean) => {
    if (!activeChatId || !currentUser) return;
    try {
      await updateDoc(doc(db, 'chats', activeChatId), {
        [`typingStatus.${currentUser.uid}`]: isTyping
      });
    } catch (e) {
      // Ignore
    }
  };

  const toggleNeed = async (need: string) => {
    if (!currentUser) return;
    const newNeeds = userNeeds.includes(need) ? userNeeds.filter(n => n !== need) : [...userNeeds, need];
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        recoveryNeeds: newNeeds
      });
      setUserNeeds(newNeeds);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdateSobrietyDate = async (date: string) => {
    if (!currentUser) return;
    setSobrietyDate(date);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        sobrietyDate: date
      });
      setUserProfile(prev => prev ? { ...prev, sobrietyDate: date } : prev);
      showToast("Sobriety date updated!", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdateNeighborhood = async (neighborhood: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        neighborhood
      });
      setUserProfile(prev => prev ? { ...prev, neighborhood } : prev);
      triggerSystemNotification('Location Updated', `Preferences set to ${neighborhood}. Matching updated.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : prev);
      showToast("Profile updated!", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleAIMentorMatch = async () => {
    if (!userProfile?.recoveryNeeds || sponsors.length === 0) return;
    showToast("Analyzing community members...", "info");
    try {
      const response = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userNeeds: userProfile.recoveryNeeds, 
          mentors: sponsors.map(s => ({ id: s.id, name: s.name, bio: s.bio, specialties: s.specialties }))
        })
      });
      if (!response.ok) throw new Error('Match failed');
      const data = await response.json();
      
      const matchText = data.match;
      const matchedSponsor = sponsors.find(s => matchText.includes(s.id) || matchText.includes(s.name));
      
      if (matchedSponsor) {
        setReachingOutTo(matchedSponsor);
        showToast(`AI Recommends: ${matchedSponsor.name}`, "success");
      } else {
        triggerSystemNotification("AI Recommendation", matchText);
      }
    } catch (e) {
      showToast("Could not complete matching", "alert");
    }
  };

  const handleLogAttendance = async (meeting: Meeting) => {
    if (!currentUser) {
      showToast("Please sign in to log attendance", "alert");
      return;
    }

    if (!currentUser.emailVerified) {
      showToast("Verification required to log attendance", "alert");
      handleResendVerification();
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const alreadyLogged = attendance.some(a => a.meetingId === meeting.id && a.date === today);
    if (alreadyLogged) {
      showToast("Already logged this meeting today!", "info");
      return;
    }

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'attendance'), {
        meetingId: meeting.id,
        meetingName: meeting.name,
        date: today,
        timestamp: serverTimestamp()
      });

      // Award Community Points
      if (userProfile && currentUser) {
        const newPoints = (userProfile.points || 0) + 10;
        const newBadges = [...(userProfile.badges || [])];
        
        // Potential badge award
        // Fetch total attendance count to see if they reached 5
        const attendanceSnap = await getDocs(collection(db, 'users', currentUser.uid, 'attendance'));
        if (attendanceSnap.size >= 5 && !newBadges.includes('Meeting Warrior')) {
          newBadges.push('Meeting Warrior');
          showToast("Achievement Unlocked: Meeting Warrior! 🛡️", "success");
        }

        await updateDoc(doc(db, 'users', currentUser.uid), {
          points: increment(10),
          badges: newBadges
        });
        showToast("Logged! +10 Community Points", "success");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/attendance`);
    }
  };

  const topMatches = useMemo(() => {
    if (userNeeds.length === 0) return [];
    return sponsors
      .filter(s => s.status === 'verified')
      .map(s => {
        let score = 0;
        userNeeds.forEach(need => { if (s.specialties.includes(need)) score += 2; });
        if (userProfile?.neighborhood && s.neighborhood === userProfile.neighborhood) score += 3;
        return { sponsor: s, score };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [sponsors, userNeeds, userProfile?.neighborhood]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
      const matchNeighborhood = selectedNeighborhood === 'All' || m.neighborhood === selectedNeighborhood;
      return matchSearch && matchNeighborhood;
    });
  }, [meetings, searchQuery, selectedNeighborhood]);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
      <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-28 font-sans selection:bg-blue-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40">
                <ShieldCheck size={24} className="text-white" />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">Sober Spokane</h1>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em]">Community Support Network</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {currentUser && userProfile && <SOSButton userProfile={userProfile} userId={currentUser.uid} />}
            <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors relative">
               <Bell size={20} />
               {reminders.length > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full border border-[#0f172a]" />}
            </button>
            <button onClick={() => setTab('profile')} className="w-11 h-11 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
               {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{currentUser?.email?.[0].toUpperCase() || '?'}</div>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-8">
        {currentUser && !currentUser.emailVerified && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-600/10 border border-amber-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                <AlertCircle size={24} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white italic uppercase tracking-tight">Verify Your Email</h4>
                <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest mt-0.5">Please check your inbox for the verification link.</p>
              </div>
            </div>
            <button 
              onClick={handleResendVerification}
              disabled={verificationLoading || verificationSent}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20"
            >
              {verificationLoading ? 'Sending...' : verificationSent ? 'Email Sent ✓' : 'Resend Verification'}
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'meetings' && (
            <motion.div key="meetings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search meetings by name or area..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-5 pl-14 rounded-3xl text-sm focus:outline-none focus:border-blue-500 transition-all text-white shadow-inner"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', ...SPOKANE_NEIGHBORHOODS].map(n => (
                      <button 
                        key={n}
                        onClick={() => setSelectedNeighborhood(n)}
                        className={`px-6 py-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${selectedNeighborhood === n ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMeetings.map(m => (
                    <MeetingCard key={m.id} meeting={m} onSelect={setSelectedMeeting} />
                  ))}
                </div>
                {filteredMeetings.length === 0 && (
                  <div className="py-20 text-center space-y-4 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
                     <Search size={48} className="mx-auto text-slate-800" />
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No meetings found in this area.</p>
                  </div>
                )}
              </div>
              <AdBanner />
            </motion.div>
          )}

          {tab === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <RecoveryHub 
                daysSober={daysSober} 
                moodLogs={moodLogs} 
                onLogMood={handleLogMood}
                userProfile={userProfile}
                topMatches={topMatches}
                onSponsorClick={(s) => { setReachingOutTo(s); setTab('sponsors'); }}
                currentUser={currentUser}
                tab={tab}
                handleAIMentorMatch={handleAIMentorMatch}
              />
            </motion.div>
          )}

          {tab === 'sponsors' && (
            <motion.div key="sponsors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">All Verified Sponsors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sponsors.filter(s => s.status === 'verified').map(s => (
                    <SponsorCard key={s.id} sponsor={s} onReachOut={setReachingOutTo} />
                  ))}
                  <NativeAd />
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-[2rem] text-center">
                <Heart size={32} className="text-rose-500 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Want to help?</h3>
                <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto leading-relaxed uppercase tracking-wider font-bold">Verified sponsors must have 2+ years of continuous recovery.</p>
                <button onClick={() => setTab('apply')} className="text-blue-500 font-black tracking-widest text-[10px] uppercase border border-blue-500/30 px-6 py-2.5 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-black/20">Apply as a Mentor</button>
              </div>
            </motion.div>
          )}

          {tab === 'crisis' && (
            <motion.div key="crisis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <GroundingTool />
              <div className="grid gap-4">
                <a href="tel:18772661818" className="flex items-center justify-between p-7 bg-rose-600 rounded-[2rem] text-white">
                  <div><h3 className="text-xl font-black mb-1">Spokane Regional Crisis</h3><p className="text-rose-100 text-sm">Available 24/7</p></div>
                  <Phone size={32} />
                </a>
              </div>
              <button onClick={() => setTab('meetings')} className="w-full text-slate-500 text-sm font-black uppercase tracking-[0.2em] py-8">Exit Crisis Dashboard</button>
            </motion.div>
          )}

          {tab === 'ai' && <AISupportView currentUser={currentUser} moodLogs={moodLogs} />}

          {tab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-6 pb-32"
            >
              <SpokaneResources />
            </motion.div>
          )}

          {tab === 'chat' && (
            <>
              {activeChatId && activeChat ? (
                <ChatView session={activeChat} messages={messages} currentUser={currentUser} onBack={() => setActiveChatId(null)} onSendMessage={handleSendMessage} onTyping={handleUpdateTyping} />
              ) : (
                <ChatList chats={chatSessions.map(c => ({ ...c, sponsor: sponsors.find(s => s.id === c.sponsorId) }))} onSelectChat={(id) => setActiveChatId(id)} currentUserId={currentUser?.uid} />
              )}
            </>
          )}

          {tab === 'apply' && <SponsorApplicationForm onSubmit={handleApplySponsor} onCancel={() => setTab('sponsors')} />}

          {tab === 'admin' && <AdminDashboard pendingSponsors={sponsors.filter(s => s.status === 'pending')} onApprove={handleVerifySponsor} onReject={handleRejectSponsor} allSponsors={sponsors} allUserProfiles={allUserProfiles} onUpdateRole={handleUpdateUserRole} />}

          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="space-y-10">
              {!currentUser ? (
                <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
                  {resetSent ? (
                    <div className="text-center space-y-6 py-4">
                      <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                        <Mail className="text-blue-500" size={32} />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Check Your Inbox</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                          We've sent a link to {email}.<br />Please check your email to continue.
                        </p>
                      </div>
                      <button 
                        onClick={() => { setResetSent(false); setAuthMode('login'); }}
                        className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                      >
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">{authMode === 'login' ? 'Welcome Back' : 'Join the Network'}</h2>
                      </div>
                      {authError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 text-[10px] font-bold uppercase text-center">
                          {authError}
                        </div>
                      )}
                      <form onSubmit={authMode === 'login' ? handleEmailLogin : handleSignup} className="space-y-4">
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all" required />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all" required />
                        {authMode === 'login' && (
                          <button type="button" onClick={handleResetPassword} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-blue-400 block ml-auto px-1">Forgot Password?</button>
                        )}
                        <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95">{authMode === 'login' ? 'Sign In' : 'Sign Up'}</button>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                          <div className="relative flex justify-center text-[8px] uppercase font-black text-slate-700"><span className="bg-slate-900 px-4">OR</span></div>
                        </div>
                        <button type="button" onClick={handleLogin} className="w-full py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                          <LogIn size={18} /> Continue with Google
                        </button>
                        <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all pt-2">
                          {authMode === 'login' ? 'New to Spokane Recovery? Sign Up' : 'Already have an account? Sign In'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800/20 rounded-[2rem] border border-slate-800 p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">Community Identity</h3>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Display Alias</label>
                        <input 
                          type="text" 
                          value={userProfile?.alias || ''}
                          onChange={(e) => handleUpdateProfile({ alias: e.target.value })}
                          placeholder={userProfile?.name?.split(' ')[0]}
                          className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                      {userProfile?.role === 'mentor' && (
                        <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">Emergency Response</p>
                            <p className="text-[9px] text-slate-500 italic">Available for SOS alerts</p>
                          </div>
                          <input 
                            type="checkbox"
                            checked={userProfile?.isCrisisAvailable || false}
                            onChange={(e) => handleUpdateProfile({ isCrisisAvailable: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-rose-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2"><MapPin size={14} /> My Neighborhood</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Downtown', 'South Hill', 'North Side', 'Valley', 'West Plains', 'Airway Heights'].map(n => (
                        <button key={n} onClick={() => handleUpdateNeighborhood(n)} className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${userProfile?.neighborhood === n ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 mb-4 flex items-center gap-2"><Clock size={14} /> Recovery Progress</h3>
                    <input type="date" value={sobrietyDate} onChange={(e) => handleUpdateSobrietyDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-center font-bold text-white shadow-sm" />
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2"><Bell size={14} /> Notifications</h3>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">Push Notifications</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">Alerts for messages & meetings</p>
                      </div>
                      <button 
                        onClick={handleRequestPermission}
                        className={`w-14 h-8 rounded-full p-1 transition-all flex ${userProfile?.notificationsEnabled && notificationPermission === 'granted' ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'}`}
                      >
                        <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-sm" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2"><Calendar size={14} /> My Meeting History ({attendance.length})</h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden divide-y divide-slate-800">
                      {attendance.slice(0, 5).map(record => (
                        <div key={record.id} className="p-5 flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-white">{record.meetingName}</h4>
                            <p className="text-[10px] text-slate-500">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                          <div className="px-3 py-1 bg-blue-600/10 rounded-full border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-tighter">+1 Win</div>
                        </div>
                      ))}
                      {attendance.length === 0 && <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase">No meetings logged.</div>}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-800">
                    <button onClick={handleLogout} className="w-full py-5 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-950/20">Sign Out</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-slate-800/80 flex justify-around items-center z-50 shadow-2xl safe-area-bottom">
        {[
          { id: 'meetings', icon: MapPin, label: 'Maps' },
          { id: 'hub', icon: Trophy, label: 'Hub' },
          { id: 'sponsors', icon: UserCheck, label: 'Partners' },
          { id: 'resources', icon: Heart, label: 'Bento' },
          { id: 'ai', icon: Sparkles, label: 'Guide' },
          { id: 'chat', icon: Mail, label: 'Inbox', badge: unreadCount },
          { id: 'profile', icon: Settings2, label: 'More' }
        ].map((n: any) => (
          <button key={n.id} onClick={() => setTab(n.id as any)} className={`flex flex-col items-center gap-1 transition-all relative ${tab === n.id ? (n.color || 'text-blue-500') + ' scale-110' : 'text-slate-500'}`}>
            <n.icon size={22} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{n.label}</span>
            {n.badge > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-[#0f172a]" />}
            {tab === n.id && <motion.div layoutId="nav-dot" className={`absolute -bottom-2 w-1 h-1 rounded-full ${n.color?.replace('text', 'bg') || 'bg-blue-500'}`} />}
          </button>
        ))}
        {isSuperAdmin && <button onClick={() => setTab('admin')} className={`flex flex-col items-center gap-1 transition-all ${tab === 'admin' ? 'text-amber-500 scale-110' : 'text-slate-500'}`}><ShieldCheck size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">Admin</span></button>}
      </nav>

      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsGroundingActive(true)} className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 border border-blue-500/30"><Wind size={28} /></motion.button>
      </div>

      <AnimatePresence>
        {isGroundingActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="w-full max-w-sm relative">
              <button onClick={() => setIsGroundingActive(false)} className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white"><X size={24} /></button>
              <GroundingTool />
            </div>
          </motion.div>
        )}
        {selectedMeeting && (
          <MeetingDetailModal 
            meeting={selectedMeeting} 
            onClose={() => setSelectedMeeting(null)} 
            sponsors={sponsors} 
            onConnect={setReachingOutTo} 
            reminders={reminders} 
            onToggleReminder={toggleReminder} 
            onLogAttendance={handleLogAttendance} 
            attendance={attendance} 
            userProfile={userProfile}
            userId={currentUser?.uid || ''}
          />
        )}
        {reachingOutTo && (
          <WarmHandshakeModal sponsor={reachingOutTo} onClose={() => setReachingOutTo(null)} onStartChat={(text) => handleStartChat(reachingOutTo, text)} />
        )}
      </AnimatePresence>
      <Analytics />
    </div>
    </APIProvider>
  );
}
