/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
} from './lib/firebase';
import { 
  signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser,
  sendEmailVerification, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, setDoc, onSnapshot, collection, query, where, orderBy, 
  serverTimestamp, updateDoc, addDoc, getDoc, getDocs, deleteDoc,
  Timestamp, or
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
        <span className={`text-[10px] font-black px-2 py-1 bg-slate-900 rounded border border-slate-700 ${meeting.fellowship === 'AA' ? 'text-blue-400' : 'text-purple-400'}`}>
          {meeting.fellowship}
        </span>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{meeting.neighborhood}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{meeting.name}</h3>
      <div className="flex flex-col gap-1 mb-6 text-slate-400 text-sm">
        <p className="flex items-center gap-1.5"><Clock size={14} /> {meeting.day} at {meeting.time}</p>
        <p className="flex items-center gap-1.5 line-clamp-1"><MapPin size={14} /> {meeting.address}</p>
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

const MeetingDetailModal = ({ meeting, onClose, sponsors, onConnect, reminders, onToggleReminder }: { 
  meeting: Meeting, 
  onClose: () => void, 
  sponsors: Sponsor[], 
  onConnect: (s: Sponsor) => void,
  reminders: string[],
  onToggleReminder: (id: string) => void
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
              <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                {meeting.fellowship} • {meeting.format}
              </span>
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
  onLogMood 
}: { 
  daysSober: number, 
  moodLogs: MoodEntry[], 
  onLogMood: (mood: MoodEntry['mood'], note: string) => void 
}) => {
  const milestones = [
    { label: '24 Hours', days: 1, icon: '🌟' },
    { label: '1 Week', days: 7, icon: '🔥' },
    { label: '1 Month', days: 30, icon: '💎' },
    { label: '3 Months', days: 90, icon: '🏆' },
    { label: '6 Months', days: 180, icon: '🛡️' },
    { label: '1 Year', days: 365, icon: '👑' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* SOBRIETY CLOCK */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
          <Trophy size={120} />
        </div>
        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Total Time in Recovery</p>
        <div className="flex items-baseline justify-center gap-3">
          <span className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">{daysSober}</span>
          <span className="text-2xl font-black text-blue-200 uppercase tracking-tighter italic">Days</span>
        </div>
        <div className="mt-8 pt-6 border-t border-blue-400/30 flex justify-between items-center px-4">
          <div className="text-left">
            <p className="text-[9px] text-blue-200 font-black uppercase">Current Streak</p>
            <p className="text-sm font-bold text-white">Spokane Strong</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-blue-200 font-black uppercase">Community Rank</p>
            <p className="text-sm font-bold text-white">Consistent Guide</p>
          </div>
        </div>
      </div>

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
                         {log.timestamp instanceof Timestamp ? log.timestamp.toDate().toLocaleDateString() : 'Just now'}
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
                  <div className="text-3xl mb-3">{m.icon}</div>
                  <h4 className={`text-sm font-black uppercase tracking-tight ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                    {m.label}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">
                    {isUnlocked ? 'Achieved' : `${m.days - daysSober} days left`}
                  </p>
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <BadgeCheck size={16} className="text-amber-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group cursor-pointer hover:bg-slate-900 transition-all border-dashed">
            <div className="p-4 bg-slate-900 rounded-2xl group-hover:bg-blue-600/10 transition-all">
              <Calendar className="text-slate-500 group-hover:text-blue-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-300">Share Progress</h4>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">Generate recovery badge</p>
            </div>
            <ChevronRight className="ml-auto text-slate-700 group-hover:text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

// SponsorshipApplicationForm removed - now in a separate file

const AISupportView = ({ currentUser }: { currentUser: any }) => {
  const { isAdReady, showAd } = useRewardedAd();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userText,
          history: messages 
        })
      });
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a little trouble connecting right now. Please try again or reach out to a human mentor." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-[calc(100vh-180px)] bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-black text-white text-base leading-none italic">Sober Spokane AI</h3>
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">24/7 Recovery Support</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdReady && (
            <button 
              onClick={showAd}
              title="Watch a short ad to support our recovery mission"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 border border-rose-500/20 rounded-full text-rose-500 hover:bg-rose-600 hover:text-white transition-all group shadow-sm shadow-rose-900/10"
            >
              <Heart size={12} className="fill-current animate-pulse group-hover:animate-none" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Support Us</span>
            </button>
          )}
          <div className="hidden sm:block px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700/50">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Beta Guide</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Sparkles className="text-blue-500" size={32} />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">How can I help you today?</h4>
            <p className="text-slate-500 text-xs max-w-xs leading-relaxed uppercase tracking-wider font-medium">
              Ask about local resources, meeting types, or just chat if you're having a tough moment.
            </p>
            <div className="grid grid-cols-1 gap-2 mt-8 w-full max-w-xs">
              <button onClick={() => setInput("Where can I find detox resources?")} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 uppercase hover:bg-slate-800 transition-all">Where can I find detox?</button>
              <button onClick={() => setInput("What's the difference between AA and NA?")} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 uppercase hover:bg-slate-800 transition-all">AA vs NA?</button>
              <button onClick={() => setInput("I'm feeling a craving, what should I do?")} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 uppercase hover:bg-slate-800 transition-all">I'm having a craving</button>
            </div>
          </div>
        )}
        
        {messages.map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-2 text-center font-bold uppercase tracking-widest">
          AI Guide can make mistakes. For crises, dial 988.
        </p>
      </form>
    </motion.div>
  );
};

const ChatView = ({ session, messages, currentUser, onBack, onSendMessage, onTyping }: { session: any, messages: any[], currentUser: any, onBack: () => void, onSendMessage: (text: string) => void, onTyping: (isTyping: boolean) => void }) => {
  const [message, setMessage] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = React.useRef<any>(null);

  const partnerName = session.userId === currentUser?.uid ? (session.mentorName || 'Mentor') : (session.userName || 'Client');
  const partnerId = session.userId === currentUser?.uid ? session.mentorUserId : session.userId;
  const isPartnerTyping = session.typingStatus?.[partnerId] === true;

  const partnerLastRead = session.lastRead?.[partnerId];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      onTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTypingLocal(false);
      onTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-[calc(100vh-140px)] bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl"
    >
      {/* CHAT HEADER */}
      <div className="p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white"><ArrowLeft size={20}/></button>
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center font-bold text-blue-400 uppercase italic">
            {partnerName ? partnerName[0] : '?'}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-none">{partnerName}</h3>
            <div className="flex items-center gap-1.5 mt-1">
               {isPartnerTyping ? (
                 <span className="text-[10px] text-blue-400 font-black uppercase animate-pulse">Typing...</span>
               ) : (
                 <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest leading-none">Healthy Connection</span>
               )}
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700/50">
          <BadgeCheck size={14} className="text-blue-500" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Account</span>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        <motion.div 
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {messages.map((m, idx) => {
            const isMe = m.senderId === currentUser?.uid;
            const isLast = idx === messages.length - 1;
            
            return (
              <motion.div 
                key={m.id} 
                variants={{
                  hidden: { opacity: 0, y: 10, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] group`}>
                  <div className={`p-4 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed font-medium">{m.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-black uppercase">
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                  {isMe && isLast && partnerLastRead && (
                    <div className="mt-1 flex justify-end">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                         <ShieldCheck size={10} className="text-blue-500" /> Seen
                       </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-50">
            <MessageCircle size={48} className="text-slate-700 mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Safe Space</p>
            <p className="text-[10px] text-slate-600 mt-2 max-w-[200px] mx-auto uppercase leading-tight font-bold">Your conversation is confidential and anonymous.</p>
          </div>
        )}
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} className="p-5 bg-slate-900 border-t border-slate-800">
        <div className="flex gap-3">
          <input 
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-white shadow-inner"
          />
          <button 
            type="submit"
            disabled={!message.trim()}
            className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={24} />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  if (!hasValidKey) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-4 uppercase italic">Maps API Key Required</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            To view meeting locations on the interactive map, you need to add your Google Maps API key to the project secrets.
          </p>
          <div className="space-y-4 text-left mb-8">
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0">1</div>
              <p className="text-xs text-slate-400 font-medium">Get an API key from the <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Cloud Console</a>.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0">2</div>
              <p className="text-xs text-slate-400 font-medium">Open <b>Settings</b> (⚙️ gear icon) &rarr; <b>Secrets</b>.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0">3</div>
              <p className="text-xs text-slate-400 font-medium">Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> and paste your key.</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">App will rebuild automatically upon entry</p>
        </div>
      </div>
    );
  }

  const [tab, setTab] = useState<'meetings' | 'sponsors' | 'crisis' | 'profile' | 'admin' | 'apply' | 'chat' | 'resources' | 'hub'>('meetings');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [userNeeds, setUserNeeds] = useState<string[]>([]);
  const [sobrietyDate, setSobrietyDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
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

  const incompleteProfile = useMemo(() => {
    if (!userProfile) return false;
    return !userProfile.neighborhood || (userProfile.recoveryNeeds || []).length === 0;
  }, [userProfile]);

  const isMentor = useMemo(() => userProfile?.role === 'mentor', [userProfile]);

  useEffect(() => {
    if (currentUser && userProfile && incompleteProfile && !isAuthLoading) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [currentUser, userProfile, incompleteProfile, isAuthLoading]);

  const activeChat = useMemo(() => {
    return chatSessions.find(s => s.id === activeChatId);
  }, [chatSessions, activeChatId]);

  const activeSponsor = useMemo(() => {
    if (!activeChat) return null;
    return sponsors.find(s => s.id === activeChat.sponsorId);
  }, [activeChat, sponsors]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSuperAdmin(user.email === SUPER_ADMIN_EMAIL);
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const profile: UserProfile = {
              email: user.email || '',
              name: user.displayName || 'Spokane Neighbor',
              photoURL: user.photoURL || '',
              role: user.email === SUPER_ADMIN_EMAIL ? 'admin' : 'user',
              sobrietyDate: new Date().toISOString().split('T')[0],
              recoveryNeeds: [],
              neighborhood: '' // Initialize as empty
            };
            await setDoc(userDocRef, profile);
            setUserProfile(profile);
            if (profile.role === 'admin') setIsSuperAdmin(true);
          } else {
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
            if (data.role === 'admin') setIsSuperAdmin(true);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
        setIsSuperAdmin(false);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthLoading || !currentUser) return;

    // Sync User Profile - Always loaded first
    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        setSobrietyDate(data.sobrietyDate || new Date().toISOString().split('T')[0]);
        setUserNeeds(data.recoveryNeeds || []);
        
        // Safety check for super admin status
        if (data.role === 'admin') {
          setIsSuperAdmin(true);
        }
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
      }
    });

    // Sync Meetings
    const unsubMeetings = onSnapshot(collection(db, 'meetings'), (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as any;
      setMeetings(docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'meetings'));

    // Wait for profile if we want to ensure admin status is correct for these specific queries
    // Though sponsors query works for anyone, we follow user's "completely loaded" directive.
    let unsubSponsors = () => {};
    let unsubChats = () => {};
    let unsubAttendance = () => {};
    let unsubMoods = () => {};

    if (userProfile) {
      // Sync Sponsors (Mentors)
      const sponsorsQuery = isSuperAdmin 
        ? collection(db, 'sponsors') 
        : query(collection(db, 'sponsors'), or(where('status', '==', 'verified'), where('userId', '==', currentUser.uid)));
        
      unsubSponsors = onSnapshot(sponsorsQuery, (snap) => {
        const docs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as any;
        setSponsors(docs);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'sponsors'));

      // Sync Attendance
      unsubAttendance = onSnapshot(
        query(collection(db, 'users', currentUser.uid, 'attendance'), orderBy('date', 'desc')),
        (snap) => {
          setAttendance(snap.docs.map(d => d.data()) as any);
        },
        (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/attendance`)
      );

      // Sync Chats (User as Client OR User as Sponsor)
      const chatsQuery = query(
        collection(db, 'chats'),
        or(where('userId', '==', currentUser.uid), where('mentorUserId', '==', currentUser.uid))
      );
      
      unsubChats = onSnapshot(chatsQuery, (snap) => {
        const allMyChats = snap.docs.map(d => ({ ...d.data(), id: d.id })) as any;
        setChatSessions(allMyChats);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'chats'));

      // Sync Mood Logs
      const unsubMoodsSync = onSnapshot(
        query(collection(db, 'users', currentUser.uid, 'moodLogs'), orderBy('timestamp', 'desc')),
        (snap) => {
          setMoodLogs(snap.docs.map(d => ({ ...d.data(), id: d.id })) as MoodEntry[]);
        },
        (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/moodLogs`)
      );
      unsubMoods = unsubMoodsSync;
    }

    return () => {
      unsubProfile();
      unsubMeetings();
      unsubSponsors();
      unsubAttendance();
      unsubChats();
      unsubMoods();
    };
  }, [currentUser, isSuperAdmin, isAuthLoading, userProfile?.role, userProfile]); // Re-run when profile/role is stable

  const [messages, setMessages] = useState<Message[]>([]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return chatSessions.filter(c => {
      const lastRead = c.lastRead?.[currentUser.uid];
      const lastMessageAt = c.lastMessageAt;
      if (!lastMessageAt) return false;
      if (!lastRead) return true;
      try {
        const lastReadMillis = typeof lastRead.toMillis === 'function' ? lastRead.toMillis() : new Date(lastRead).getTime();
        const lastMsgMillis = typeof lastMessageAt.toMillis === 'function' ? lastMessageAt.toMillis() : new Date(lastMessageAt).getTime();
        return lastMsgMillis > lastReadMillis;
      } catch (e) {
        return false;
      }
    }).length;
  }, [chatSessions, currentUser]);

  useEffect(() => {
    if (!activeChatId || !currentUser) return;

    // Update read receipt
    const updateReadReceipt = async () => {
      try {
        await updateDoc(doc(db, 'chats', activeChatId), {
          [`lastRead.${currentUser.uid}`]: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to update read receipt:", e);
      }
    };
    updateReadReceipt();

    const unsubMessages = onSnapshot(
      query(collection(db, 'chats', activeChatId, 'messages'), orderBy('timestamp', 'asc')),
      (snap) => {
        setMessages(snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
          };
        }));
      },
      (error) => handleFirestoreError(error, OperationType.GET, `chats/${activeChatId}/messages`)
    );

    return () => unsubMessages();
  }, [activeChatId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setResetSent(true); // Reuse this state to show the email sent message on the auth screen
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleResendVerification = async () => {
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
        alert('Verification email resent!');
      } catch (error: any) {
        setAuthError(error.message);
      }
    }
  };

  const checkVerification = async () => {
    if (currentUser) {
      await currentUser.reload();
      // Forces a re-render because currentUser object changes internally or we can trigger it
      window.location.reload(); 
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setTab('meetings');
  };

  const triggerSystemNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (swRegistration) {
        swRegistration.showNotification(title, {
          body,
          icon: '/favicon.ico', // Standard placeholder or real icon if available
          vibrate: [200, 100, 200]
        });
      } else {
        new Notification(title, { body });
      }
    }
    // Provide in-app feedback as well
    showToast(`${title}: ${body}`, "info");
  };

  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setAllUserProfiles([]);
      return;
    }
    const unsubAllProfiles = onSnapshot(collection(db, 'users'), (snap) => {
      setAllUserProfiles(snap.docs.map(d => ({ ...d.data(), uid: d.id })) as (UserProfile & { uid: string })[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
    return () => unsubAllProfiles();
  }, [isSuperAdmin]);

  const handleSendVerification = async () => {
    if (!currentUser) return;
    setVerificationLoading(true);
    try {
      await sendEmailVerification(currentUser);
      setVerificationSent(true);
      triggerSystemNotification('Verification Sent', 'Please check your inbox (and spam folder).');
    } catch (e: any) {
      triggerSystemNotification('Error', 'Failed to send verification. Please try again later.');
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    // Check reminders every minute
    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      reminders.forEach(id => {
        const meeting = meetings.find(m => m.id === String(id) || m.id === Number(id));
        if (!meeting) return;

        // Parse time like " Every Monday @ 6:00 PM "
        const parts = meeting.time.split(' @ ');
        if (parts.length !== 2) return;
        
        const day = parts[0].replace('Every ', '');
        const timeStr = parts[1]; // "6:00 PM"
        
        if (day === currentDay) {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;

          // Notify if meeting is exactly in 30 minutes
          const meetingTimeInMinutes = hours * 60 + minutes;
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const timeUntilMeeting = meetingTimeInMinutes - currentTimeInMinutes;
          
          if (timeUntilMeeting === 30 || timeUntilMeeting === 5) {
            const notificationId = `rem_${id}_${now.toDateString()}_${timeUntilMeeting}`;
            setNotifications(prev => {
              if (prev.find(n => n.id === notificationId)) return prev;
              
              const text = `Reminder: ${meeting.name} starts in ${timeUntilMeeting} minutes!`;
              triggerSystemNotification('Upcoming Meeting', text);
              return [...prev, { id: notificationId, text }];
            });
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [reminders, swRegistration]);

  const daysSober = useMemo(() => {
    const start = new Date(sobrietyDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [sobrietyDate]);

  useEffect(() => {
    if (tab === 'admin') {
      setAdminNotifications(0);
    }
  }, [tab]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchNeighborhood = selectedNeighborhood === 'All' || m.neighborhood === selectedNeighborhood;
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchNeighborhood && matchSearch;
    });
  }, [meetings, selectedNeighborhood, searchQuery]);

  const handleVerifySponsor = async (id: string | number) => {
    if (!isSuperAdmin) {
      triggerSystemNotification('Access Denied', 'Only the Super Admin can verify mentors.');
      return;
    }
    try {
      await updateDoc(doc(db, 'sponsors', String(id)), {
        status: 'verified',
        isVerified: true
      });
      triggerSystemNotification('Mentor Verified', 'Application approved and mentor added to directory.');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `sponsors/${id}`);
    }
  };

  const handleRejectSponsor = async (id: string) => {
    if (!isSuperAdmin) return;
    try {
      await updateDoc(doc(db, 'sponsors', id), {
        status: 'rejected',
        isVerified: false
      });
      triggerSystemNotification('Mentor Rejected', 'Application was declined.');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `sponsors/${id}`);
    }
  };

  const startEditingSponsor = (sponsor: Sponsor) => {
    setIsEditingProfile(sponsor.id);
    setEditBio(sponsor.bio || '');
    setEditSpecialties(sponsor.specialties || []);
  };

  const handleUpdateProfile = async (id: string | number) => {
    try {
      await updateDoc(doc(db, 'sponsors', String(id)), {
        bio: editBio,
        specialties: editSpecialties
      });
      setIsEditingProfile(null);
      triggerSystemNotification('Profile Updated', 'Your changes have been saved successfully.');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `sponsors/${id}`);
    }
  };

  const toggleEditSpecialty = (spec: string) => {
    setEditSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleLogAttendance = async (meetingId: string | number) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'attendance'), {
        meetingId: String(meetingId),
        date: new Date().toISOString().split('T')[0]
      });
      showToast("Meeting logged! Consistency is key.", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${currentUser.uid}/attendance`);
    }
  };

  const handleApplySponsor = async (app: Omit<Sponsor, 'id' | 'isVerified' | 'status' | 'userId'>) => {
    if (!currentUser) return;
    if (!currentUser.emailVerified) {
      triggerSystemNotification('Access Denied', 'Please verify your email before applying as a mentor.');
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
      // Check if chat exists
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

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setNotificationPermission(perm);
        if (perm === 'granted') {
          triggerSystemNotification('Notifications Enabled', 'You will now receive alerts for messages and meetings.');
        }
      });
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
      // Ignore typing update errors to prevent UI noise
    }
  };

  const toggleNeed = async (need: string) => {
    if (!currentUser) return;
    const newNeeds = userNeeds.includes(need) ? userNeeds.filter(n => n !== need) : [...userNeeds, need];
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        recoveryNeeds: newNeeds
      });
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

  const topMatches = useMemo(() => {
    if (userNeeds.length === 0) return [];
    
    return sponsors
      .filter(s => s.status === 'verified')
      .map(s => {
        let score = 0;
        // Check specialties
        userNeeds.forEach(need => {
          if (s.specialties.includes(need)) score += 2;
        });

        // Neighborhood matching (Spokane specific logic)
        if (userProfile?.neighborhood && s.neighborhood === userProfile.neighborhood) {
          score += 3; // Significant boost for local proximity
        }
        
        return { sponsor: s, score };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [sponsors, userNeeds, userProfile?.neighborhood]);

  const handleAddMeeting = async () => {
    if (!isSuperAdmin) return;
    try {
      const newMeeting = {
        name: "New Recovery Session",
        neighborhood: "Downtown",
        address: "123 Recovery Way, Spokane, WA",
        time: "Every Monday @ 7:00 PM",
        day: "Monday",
        fellowship: "AA",
        lat: 47.6588,
        lng: -117.4260,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'meetings'), newMeeting);
      triggerSystemNotification('System Update', 'New meeting added to the directory.');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'meetings');
    }
  };

  const handleDeleteMeeting = async (id: string | number) => {
    if (!isSuperAdmin) return;
    try {
      await deleteDoc(doc(db, 'meetings', String(id)));
      triggerSystemNotification('Security Alert', 'A meeting has been removed by Admin.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `meetings/${id}`);
    }
  };

  const handleBroadcastAlert = () => {
    triggerSystemNotification('GLOBAL ALERT', 'Urgent recovery update from Spokane Admin. Check resources.');
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
      <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-28 font-sans selection:bg-blue-500 selection:text-white">
      {/* BACKGROUND ACCENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
      </div>

      {/* NOTIFICATIONS */}
      <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`pointer-events-auto bg-slate-900 border p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border-l-4 ${
                n.type === 'success' ? 'border-emerald-500/50 border-l-emerald-500' : 
                n.type === 'alert' ? 'border-rose-500/50 border-l-rose-500' : 
                'border-blue-500/50 border-l-blue-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  n.type === 'success' ? 'bg-emerald-600/10 text-emerald-500' :
                  n.type === 'alert' ? 'bg-rose-600/10 text-rose-500' :
                  'bg-blue-600/10 text-blue-500'
                }`}>
                  {n.type === 'success' ? <Check size={18} /> : n.type === 'alert' ? <AlertCircle size={18} /> : <Bell size={18} />}
                </div>
                <p className="text-sm font-bold text-white leading-tight">{n.text}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
                className="text-slate-500 hover:text-white transition-colors shrink-0"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/100 p-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
             <Heart className="text-white" size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none">myRecovery</h1>
            <p className="text-[10px] text-blue-500 font-bold tracking-[0.25em] uppercase mt-1">Spokane Support</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {currentUser ? (
              <motion.button 
                key="logout-btn"
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors text-sm font-bold"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </motion.button>
            ) : (
              <motion.button 
                key="login-btn"
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogin}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 transition-colors text-sm font-bold shadow-lg shadow-blue-600/20"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Sign In</span>
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRequestPermission}
            className={`p-2.5 rounded-xl border transition-all ${notificationPermission === 'granted' ? 'bg-blue-600/10 border-blue-500/30 text-blue-500 shadow-lg shadow-blue-500/10' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
            title={notificationPermission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
          >
            {notificationPermission === 'granted' ? <Bell size={22} /> : <BellOff size={22} />}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab('admin')}
            className={`p-2.5 rounded-xl border transition-all ${tab === 'admin' ? 'bg-amber-500/20 border-amber-500/60 text-amber-500 ring-2 ring-amber-500/20' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}
            title="Super Admin Controls"
          >
            <ShieldCheck size={22} className={isSuperAdmin ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''} />
            {adminNotifications > 0 && !isSuperAdmin && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0f172a]">
                {adminNotifications}
              </span>
            )}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab('crisis')}
            className={`p-3 rounded-2xl border-2 transition-all shadow-lg ${tab === 'crisis' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'}`}
          >
            <ShieldAlert size={24} />
          </motion.button>
        </div>
      </header>

      <main className="relative z-10 p-6 max-w-2xl mx-auto min-h-[calc(100vh-140px)]">
        <AnimatePresence>
          {currentUser && !currentUser.emailVerified && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Account Unverified</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight max-w-[200px]">Verify your email to unlock all features including mentor applications.</p>
                  </div>
                </div>
                <button 
                  disabled={verificationLoading || verificationSent}
                  onClick={handleSendVerification}
                  className="px-4 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50 disabled:grayscale shrink-0"
                >
                  {verificationSent ? 'Check Email' : verificationLoading ? 'Sending...' : 'Verify Now'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* VIEW: RESOURCES */}
          {tab === 'resources' && (
            <motion.div 
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">Recovery Resources.</h2>
              </div>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">Spokane-specific resources for detox, sober living, and long-term recovery support.</p>
              
              <AdBanner className="mb-8" />

              <div className="grid gap-6">
                {(SPOKANE_RESOURCES as Resource[]).map(res => (
                  <ResourceCard key={res.id} resource={res} />
                ))}
                <NativeAd />
              </div>

              <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl mt-12 text-center space-y-4">
                 <Bus className="mx-auto text-blue-500 mb-2" size={32} />
                 <h3 className="text-lg font-black text-white uppercase italic">Need a Ride?</h3>
                 <p className="text-xs text-slate-500 max-w-xs mx-auto">All verified resources are accessible via Spokane Transit Authority (STA) routes. Check schedules on their website.</p>
                 <a 
                   href="https://www.spokanetransit.com/" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-colors"
                 >
                   STA Schedules
                 </a>
              </div>
            </motion.div>
          )}

          {/* VIEW: CRISIS */}
          {tab === 'crisis' && (
            <motion.div 
              key="crisis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <GroundingTool />
              <div className="grid gap-4">
                <a 
                  href="tel:18772661818" 
                  className="flex items-center justify-between p-7 bg-rose-600 rounded-[2rem] text-white shadow-xl shadow-rose-950/40 relative overflow-hidden group active:scale-95 transition-transform"
                >
                  <div className="relative z-1">
                    <h3 className="text-xl font-black mb-1">Spokane Regional Crisis</h3>
                    <p className="text-rose-100 text-sm font-medium">Available 24/7 • Tap to Call</p>
                  </div>
                  <Phone size={32} className="relative z-1 opacity-80" />
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <ShieldAlert size={80} />
                  </div>
                </a>
                <a 
                  href="tel:988" 
                  className="flex items-center justify-between p-7 bg-slate-800 rounded-[2rem] text-white border border-slate-700 shadow-lg active:scale-95 transition-transform"
                >
                  <div>
                    <h3 className="text-xl font-bold mb-1">988 Suicide Lifeline</h3>
                    <p className="text-slate-400 text-sm font-medium">National Support Network</p>
                  </div>
                  <Phone size={32} className="opacity-60" />
                </a>
              </div>
              <button 
                onClick={() => setTab('meetings')} 
                className="w-full text-slate-500 text-sm font-black uppercase tracking-[0.2em] py-8 hover:text-slate-400 transition-colors"
              >
                Exit Crisis Dashboard
              </button>
            </motion.div>
          )}

          {/* VIEW: CHAT */}
          {tab === 'ai' && (
            <AISupportView currentUser={currentUser} />
          )}

          {tab === 'chat' && (
            <>
              {activeChatId && activeChat ? (
                <ChatView 
                  session={activeChat} 
                  messages={messages}
                  currentUser={currentUser}
                  onBack={() => setActiveChatId(null)} 
                  onSendMessage={handleSendMessage}
                  onTyping={handleUpdateTyping}
                />
              ) : (
                <ChatList 
                  chats={chatSessions.map(c => ({
                    ...c,
                    sponsor: sponsors.find(s => s.id === c.sponsorId)
                  }))}
                  onSelectChat={(id) => setActiveChatId(id)}
                  currentUserId={currentUser?.uid}
                />
              )}
            </>
          )}

          {/* VIEW: APPLY */}
          {tab === 'apply' && (
            <SponsorApplicationForm 
              onSubmit={handleApplySponsor} 
              onCancel={() => setTab('sponsors')} 
            />
          )}

          {/* VIEW: ADMIN */}
          {tab === 'admin' && (
            <AdminDashboard 
              pendingSponsors={sponsors.filter(s => s.status === 'pending')}
              onApprove={handleVerifySponsor}
              onReject={handleRejectSponsor}
              allSponsors={sponsors}
              allUserProfiles={allUserProfiles}
              onUpdateRole={handleUpdateUserRole}
            />
          )}

          {/* VIEW: PROFILE */}
          {tab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="space-y-10"
            >
              {!currentUser ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/30" />
                  
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">
                      {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Join the Network' : 'Reset Password'}
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                      {authMode === 'login' ? 'Access your recovery profile' : authMode === 'signup' ? 'Start your journey today' : 'We will send you a reset link'}
                    </p>
                  </div>

                  {resetSent ? (
                    <div className="text-center py-6 space-y-4">
                      <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                        <Mail size={32} />
                      </div>
                      <p className="text-white font-bold">{authMode === 'signup' ? 'Check Your Inbox' : 'Email Sent!'}</p>
                      <p className="text-slate-500 text-xs">
                        {authMode === 'signup' 
                          ? 'We\'ve sent a verification link to your email. Please verify to complete signup.'
                          : 'Check your inbox for instructions to reset your password.'}
                      </p>
                      <button 
                        onClick={() => { setAuthMode('login'); setResetSent(false); }}
                        className="text-blue-500 text-xs font-black uppercase tracking-widest hover:underline"
                      >
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={authMode === 'login' ? handleEmailLogin : authMode === 'signup' ? handleSignup : handleResetPassword} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-sm text-white focus:border-blue-500 focus:outline-none transition-all shadow-inner"
                          />
                        </div>
                        {authMode !== 'forgot' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <input 
                              type="password" 
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-sm text-white focus:border-blue-500 focus:outline-none transition-all shadow-inner"
                            />
                          </div>
                        )}
                      </div>

                      {authError && (
                        <p className="text-rose-500 text-[10px] font-bold uppercase text-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                          {authError}
                        </p>
                      )}

                      <button 
                        type="submit"
                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-[0.98]"
                      >
                        {authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Send Link'}
                      </button>

                      <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">OR</span>
                        <div className="h-px flex-1 bg-slate-800" />
                      </div>

                      <button 
                        type="button"
                        onClick={handleLogin}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-slate-700/50"
                      >
                        <LogIn size={18} className="text-blue-500" /> Continue with Google
                      </button>

                      <div className="flex flex-col gap-3 pt-6 items-center text-center">
                        {authMode === 'login' ? (
                          <>
                            <button type="button" onClick={() => setAuthMode('forgot')} className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors">
                              Forgot Password?
                            </button>
                            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                              New here? <button type="button" onClick={() => setAuthMode('signup')} className="text-blue-500 hover:underline">Create Account</button>
                            </p>
                          </>
                        ) : (
                          <button type="button" onClick={() => setAuthMode('login')} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">
                            Back to Sign In
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </motion.div>
              ) : !currentUser.emailVerified ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl overflow-hidden text-center relative"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/30" />
                  <div className="w-20 h-20 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                    <ShieldCheck size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tight leading-none">Security Hold</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                      Verify your email address to unlock full features.
                    </p>
                  </div>

                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 space-y-4">
                    <p className="text-white font-bold text-sm font-mono">{currentUser.email}</p>
                    <button 
                      onClick={handleResendVerification}
                      className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-400 transition-colors"
                    >
                      Resend Verification Link
                    </button>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={checkVerification}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95"
                    >
                      I've Verified My Email
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full py-4 bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-slate-300 transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">Profile Settings</h2>
                    <p className="text-slate-400 text-sm font-medium">Customize your Spokane recovery experience.</p>
                  </div>

                  {/* SETTINGS / PROGRESS MANAGEMENT */}
              <div className="bg-slate-800/20 rounded-[2rem] border border-slate-800 p-8 space-y-8">
                {/* MATCH FINDER SECTION */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">
                    <MapPin size={14} /> My Neighborhood
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Downtown', 'South Hill', 'North Side', 'Valley', 'West Plains', 'Airway Heights'].map(n => {
                      const isActive = userProfile?.neighborhood === n;
                      return (
                        <button 
                          key={n}
                          onClick={() => handleUpdateNeighborhood(n)}
                          className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                            isActive 
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                              : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">
                    <Heart size={14} /> My Recovery Needs
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {RECOVERY_NEEDS.map(need => {
                      const isActive = userNeeds.includes(need);
                      return (
                        <button 
                          key={need}
                          onClick={() => toggleNeed(need)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            isActive 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {need}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {topMatches.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl space-y-4"
                      >
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Recommended Sponsors</p>
                        <div className="space-y-3">
                          {topMatches.map(({ sponsor, score }) => (
                            <button 
                              key={sponsor.id}
                              onClick={() => {
                                setReachingOutTo(sponsor);
                              }}
                              className="w-full flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 font-bold text-sm tracking-tighter">
                                  {score > 4 ? '99' : score > 2 ? '85' : '70'}%
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="block font-bold text-white text-sm">{sponsor.name}</span>
                                    {sponsor.isVerified && <BadgeCheck size={14} className="text-blue-400" />}
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase">{sponsor.neighborhood} • {sponsor.years}yrs</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-blue-400 font-black uppercase hidden sm:block">Match</span>
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 mb-4 flex items-center gap-2">
                    <Clock size={14} /> Recovery Progress
                  </h3>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-inner">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Adjust Sobriety Start Date</label>
                    <input 
                      type="date"
                      value={sobrietyDate}
                      onChange={(e) => setSobrietyDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-center font-bold text-white shadow-sm"
                    />
                  </div>
                </div>

                {/* MY REMINDERS */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 mb-4 flex items-center gap-2">
                    <Bell size={14} /> My Reminders ({reminders.length})
                  </h3>
                  <div className="space-y-3">
                    {reminders.length > 0 ? (
                      reminders.map(id => {
                        const meeting = meetings.find(m => m.id === String(id) || m.id === Number(id));
                        if (!meeting) return null;
                        return (
                          <div key={id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-600/10 rounded-lg">
                                <Bell size={16} className="text-blue-500" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-white leading-none">{meeting.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{meeting.time}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => toggleReminder(id)}
                              className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                              title="Remove Reminder"
                            >
                              <BellOff size={18} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-slate-900/50 p-6 rounded-2xl border-2 border-dashed border-slate-800 text-center">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No Active Reminders</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 mb-4 flex items-center gap-2">
                    <Fingerprint size={14} /> Recent Logins
                  </h3>
                  <div className="space-y-3">
                    {attendance.length > 0 ? (
                      attendance.slice(0, 5).map((record, i) => {
                        const meeting = meetings.find(m => m.id === String(record.meetingId));
                        return (
                          <div key={i} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-600/10 rounded-lg">
                                <UserCheck size={16} className="text-emerald-500" />
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{meeting?.name || 'Meeting'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date'}</p>
                              </div>
                            </div>
                            <BadgeCheck size={18} className="text-emerald-500" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-slate-900/50 p-6 rounded-2xl border-2 border-dashed border-slate-800 text-center">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No Activity Logged</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 text-center">
                <button 
                  onClick={() => setTab('crisis')}
                  className="px-8 py-4 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg"
                >
                  I need help right now
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}

          {/* VIEW: HUB */}
          {tab === 'hub' && currentUser && (
            <RecoveryHub 
              daysSober={daysSober}
              moodLogs={moodLogs}
              onLogMood={handleLogMood}
            />
          )}

          {/* VIEW: MEETINGS */}
          {tab === 'meetings' && (
            <motion.div 
              key="meetings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {isSuperAdmin && (
                <div className="flex justify-between items-center bg-amber-500/5 border border-amber-500/20 p-4 rounded-3xl shadow-lg shadow-amber-950/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Super Admin Mode</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Directory Management Active</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleAddMeeting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    Add Session
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text"
                    placeholder="Search meetings in Spokane..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/40 border border-slate-800 p-4 pl-12 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar scroll-smooth">
                  {SPOKANE_NEIGHBORHOODS.map(n => (
                    <button 
                      key={n} 
                      onClick={() => setSelectedNeighborhood(n)}
                      className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] border transition-all whitespace-nowrap shadow-sm ${selectedNeighborhood === n ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <AdBanner />

              <div className="grid gap-5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Nearby Support ({filteredMeetings.length})
                  </h2>
                </div>
                <NativeAd />
                {filteredMeetings.length > 0 ? (
                  filteredMeetings.map(m => (
                    <div key={m.id} className="relative group">
                      <MeetingCard meeting={m} onSelect={setSelectedMeeting} />
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {isSuperAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(m.id); }}
                            className="p-2 bg-rose-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-700 shadow-lg shadow-rose-950/40"
                            title="Delete Meeting"
                          >
                            <X size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleLogAttendance(m.id)}
                          className="p-2 bg-slate-900/50 rounded-lg text-slate-500 hover:text-emerald-500 transition-colors"
                          title="Log Attendance"
                        >
                          <UserCheck size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-800/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-bold">No meetings found in {selectedNeighborhood}.</p>
                    <button 
                      onClick={() => { setSelectedNeighborhood('All'); setSearchQuery(''); }}
                      className="mt-4 text-blue-500 font-bold hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* VIEW: SPONSORS */}
          {tab === 'sponsors' && (
            <motion.div 
              key="sponsors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {isMentor && (
                <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group mb-6">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                    <UserCheck size={100} />
                  </div>
                  <h3 className="text-xl font-black text-white italic tracking-tight">Mentor Workspace</h3>
                  <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-widest mt-1">Spokane Recovery Advocate</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-emerald-900/40 backdrop-blur-sm p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[9px] text-emerald-200 font-black uppercase">Active Partners</p>
                      <p className="text-2xl font-black text-white">{chatSessions.length}</p>
                    </div>
                    <div className="bg-emerald-900/40 backdrop-blur-sm p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[9px] text-emerald-200 font-black uppercase">Service Status</p>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Available
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setTab('chat')}
                    className="w-full mt-6 py-3 bg-white text-emerald-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg active:scale-95"
                  >
                    Open Partner Inbox
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase italic">Support Network</h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Connect with verified mentors</p>
                </div>

                <AdBanner />

                <AnimatePresence>
                  {topMatches.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <Heart size={14} fill="currentColor" className="text-blue-500/50" /> Recommended for You
                      </h3>
                      <div className="grid gap-3">
                        {topMatches.map(({ sponsor }) => (
                          <button 
                            key={`rec-${sponsor.id}`}
                            onClick={() => setReachingOutTo(sponsor)}
                            className="w-full flex items-center justify-between p-5 bg-blue-600/5 border border-blue-500/20 rounded-3xl hover:bg-blue-600/10 transition-all group overflow-hidden relative shadow-lg shadow-blue-950/20"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                              <BadgeCheck size={80} />
                            </div>
                            <div className="flex items-center gap-4 relative z-1">
                              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 font-black text-lg shadow-inner">
                                {sponsor.name.charAt(0)}
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-base">{sponsor.name}</span>
                                  {sponsor.isVerified && <BadgeCheck size={16} className="text-blue-400" />}
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                  {sponsor.neighborhood} • {sponsor.years}yrs Recovery
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-1">
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest hidden sm:block">Match</span>
                              <div className="p-2 bg-blue-600/20 rounded-full text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={18} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">All Verified Sponsors</h3>
                <div className="grid gap-6">
                  {sponsors.filter(s => s.status === 'verified').map(s => (
                    <SponsorCard key={s.id} sponsor={s} onReachOut={setReachingOutTo} />
                  ))}
                  <NativeAd />
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-[2rem] text-center">
                <Heart size={32} className="text-rose-500 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Want to help?</h3>
                <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto leading-relaxed uppercase tracking-wider font-bold">
                  Verified sponsors must have 2+ years of continuous recovery.
                </p>
                <button 
                  onClick={() => setTab('apply')}
                  className="text-blue-500 font-black tracking-widest text-[10px] uppercase border border-blue-500/30 px-6 py-2.5 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-black/20"
                >
                  Apply as a Mentor
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-slate-800/80 flex justify-around items-center z-50 shadow-2xl safe-area-bottom">
        <button 
          onClick={() => setTab('meetings')} 
          className={`flex flex-col items-center gap-1 transition-all relative ${tab === 'meetings' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <MapPin size={22} className={tab === 'meetings' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Maps</span>
          {tab === 'meetings' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
        <button 
          onClick={() => setTab('sponsors')} 
          className={`flex flex-col items-center gap-1 transition-all relative ${tab === 'sponsors' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <UserCheck size={22} className={tab === 'sponsors' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Partners</span>
          {tab === 'sponsors' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
        <button 
          onClick={() => setTab('hub')} 
          className={`flex flex-col items-center gap-1 transition-all relative ${tab === 'hub' ? 'text-emerald-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Trophy size={22} className={tab === 'hub' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500">My Hub</span>
          {tab === 'hub' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-emerald-500 rounded-full" />}
        </button>
        <button 
          onClick={() => setTab('ai')} 
          className={`flex flex-col items-center gap-1 transition-all relative ${tab === 'ai' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Sparkles size={22} className={tab === 'ai' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Guide</span>
          {tab === 'ai' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
        <button 
          onClick={() => { setTab('chat'); setActiveChatId(null); }} 
          className={`flex flex-col items-center gap-1 transition-all relative ${tab === 'chat' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className="relative">
            <Mail size={22} className={tab === 'chat' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-[#0f172a]" />
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Inbox</span>
          {tab === 'chat' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
        {isSuperAdmin && (
          <button 
            onClick={() => setTab('admin')} 
            className={`flex flex-col items-center gap-1 transition-all relative ${tab === 'admin' ? 'text-amber-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ShieldCheck size={22} className={tab === 'admin' ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''} />
            <span className="text-[10px] font-black uppercase tracking-tighter">Admin</span>
            {tab === 'admin' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-amber-500 rounded-full" />}
          </button>
        )}
        <button 
          onClick={() => setTab('profile')} 
          className={`flex flex-col items-center gap-1 transition-all relative ${tab === 'profile' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Settings2 size={22} className={tab === 'profile' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
          {tab === 'profile' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
      </nav>
      
      {/* QUICK ACTIONS */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsGroundingActive(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 border border-blue-500/30"
          title="Breathe / Grounding"
        >
          <Wind size={28} />
        </motion.button>
      </div>

      {/* MODALS & OVERLAYS */}
      <AnimatePresence>
        {showOnboarding && currentUser && userProfile && (
          <ProfileOnboarding 
            user={currentUser} 
            profile={userProfile} 
            onComplete={() => {
              setShowOnboarding(false);
              showToast("Profile configured successfully!", "success");
            }} 
          />
        )}
        {isGroundingActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <div className="w-full max-w-sm relative">
              <button 
                onClick={() => setIsGroundingActive(false)}
                className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
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
          />
        )}
        {reachingOutTo && (
          <WarmHandshakeModal 
            sponsor={reachingOutTo} 
            onClose={() => setReachingOutTo(null)} 
            onStartChat={(text) => handleStartChat(reachingOutTo, text)}
          />
        )}
      </AnimatePresence>
      <Analytics />
    </div>
    </APIProvider>
  );
}

