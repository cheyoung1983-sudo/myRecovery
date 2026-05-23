
import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Quote, Sparkles, Send, Loader2, X, ArrowRight, Heart, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LiteratureSearchProps {
  currentUser: FirebaseUser | null;
}

interface Favorite {
  id: string;
  query: string;
  text: string;
  timestamp: any;
}

export const LiteratureSearch: React.FC<LiteratureSearchProps> = ({ currentUser }) => {
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'search' | 'favorites'>('search');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users', currentUser.uid, 'favoriteLiterature'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Favorite)));
    });
  }, [currentUser]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/literature-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResult(data.text);
    } catch (error) {
      console.error(error);
      setResult("Sorry, I couldn't find the literature right now. Please try again or consult your physical literature.");
    } finally {
      setLoading(false);
    }
  };

  const saveToFavorites = async () => {
    if (!currentUser || !result || !queryText) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'favoriteLiterature'), {
        query: queryText,
        text: result,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const removeFavorite = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'favoriteLiterature', id));
    } catch (e) {
      console.error(e);
    }
  };

  const suggestedTopics = [
    "Acceptance",
    "Triggers & Cravings",
    "Step 3",
    "Resentment",
    "Relationships",
    "Powerlessness"
  ];

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex flex-col h-[75vh] overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Literature Search</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Find 12-Step Wisdom</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('search')}
            className={`p-2 rounded-xl border transition-all ${view === 'search' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            <Search size={18} />
          </button>
          <button 
            onClick={() => setView('favorites')}
            className={`p-2 rounded-xl border transition-all ${view === 'favorites' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            <Heart size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-900/30">
        {view === 'favorites' ? (
          <div className="space-y-4 max-w-2xl mx-auto w-full">
            {favorites.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <Heart size={40} className="text-slate-800 mx-auto" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No saved wisdom yet</p>
              </div>
            ) : (
              favorites.map(fav => (
                <motion.div 
                  key={fav.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-950 border border-slate-800 p-6 rounded-[2rem] space-y-4 relative group"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Query: {fav.query}</p>
                    <button 
                      onClick={() => removeFavorite(fav.id)}
                      className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="markdown-body prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed">
                    <ReactMarkdown>{fav.text}</ReactMarkdown>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <>
            {!result && !loading && (
              <div className="space-y-6 max-w-xl mx-auto">
                <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-800 text-center">
                  <Sparkles size={40} className="text-blue-400 mx-auto mb-4" />
                  <p className="text-slate-300 text-base italic font-medium leading-relaxed">
                    "Rarely have we seen a person fail who has thoroughly followed our path."
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-4 tracking-widest">— AA Big Book</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Suggested Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTopics.map(topic => (
                      <button
                        key={topic}
                        onClick={() => setQueryText(topic)}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white hover:border-blue-500/50 transition-all font-bold"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(loading || result) && (
              <div className="space-y-6 min-h-[200px] max-w-2xl mx-auto w-full">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 size={40} className="text-blue-500 animate-spin" />
                    <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse">Searching the archives...</p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="markdown-body p-8 bg-slate-950 border border-slate-800 rounded-[2rem] shadow-inner"
                  >
                    <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
                       <ReactMarkdown>{result || ''}</ReactMarkdown>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-between items-center">
                       <button 
                         onClick={saveToFavorites}
                         disabled={isSaving || !result}
                         className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-rose-500/20 text-rose-500' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                       >
                         {isSaving ? 'Saved!' : <><Heart size={14} /> Save to Favorites</>}
                       </button>
                       <button 
                         onClick={() => { setResult(null); setQueryText(''); }}
                         className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                       >
                         New Search
                       </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer / Search Bar */}
      {view === 'search' && (
        <div className="p-8 border-t border-slate-800 bg-[#0f172a]/95 backdrop-blur-md">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <input 
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Ask about a concept, feeling, or step..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={loading || !queryText.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-95 shadow-lg"
            >
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
