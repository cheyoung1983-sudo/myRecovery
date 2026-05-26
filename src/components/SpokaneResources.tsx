import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Phone, Globe, Filter, Sparkles, HeartPulse, 
  Utensils, Home, ShieldAlert, Gavel, Copy, Check, BadgeInfo, CalendarDays,
  List, Map as MapIcon, Eye, Navigation, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SpokaneResource } from '../types';
import ReactMarkdown from 'react-markdown';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';

const CATEGORY_ICONS = {
  health: <HeartPulse className="text-emerald-500 animate-pulse" size={18} />,
  food: <Utensils className="text-orange-500" size={18} />,
  shelter: <Home className="text-blue-500" size={18} />,
  crisis: <ShieldAlert className="text-rose-500 animate-bounce" size={18} />,
  legal: <Gavel className="text-slate-400" size={18} />
};

const DEFAULT_SPOKANE_RESOURCES: Omit<SpokaneResource, 'id'>[] = [
  {
    name: "Providence Community Clinic",
    category: "health",
    description: "Walk-in medical assistance for homeless, uninsured, and vulnerable populations. Services include routine screenings and emergency care.",
    address: "32 W. 2nd Ave., Spokane, WA",
    phone: "(509) 626-9825",
    website: "https://www.providence.org",
    barrierLevel: "Low",
    intakeProcedure: "Direct Walk-in",
    lastVerified: "2026-05-26",
    tags: ["medical", "clinic", "homeless", "uninsured", "treatment"],
    lat: 47.6548,
    lng: -117.4124
  },
  {
    name: "WSU Healthy People + Healthy Pets Clinic",
    category: "health",
    description: "A unique dual-care clinic. Veterinary and nursing students provide free routine healthcare, health screenings, and vaccinations for low-income/homeless individuals and their companion animals simultaneously.",
    address: "Mobile / Various community sites, Spokane, WA",
    phone: "",
    website: "https://medicine.wsu.edu",
    barrierLevel: "Low / Low-Income & Homeless",
    intakeProcedure: "Walk-in (Check local mobile schedule)",
    lastVerified: "2026-05-26",
    tags: ["veterinary", "medical", "pets", "homeless", "vaccines"],
    lat: 47.6601,
    lng: -117.4065
  },
  {
    name: "CHAS Health",
    category: "health",
    description: "Federally qualified health center offering medical, dental, pharmacy, and behavioral health services regardless of ability to pay.",
    address: "Various Locations, Spokane, WA",
    phone: "(509) 444-8200",
    website: "https://chas.org",
    barrierLevel: "Low",
    intakeProcedure: "Walk-in / 24-Hour Nurse Advice Line",
    lastVerified: "2026-05-26",
    tags: ["medical", "dental", "pharmacy", "behavioral", "primary care"],
    lat: 47.6558,
    lng: -117.4260
  },
  {
    name: "Our Place Food Bank",
    category: "food",
    description: "Client-choice, grocery-store-style outdoor distribution. Completely free, no documentation required, and open to anyone who is hungry.",
    address: "1509 W. College Ave., Spokane, WA",
    phone: "(509) 326-7267",
    website: "https://ourplacespokane.org",
    barrierLevel: "No documentation required",
    intakeProcedure: "Walk-in (Wed 4-6 PM, Thurs 10 AM-12:30 PM)",
    lastVerified: "2026-05-26",
    tags: ["food bank", "groceries", "pantry", "hunger", "essential"],
    lat: 47.6672,
    lng: -117.4363
  },
  {
    name: "Better Living Center Food Bank",
    category: "food",
    description: "Targeted food bank serving specific local zip codes (99205, 99207, and 99208).",
    address: "25 E. North Foothills Dr., Spokane, WA",
    phone: "(509) 325-1258",
    website: "https://www.spokaneblc.org",
    barrierLevel: "Restricted Zip Codes (99205, 99207, 99208)",
    intakeProcedure: "Walk-in (Tue 9 AM-12 PM & 1-4 PM, Thu 9 AM-1 PM)",
    lastVerified: "2026-05-26",
    tags: ["food bank", "pantry", "zip code restriction", "groceries"],
    lat: 47.6775,
    lng: -117.4111
  },
  {
    name: "Hope Market Food Pantry",
    category: "food",
    description: "Large client-choice food pantry offering fresh produce, pantry essentials, and canned goods.",
    address: "204 E. Indiana Ave., Spokane, WA",
    phone: "",
    website: "https://www.hopemarketspokane.org",
    barrierLevel: "Low",
    intakeProcedure: "Walk-in (Monday – Friday, 10:00 AM – 4:00 PM)",
    lastVerified: "2026-05-26",
    tags: ["food pantry", "fresh food", "groceries"],
    lat: 47.6713,
    lng: -117.4085
  },
  {
    name: "The City Gate",
    category: "food",
    description: "Hot meals, a food bank, and a clothing bank. No religious service attendance is required.",
    address: "170 S. Madison, Spokane, WA",
    phone: "",
    website: "https://thecitygate.org",
    barrierLevel: "No religious requirement",
    intakeProcedure: "Walk-in (Dinner: Wed/Fri/Sat 7 PM; Sat Breakfast 8-9:30 AM)",
    lastVerified: "2026-05-26",
    tags: ["hot meals", "food bank", "clothing", "dinner", "breakfast"],
    lat: 47.6534,
    lng: -117.4258
  },
  {
    name: "SNAP Singles Coordinated Entry",
    category: "shelter",
    description: "The mandatory primary intake and assessment hub for all single adults seeking emergency shelter and housing assistance in Spokane. Must call or visit here first before going to individual shelters.",
    address: "124 E. Pacific Ave., Spokane, WA",
    phone: "(509) 456-7627",
    website: "https://www.snapwa.org",
    barrierLevel: "Verification / Assessment required",
    intakeProcedure: "Call Coordinated Entry First",
    lastVerified: "2026-05-26",
    tags: ["coordinated entry", "housing intake", "assessment", "homeless singles"],
    lat: 47.6546,
    lng: -117.4109
  },
  {
    name: "Catholic Charities Homeless Families Coordinated Entry",
    category: "shelter",
    description: "The primary intake hub for families experiencing homelessness or at imminent risk.",
    address: "St. Margaret’s Shelter, 101 E. Hartson, Spokane, WA",
    phone: "(509) 325-5005",
    website: "https://www.cceeasternwa.org",
    barrierLevel: "Families Only / At Risk",
    intakeProcedure: "Walk-in or call (Tues-Thurs 7:30 AM - 4:00 PM)",
    lastVerified: "2026-05-26",
    tags: ["coordinated entry", "family shelter", "homeless families", "intake"],
    lat: 47.6508,
    lng: -117.4116
  },
  {
    name: "House of Charity",
    category: "shelter",
    description: "Low-barrier emergency shelter for adult men. Referrals handled via Navigation Center.",
    address: "32 W. Pacific Ave, Spokane, WA",
    phone: "(509) 507-4624",
    website: "https://www.cceeasternwa.org",
    barrierLevel: "Low-barrier for men",
    intakeProcedure: "Coordinated Entry or Navigation Center assessment",
    lastVerified: "2026-05-26",
    tags: ["emergency shelter", "men's shelter", "low barrier"],
    lat: 47.6545,
    lng: -117.4127
  },
  {
    name: "Inland Northwest Behavioral Health",
    category: "crisis",
    description: "An acute-care psychiatric hospital providing inpatient treatment for severe mental illness. They offer free assessments, and anyone in an active crisis is welcome to walk in without an appointment.",
    address: "104 W. 5th Ave, Spokane, WA",
    phone: "(509) 992-1888",
    website: "https://inlandnorthwestbehavioralhealth.com",
    barrierLevel: "Active Psychiatric Crisis",
    intakeProcedure: "24/7 Walk-in assessments",
    lastVerified: "2026-05-26",
    tags: ["psychiatric hospital", "active crisis", "inpatient", "mental health"],
    lat: 47.6517,
    lng: -117.4137
  },
  {
    name: "Frontier Behavioral Health Regional Crisis Line",
    category: "crisis",
    description: "The primary dispatch for Designated Crisis Responders and mobile triage teams in Spokane County. Open 24/7.",
    address: "Spokane County, WA",
    phone: "1-877-266-1818",
    website: "https://fbhwa.org",
    barrierLevel: "Low barrier / 24/7",
    intakeProcedure: "Call 24/7 for evaluation",
    lastVerified: "2026-05-26",
    tags: ["crisis hotline", "mobile crisis triage", "behavioral health", "24/7"],
    lat: 47.6622,
    lng: -117.4050
  },
  {
    name: "National Suicide & Crisis Lifeline",
    category: "crisis",
    description: "Immediate 24/7 access to trained crisis counselors for mental health or substance use crises.",
    address: "National / Local Routing",
    phone: "988",
    website: "https://988lifeline.org",
    barrierLevel: "24/7 accessible to anyone",
    intakeProcedure: "Call or text 988",
    lastVerified: "2026-05-26",
    tags: ["lifeline", "suicide line", "988", "crisis support", "mental health", "24/7"],
    lat: 47.6588,
    lng: -117.4260
  },
  {
    name: "Inland Empire Legal Aid (IELA)",
    category: "legal",
    description: "Formerly the Spokane Volunteer Lawyers Program. Provides free legal education, advice clinics, and document review for low-income individuals. Primary focuses are Family Law (divorce, custody) and Consumer Law (Chapter 7 bankruptcy assistance).",
    address: "222 W. Mission Ave., Suite 222, Spokane, WA",
    phone: "(509) 477-6123",
    website: "https://InlandEmpireLegalAid.org",
    barrierLevel: "Under 200% of Federal Poverty Level",
    intakeProcedure: "Apply online for free services",
    lastVerified: "2026-05-26",
    tags: ["legal aid", "pro bono lawyers", "family law", "bankruptcy helper", "low income"],
    lat: 47.6728,
    lng: -117.4149
  }
];

export const SpokaneResources: React.FC = () => {
  const [resources, setResources] = useState<SpokaneResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isMetaQuery, setIsMetaQuery] = useState(false);
  
  // Custom view states
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedResource, setSelectedResource] = useState<SpokaneResource | null>(null);

  // Console state
  const [showPromptConsole, setShowPromptConsole] = useState(false);
  const [copiedConsole, setCopiedConsole] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      // Load from cache first
      const cached = localStorage.getItem('spokane_resources_cache');
      if (cached) {
        try {
          setResources(JSON.parse(cached));
          setIsLoading(false);
        } catch (e) {
          console.error("Cache parse error", e);
        }
      }

      // 1. Proactively try high-performance offline cached Spokane Resources API
      try {
        const apiResponse = await fetch('/api/spokane-resources');
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            setResources(apiData);
            localStorage.setItem('spokane_resources_cache', JSON.stringify(apiData));
            setIsLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("[Spokane Resources] Local API fetch failed (offline or pending first-service), falling back to client SDK direct query:", apiErr);
      }

      // 2. Direct client-side Firestore query fallback
      try {
        const q = query(collection(db, 'spokaneResources'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => {
          const docData = doc.data();
          const defaultMatch = DEFAULT_SPOKANE_RESOURCES.find(r => r.name === docData.name);
          return { 
            id: doc.id, 
            ...docData,
            // Fallback resolve lat/lng if not yet saved in Firestore documents
            lat: docData.lat !== undefined ? docData.lat : defaultMatch?.lat,
            lng: docData.lng !== undefined ? docData.lng : defaultMatch?.lng
          } as SpokaneResource;
        });
        
        // Auto-seed if database is empty!
        if (data.length === 0) {
          console.log("Seeding verified local Spokane resources to Firestore...");
          const seededData: SpokaneResource[] = [];
          for (const item of DEFAULT_SPOKANE_RESOURCES) {
            try {
              const docRef = await addDoc(collection(db, 'spokaneResources'), item);
              seededData.push({ id: docRef.id, ...item } as SpokaneResource);
            } catch (seedErr) {
              console.error("Failed seeding individual resource to firestore:", item.name, seedErr);
            }
          }
          if (seededData.length > 0) {
            data = seededData.sort((a, b) => a.name.localeCompare(b.name));
          } else {
            // fallback to formatted static ids
            data = DEFAULT_SPOKANE_RESOURCES.map((r, idx) => ({ id: `static-${idx}`, ...r } as SpokaneResource));
          }
        }
        
        setResources(data);
        localStorage.setItem('spokane_resources_cache', JSON.stringify(data));
      } catch (err) {
        console.error("Error fetching/seeding resources, using high-fidelity offline defaults:", err);
        const backupData = DEFAULT_SPOKANE_RESOURCES.map((r, idx) => ({ id: `offline-${idx}`, ...r } as SpokaneResource));
        setResources(backupData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, []);

  // Set isMetaQuery back to false if the user clears the search input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsMetaQuery(false);
    }
  }, [searchQuery]);

  const handleAiSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      // Empty Input Handling: Onboarding message with clear instruction triggers
      setAiAnswer(`👋 **Welcome to the Sober Spokane Resource Scout!** I can help you search for and map out support services, outlets, and legal/crisis programs in Spokane.

**How to get started:**
* **Ask direct queries:** E.g., *"Where can I get a hot meal near downtown?"* or *"Who can help with dual-diagnosis treatment?"*
* **Inquire capabilities:** *"What can you search for?"* or *"Who are you?"*
* **Or click on any of the category buttons below** to browse verified local programs right away!

What support can I help you discover today?`);
      setIsMetaQuery(true);
      return;
    }

    setIsAiLoading(true);
    setAiAnswer(null); // Clear previous AI answer
    setIsMetaQuery(false);

    const normalized = trimmedQuery.toLowerCase();
    const metaPatterns = [
      "what can you do", "who are you", "what do you do", "capabilities", 
      "how to use", "how do i use", "how does this work", "help me", 
      "what is this", "tell me about", "what categories", "scout help",
      "what can you search", "how are you"
    ];
    const isMeta = metaPatterns.some(pat => normalized.includes(pat)) || normalized === 'help' || normalized === '?';

    try {
      if (isMeta) {
        setIsMetaQuery(true);
        // Call /api/gemini/chat to get dynamic AI content switch capability explanation
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Summarize your role as the "Resource Scout" AI guide for Sober Spokane. Mention you facilitate instant search for five core pillars: Health support, local Food distribution, Emergency Shelter, Crisis hotlines, and free Legal aid. Bold their names and keep it to 3 friendly sentences.`,
            history: []
          })
        });
        const data = await res.json();
        setAiAnswer(data.text);
      } else {
        // Regular query - first classify category via AI
        const resCat = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Based on this query: "${trimmedQuery}", which category of local Spokane resources is most relevant mapping to [health, food, shelter, crisis, legal]? Just return the category word.`,
            history: []
          })
        });
        const dataCat = await resCat.json();
        const detectedCategory = dataCat.text.toLowerCase().trim();
        
        if (['health', 'food', 'shelter', 'crisis', 'legal'].includes(detectedCategory)) {
          setActiveCategory(detectedCategory);
        }

        // Fetch a highly compassionate brief companion response from Sober Spokane Assistant
        const resExp = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `The user of Sober Spokane is searching for: "${trimmedQuery}". Provide a polite, warm, 2-sentence response guiding them on how local Spokane directories can support them. Keep it brief.`,
            history: []
          })
        });
        const dataExp = await resExp.json();
        setAiAnswer(dataExp.text);
      }
    } catch (e) {
      console.error("AI Scout Search Error:", e);
      if (isMeta) {
        setIsMetaQuery(true);
        setAiAnswer(`✨ **Resource Scout Guidance**\nI can help you look up local resources in Spokane across these main columns:\n\n1. **Health** (Clinics, detox, therapy, peer recovery support)\n2. **Food** (Emergency food banks, community pantries)\n3. **Shelter** (Temporary housing, coordinated intake centers)\n4. **Crisis** (Local 24/7 hotlines, support groups)\n5. **Legal** (Free consultation, advocate programs)\n\nSimply input local queries or select categories to explore!`);
      } else {
        setAiAnswer(`🔍 Search initiated for: **"${trimmedQuery}"**. Here are the verified local programs and offices matching your search. Browse contacts, phone numbers, and addresses below.`);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredResources = resources.filter(r => {
    // If it's a Meta query, ignore keyword filtering so that the screen is never left empty
    const matchesSearch = isMetaQuery || !searchQuery.trim() || 
                         r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !activeCategory || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const rawSystemPrompt = `You are the "Resource Scout Deep Research Agent," an autonomous data-gathering assistant for a localized recovery application based in Spokane, Washington.

Your primary objective is to scour public web directories, local government databases (e.g., Spokane Housing Authority, SRHD), and non-profit sites to find, verify, and format regional support resources.

CORE DIRECTIVES:
1. Verification Over Volume: Prioritize currently active, verified resources. Cross-reference operating hours, contact numbers, and intake requirements. Actively filter out permanently closed facilities.
2. Taxonomy Alignment: Categorize all findings into one of the five core pillars: Health Support, Food Security, Safe Shelter, Crisis Lines, or Legal Aid.
3. Barrier Assessment: Explicitly document the "barrier level" of each resource. (e.g., Is the shelter low-barrier or clean-and-sober? Does the food bank require ID/zip code verification, or is it no-questions-asked?)
4. Targeted Intake Hubs: Identify Coordinated Entry points (like SNAP or Catholic Charities) rather than just listing end-point shelters that do not accept direct walk-ins.

OUTPUT INSTRUCTIONS:
Do not output conversational text. Output all newly discovered or updated resources in strict, valid JSON format matching the following schema. If a field like websiteUrl or phone cannot be found or verified, populate it as null rather than omitting the key or inventing a placeholder. Set response_mime_type explicitly to "application/json" in model options.

[
  {
    "resourceName": "String",
    "category": "String (Health | Food | Shelter | Crisis | Legal)",
    "description": "String (Concise summary of services)",
    "address": "String (Physical location or 'Mobile/Various')",
    "phone": "String (or null)",
    "barrierLevel": "String (Low | High | Specific Zip Code | Unknown)",
    "intakeProcedure": "String (e.g., 'Walk-in', 'Call Coordinated Entry First', 'Apply Online')",
    "websiteUrl": "String (or null)",
    "lastVerified": "YYYY-MM-DD"
  }
]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawSystemPrompt);
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upper search card */}
      <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Search className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Resource Scout</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Local Spokane Support AI-Powered</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowPromptConsole(!showPromptConsole)}
            className="px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/20 hover:border-indigo-500/40 text-[10px] text-indigo-300 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Sparkles size={12} className="text-indigo-400" />
            {showPromptConsole ? "Hide Research System Prompt" : "Gemini Pro System Prompt"}
          </button>
        </div>

        {/* Dynamic prompt modal/accordion */}
        <AnimatePresence>
          {showPromptConsole && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-slate-950 rounded-2xl border border-indigo-900/40 p-5 space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <span>🤖</span> Spokane Autonomous Research Agent Prompt
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  {copiedConsole ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  {copiedConsole ? "Copied Prompt" : "Copy Prompt"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                This system prompt was co-designed to empower a **Gemini Pro autonomous background agent**. It forces high-precision JSON outputs that assess barriers (such as zip code restrictions) and isolates critical Coordinated Entry intake junctions first. Use this in your API pipeline or background cron workflow.
              </p>
              <pre className="p-3 bg-slate-900 rounded-xl font-mono text-[9px] text-slate-300 overflow-x-auto border border-slate-800 max-h-48 scrollbar-thin scrollbar-thumb-slate-800">
                {rawSystemPrompt}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            placeholder="Type your need (e.g. 'hot meal', 'coordinated entry', 'What can you do')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-all pr-12"
          />
          <button 
            onClick={handleAiSearch}
            disabled={isAiLoading}
            className="absolute right-3 top-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isAiLoading ? <Sparkles size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {aiAnswer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="p-5 bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/20 rounded-2xl relative space-y-2 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-400 animate-pulse" />
                  <span className="text-xs font-black text-blue-400 uppercase tracking-wider">Resource Guide Agent</span>
                </div>
                <button 
                  onClick={() => {
                    setAiAnswer(null);
                    setIsMetaQuery(false);
                  }} 
                  className="text-slate-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-wider bg-slate-950/50 px-2 py-1 rounded-md"
                >
                  Clear Scout View
                </button>
              </div>
              <div className="text-slate-200 text-xs leading-relaxed font-semibold prose prose-invert max-w-none">
                <ReactMarkdown>{aiAnswer}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Toolbar with List/Map Segmented Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/40">
          <div className="flex flex-wrap gap-2">
            {['health', 'food', 'shelter', 'crisis', 'legal'].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  const isDisabling = activeCategory === cat;
                  setActiveCategory(isDisabling ? null : cat);
                  // Reset meta behavior when filter buttons are directly used
                  setIsMetaQuery(false);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeCategory === cat ? 'bg-white text-slate-955 scale-105 shadow-xl' : 'bg-slate-800 text-slate-400 hover:bg-slate-755'}`}
              >
                {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]}
                {cat}
              </button>
            ))}
          </div>

          {/* List/Map toggle segmented control */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedResource(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <List size={11} />
              List
            </button>
            <button
              onClick={() => {
                setViewMode('map');
                setSelectedResource(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <MapIcon size={11} />
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Conditional Rendering of Grid vs Google Map */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-slate-900/40 rounded-[2rem] animate-pulse" />
              ))
            ) : filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-slate-700 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-slate-955 rounded-xl border border-slate-805 group-hover:scale-110 transition-transform flex items-center justify-center">
                        {CATEGORY_ICONS[resource.category]}
                      </div>
                      <div className="flex gap-2">
                        {resource.lat !== undefined && resource.lng !== undefined && (
                          <button
                            onClick={() => {
                              setViewMode('map');
                              setSelectedResource(resource);
                            }}
                            className="p-2 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-400 border border-slate-800 transition-colors flex items-center gap-1.5"
                            title="Show on Map"
                          >
                            <MapIcon size={14} />
                          </button>
                        )}
                        {resource.phone && (
                          <a href={`tel:${resource.phone}`} className="p-2 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-805 transition-colors flex items-center justify-center">
                            <Phone size={14} className="group-hover:animate-wiggle" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-base font-black text-white italic mb-1 uppercase tracking-tight">{resource.name}</h3>
                    
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                      {resource.description}
                    </p>

                    {/* Core structural details to prevent wild-goose chases */}
                    <div className="space-y-2 mb-4">
                      {resource.barrierLevel && (
                        <div className="flex items-start gap-2 text-[10px] font-bold">
                          <span className="text-slate-500 uppercase tracking-widest">Barrier:</span>
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] uppercase tracking-wider ${
                            resource.barrierLevel.toLowerCase().includes('low') 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {resource.barrierLevel}
                          </span>
                        </div>
                      )}

                      {resource.intakeProcedure && (
                        <div className="flex items-start gap-2 text-[10px] font-bold">
                          <span className="text-slate-500 uppercase tracking-widest">Intake:</span>
                          <span className="text-blue-400 bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                            {resource.intakeProcedure}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/50 space-y-2 mt-auto">
                    {resource.address && (
                      <p className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                        <MapPin size={10} className="text-blue-500 shrink-0" /> <span className="truncate">{resource.address}</span>
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center gap-2 pt-1">
                      {resource.website ? (
                        <a 
                          href={resource.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-widest hover:underline"
                          referrerPolicy="no-referrer"
                        >
                          <Globe size={10} /> Visit Website
                        </a>
                      ) : <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Digital portal unlisted</span>}

                      {resource.lastVerified && (
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                          <CalendarDays size={10} className="text-slate-600" />
                          <span>Verified: {resource.lastVerified}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 px-6 text-center bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-800 space-y-6 flex flex-col items-center">
                <div className="p-4 bg-slate-950 rounded-full border border-slate-800 text-slate-500">
                  <Search size={32} />
                </div>
                <div className="space-y-2 max-w-md">
                  <h4 className="text-base font-black text-white italic uppercase tracking-wider">
                    No direct results for "{searchQuery || "your search"}"
                  </h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Try searching for specific recovery support terms like <code className="text-blue-400 font-mono">detox</code>, <code className="text-blue-400 font-mono">clinic</code>, <code className="text-blue-400 font-mono">hot meals</code>, or <code className="text-blue-400 font-mono">coordinated entry</code>.
                  </p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Alternatively, explore one of our quick verified category columns below:
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {[
                    { label: "🏥 Health Support", query: "health", category: "health" },
                    { label: "🍲 Food Security", query: "food", category: "food" },
                    { label: "🛏️ Safe Shelter", query: "shelter", category: "shelter" },
                    { label: "☎️ Crisis Line", query: "crisis", category: "crisis" },
                    { label: "⚖️ Legal Aid", query: "legal", category: "legal" }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveCategory(item.category);
                        setSearchQuery('');
                        setIsMetaQuery(false);
                      }}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Google Maps Interactive View */
          <motion.div
            key="map-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.18 }}
            className="relative bg-slate-950 border border-slate-800 rounded-[2.5rem] p-3 h-[600px] overflow-hidden flex flex-col shadow-inner"
          >
            {/* Embedded Google Map Component */}
            <div className="absolute inset-0 w-full h-full rounded-[2.2rem] overflow-hidden">
              <Map
                defaultCenter={{ lat: 47.65878, lng: -117.42605 }}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                disableDefaultUI={false}
                gestureHandling={'greedy'}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                {/* Dynamically Render AdvancedMarkers for Filtered Resources with Coordinates */}
                {filteredResources
                  .filter(r => r.lat !== undefined && r.lng !== undefined)
                  .map((resource) => {
                    const lat = resource.lat as number;
                    const lng = resource.lng as number;
                    const isSelected = selectedResource?.id === resource.id;

                    return (
                      <AdvancedMarker
                        key={resource.id}
                        position={{ lat, lng }}
                        title={resource.name}
                        onClick={() => setSelectedResource(resource)}
                      >
                        <div className={`cursor-pointer select-none transition-all flex flex-col items-center ${
                          isSelected ? 'scale-125 z-50' : 'scale-100 hover:scale-110 active:scale-95'
                        }`}>
                          {/* Inner custom category ring */}
                          <div className={`w-8 h-8 rounded-full border-2 border-[#0f172a] flex items-center justify-center shadow-lg transition-all ${
                            resource.category === 'health' ? 'bg-emerald-500 text-white' :
                            resource.category === 'food' ? 'bg-orange-500 text-white' :
                            resource.category === 'shelter' ? 'bg-blue-500 text-white' :
                            resource.category === 'crisis' ? 'bg-rose-500 text-white' :
                            'bg-slate-400 text-slate-950'
                          }`}>
                            {resource.category === 'health' && <HeartPulse size={14} className="animate-pulse" />}
                            {resource.category === 'food' && <Utensils size={14} />}
                            {resource.category === 'shelter' && <Home size={14} />}
                            {resource.category === 'crisis' && <ShieldAlert size={14} />}
                            {resource.category === 'legal' && <Gavel size={14} />}
                          </div>
                          {/* Pin Pointer Arrow */}
                          <div className={`w-2.5 h-2.5 rotate-45 -mt-1.5 border-r border-b border-[#0f172a] shadow-md ${
                            resource.category === 'health' ? 'bg-emerald-500' :
                            resource.category === 'food' ? 'bg-orange-500' :
                            resource.category === 'shelter' ? 'bg-blue-500' :
                            resource.category === 'crisis' ? 'bg-rose-500' :
                            'bg-slate-400'
                          }`} />
                        </div>
                      </AdvancedMarker>
                    );
                  })}
              </Map>
            </div>

            {/* Static HUD Panel: Filter and Status Display overlay */}
            <div className="absolute top-4 left-4 p-3.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 pointer-events-none select-none max-w-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Resource Scout Maps</p>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Showing {filteredResources.filter(r => r.lat !== undefined && r.lng !== undefined).length} of {filteredResources.length} verified locations
              </p>
            </div>

            {/* Bottom Custom Slide-up Interactive Card Panel */}
            <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex flex-col justify-end">
              <AnimatePresence>
                {selectedResource && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    className="p-5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-3xl shadow-2xl flex flex-col justify-between pointer-events-auto"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="p-1 px-2 bg-slate-950 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-800 text-slate-300 flex items-center gap-1.5">
                            {CATEGORY_ICONS[selectedResource.category]}
                            {selectedResource.category}
                          </span>
                          {selectedResource.barrierLevel && (
                            <span className={`px-2 py-0.5 rounded-md border text-[8px] uppercase tracking-wider font-extrabold ${
                              selectedResource.barrierLevel.toLowerCase().includes('low') 
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            }`}>
                              Barrier: {selectedResource.barrierLevel}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-white italic uppercase tracking-tight leading-snug">{selectedResource.name}</h3>
                        <p className="text-xs text-slate-350 mt-1 leading-relaxed font-semibold max-h-24 overflow-y-auto">{selectedResource.description}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedResource(null)}
                        className="p-1.5 bg-slate-955 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-x-6 gap-y-2 text-[10px] items-center justify-between">
                      <div className="space-y-1">
                        {selectedResource.address && (
                          <p className="flex items-center gap-1.5 text-slate-400 font-extrabold uppercase tracking-wide">
                            <MapPin size={11} className="text-blue-500 shrink-0" /> {selectedResource.address}
                          </p>
                        )}
                        {selectedResource.phone && (
                          <p className="flex items-center gap-1.5 text-slate-400 font-extrabold uppercase tracking-wide">
                            <Phone size={11} className="text-emerald-500 shrink-0" /> {selectedResource.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {selectedResource.website && (
                          <a 
                            href={selectedResource.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all"
                          >
                            <Globe size={11} /> Visit Website
                          </a>
                        )}
                        {selectedResource.address && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedResource.name + ' ' + selectedResource.address)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all animate-shimmer"
                          >
                            <Navigation size={11} className="text-blue-400" /> Directions ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
