import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Globe, Filter, Sparkles, HeartPulse, Utensils, Home, ShieldAlert, Gavel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SpokaneResource } from '../types';

const CATEGORY_ICONS = {
  health: <HeartPulse className="text-emerald-500" />,
  food: <Utensils className="text-orange-500" />,
  shelter: <Home className="text-blue-500" />,
  crisis: <ShieldAlert className="text-rose-500" />,
  legal: <Gavel className="text-slate-500" />
};

export const SpokaneResources: React.FC = () => {
  const [resources, setResources] = useState<SpokaneResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(collection(db, 'spokaneResources'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpokaneResource));
        setResources(data);
      } catch (err) {
        console.error("Error fetching resources:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, []);

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiLoading(true);
    try {
      // Mocking AI mapping logic - ideally this calls /api/ai/resources
      // which would use Gemini to find the best local orgs
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Based on this query: "${searchQuery}", which category of local Spokane resources is most relevant mapping to [health, food, shelter, crisis, legal]? Just return the category word.`,
          history: []
        })
      });
      const data = await res.json();
      const detectedCategory = data.text.toLowerCase().trim();
      if (['health', 'food', 'shelter', 'crisis', 'legal'].includes(detectedCategory)) {
        setActiveCategory(detectedCategory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !activeCategory || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Search className="text-blue-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Resource Scout</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Local Spokane Support AI-Powered</p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
            placeholder="Type your need (e.g. 'hot meal', 'detox help')..."
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

        <div className="flex flex-wrap gap-2">
          {['health', 'food', 'shelter', 'crisis', 'legal'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeCategory === cat ? 'bg-white text-slate-950 scale-105 shadow-xl' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]}
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-900/40 rounded-[2rem] animate-pulse" />
            ))
          ) : filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <motion.div
                key={resource.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] hover:border-slate-700 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform">
                    {CATEGORY_ICONS[resource.category]}
                  </div>
                  {resource.phone && (
                    <a href={`tel:${resource.phone}`} className="p-2 bg-slate-950 rounded-xl text-slate-400 hover:text-white transition-colors">
                      <Phone size={16} />
                    </a>
                  )}
                </div>
                <h3 className="text-lg font-black text-white italic mb-1 uppercase tracking-tight">{resource.name}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4 line-clamp-2">
                  {resource.description}
                </p>
                <div className="space-y-2">
                  {resource.address && (
                    <p className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <MapPin size={10} className="text-blue-500" /> {resource.address}
                    </p>
                  )}
                  {resource.website && (
                    <a 
                      href={resource.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-widest hover:underline"
                    >
                      <Globe size={10} /> Visit Website
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-800">
              <p className="text-slate-500 font-bold italic">No resources found for this search. Try a different term or category.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
