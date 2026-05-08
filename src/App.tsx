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
  ArrowLeft, Send, Search, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- TYPES ---
interface Meeting {
  id: number;
  name: string;
  neighborhood: string;
  address: string;
  time: string;
  day: string;
  fellowship: 'AA' | 'NA';
  format?: string;
  description?: string;
  isOpen?: boolean;
}

interface Sponsor {
  id: number;
  name: string;
  years: number;
  specialties: string[];
  bio: string;
  isVerified: boolean;
  status: 'pending' | 'verified' | 'rejected';
}

// --- MOCK DATA ---
const SPOKANE_NEIGHBORHOODS = ['All', 'South Hill', 'North Side', 'Valley', 'Downtown', 'West Central', 'Hillyard', 'Cheney'];

const INITIAL_MEETINGS: Meeting[] = [
  { 
    id: 1, 
    name: "Sunday Morning Serenity", 
    neighborhood: "South Hill", 
    address: "Manito Park, Spokane, WA", 
    time: "10:00 AM", 
    day: "Sunday",
    fellowship: "AA",
    format: "Discussion",
    description: "Outdoor meeting near the duck pond. Bring a chair.",
    isOpen: true
  },
  { 
    id: 2, 
    name: "North Hill Group", 
    neighborhood: "North Side", 
    address: "North Hill Christian Church", 
    time: "7:00 PM", 
    day: "Tuesday",
    fellowship: "NA",
    format: "Basic Text Study",
    description: "Enter through the side door by the playground.",
    isOpen: false
  },
  { 
    id: 3, 
    name: "Valley Clean & Serene", 
    neighborhood: "Valley", 
    address: "Spokane Valley Alano Club", 
    time: "6:30 PM", 
    day: "Thursday",
    fellowship: "NA",
    format: "Speaker",
    description: "Large room, plenty of parking.",
    isOpen: true
  },
  { 
    id: 4, 
    name: "Downtown High Noon", 
    neighborhood: "Downtown", 
    address: "Central United Methodist", 
    time: "12:00 PM", 
    day: "Monday",
    fellowship: "AA",
    format: "Big Book Study",
    description: "Basement meeting room. Quick 1-hour format.",
    isOpen: true
  },
];

const INITIAL_SPONSORS: Sponsor[] = [
  { 
    id: 1, 
    name: "Sarah J.", 
    years: 12, 
    specialties: ["Trauma", "Grief", "Dual-Diagnosis"], 
    bio: "Walking this path since 2012. I specialize in dual-diagnosis recovery and trauma-informed support.",
    isVerified: true,
    status: 'verified'
  },
  { 
    id: 2, 
    name: "Michael K.", 
    years: 8, 
    specialties: ["Big Book", "Step Work", "Sponsorship"], 
    bio: "Focusing on the solution. Available for morning check-ins and structured step work.",
    isVerified: true,
    status: 'verified'
  },
  {
    id: 3,
    name: "James R.",
    years: 10,
    specialties: ["Dual-Diagnosis", "Trauma"],
    bio: "Focuses on dual-diagnosis and trauma recovery.",
    isVerified: false,
    status: 'pending'
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

const SponsorCard: React.FC<{ sponsor: Sponsor, onReachOut: (s: Sponsor) => void }> = ({ sponsor, onReachOut }) => {
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
            {sponsor.isVerified && <BadgeCheck size={20} className="text-blue-400" />}
          </h3>
          <p className="text-xs text-blue-400 font-medium">{sponsor.years} Years Sober</p>
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-5 leading-relaxed italic">"{sponsor.bio}"</p>
      <div className="flex flex-wrap gap-2 mb-8 lowercase">
        {sponsor.specialties.map(tag => (
          <span key={tag} className="text-[10px] font-semibold bg-slate-900 border border-slate-700/50 px-2.5 py-1 rounded-full text-slate-300">#{tag}</span>
        ))}
      </div>
      <button 
        onClick={() => onReachOut(sponsor)}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
      >
        <MessageCircle size={20} /> Reach Out
      </button>
    </motion.div>
  );
};

const MeetingDetailModal = ({ meeting, onClose }: { meeting: Meeting, onClose: () => void }) => {
  const transitLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${meeting.address}, Spokane, WA`)}&travelmode=transit`;

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
        <div className="sticky top-0 right-0 p-6 flex justify-end z-[70] pointer-events-none">
          <button 
            onClick={onClose}
            className="p-2.5 bg-slate-900/80 backdrop-blur-md rounded-full text-slate-400 hover:text-white pointer-events-auto shadow-lg"
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
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-inner">
              <p className="text-lg text-slate-100 font-bold mb-1">{meeting.address}</p>
              <p className="text-sm text-slate-500 font-medium mb-6 uppercase tracking-wider">{meeting.neighborhood} Spokane</p>
              
              {meeting.description && (
                <div className="flex gap-3.5 text-sm text-blue-200 bg-blue-900/15 p-4 rounded-2xl border border-blue-900/30 leading-relaxed shadow-sm">
                  <Info size={18} className="shrink-0 mt-0.5 text-blue-400" />
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
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-[0.98]">
                Request a "Meeting Buddy"
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const WarmHandshakeModal = ({ sponsor, onClose }: { sponsor: Sponsor, onClose: () => void }) => {
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
                alert("This would open a secure chat with: " + t.text);
                onClose();
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

// --- MAIN APPLICATION ---

export default function App() {
  const [tab, setTab] = useState<'meetings' | 'sponsors' | 'crisis' | 'admin'>('meetings');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [reachingOutTo, setReachingOutTo] = useState<Sponsor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sponsors, setSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);

  const filteredMeetings = useMemo(() => {
    return INITIAL_MEETINGS.filter(m => {
      const matchNeighborhood = selectedNeighborhood === 'All' || m.neighborhood === selectedNeighborhood;
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchNeighborhood && matchSearch;
    });
  }, [selectedNeighborhood, searchQuery]);

  const handleVerifySponsor = (id: number) => {
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, status: 'verified', isVerified: true } : s));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-28 font-sans selection:bg-blue-500 selection:text-white">
      {/* BACKGROUND ACCENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
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
          {tab !== 'admin' && (
            <button 
              onClick={() => setTab('admin')}
              className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              title="Admin Panel"
            >
              <ShieldCheck size={22} />
            </button>
          )}
          <button 
            onClick={() => setTab('crisis')}
            className={`p-3 rounded-2xl border-2 transition-all shadow-lg ${tab === 'crisis' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'}`}
          >
            <ShieldAlert size={24} />
          </button>
        </div>
      </header>

      <main className="relative z-10 p-6 max-w-2xl mx-auto min-h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait">
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

          {/* VIEW: MEETINGS */}
          {tab === 'meetings' && (
            <motion.div 
              key="meetings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
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

              <div className="grid gap-5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Nearby Support ({filteredMeetings.length})
                  </h2>
                </div>
                {filteredMeetings.length > 0 ? (
                  filteredMeetings.map(m => (
                    <MeetingCard key={m.id} meeting={m} onSelect={setSelectedMeeting} />
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
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Support Network</h2>
                <p className="text-slate-400 text-sm font-medium">Connect with mentors who have walked the path before you.</p>
              </div>

              <div className="grid gap-6">
                {sponsors.filter(s => s.status === 'verified').map(s => (
                  <SponsorCard key={s.id} sponsor={s} onReachOut={setReachingOutTo} />
                ))}
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-[2rem] text-center">
                <Heart size={32} className="text-rose-500 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Want to help?</h3>
                <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto leading-relaxed uppercase tracking-wider font-bold">
                  Verified sponsors must have 2+ years of continuous recovery.
                </p>
                <button 
                  onClick={() => alert("Registration for sponsors is coming soon.")}
                  className="text-blue-500 font-black tracking-widest text-[10px] uppercase border border-blue-500/30 px-6 py-2.5 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-black/20"
                >
                  Apply as a Mentor
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW: ADMIN */}
          {tab === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                    <ShieldCheck className="text-blue-600" /> Admin
                  </h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Vetting Queue</p>
                </div>
                <button onClick={() => setTab('meetings')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                  <X />
                </button>
              </header>

              <div className="space-y-4">
                {sponsors.filter(s => s.status === 'pending').length > 0 ? (
                  sponsors.filter(s => s.status === 'pending').map(s => (
                    <div key={s.id} className="bg-slate-800/40 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
                      <div className="text-center sm:text-left space-y-2">
                        <h3 className="text-lg font-black text-white">{s.name}</h3>
                        <p className="text-sm text-slate-400 font-medium italic">"{s.bio}"</p>
                        <div className="flex justify-center sm:justify-start gap-2 pt-1">
                          {s.specialties.map(tag => <span key={tag} className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full text-slate-500">#{tag}</span>)}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleVerifySponsor(s.id)}
                        className="flex items-center gap-2.5 px-6 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-xs shadow-xl shadow-emerald-950/20 active:scale-95"
                      >
                        <UserCheck size={18} /> APPROVE
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-900/30 rounded-[2.5rem] border border-slate-800 border-dashed">
                    <Clock className="text-slate-700 mx-auto mb-4" size={32} />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No pending verifications</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 py-6 px-10 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-slate-800/80 flex justify-around items-center z-50 shadow-2xl">
        <button 
          onClick={() => setTab('meetings')} 
          className={`flex flex-col items-center gap-1.5 transition-all relative ${tab === 'meetings' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <MapPin size={22} className={tab === 'meetings' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Meetings</span>
          {tab === 'meetings' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
        <button 
          onClick={() => setTab('sponsors')} 
          className={`flex flex-col items-center gap-1.5 transition-all relative ${tab === 'sponsors' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <MessageCircle size={22} className={tab === 'sponsors' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Partners</span>
          {tab === 'sponsors' && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-blue-500 rounded-full" />}
        </button>
      </nav>

      {/* MODALS & OVERLAYS */}
      <AnimatePresence>
        {selectedMeeting && (
          <MeetingDetailModal 
            meeting={selectedMeeting} 
            onClose={() => setSelectedMeeting(null)} 
          />
        )}
        {reachingOutTo && (
          <WarmHandshakeModal 
            sponsor={reachingOutTo} 
            onClose={() => setReachingOutTo(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

