import React, { useState, useEffect } from 'react';
import { 
  Brain, Scale, AlertCircle, Save, ChevronDown, ChevronUp, Trash2, Calendar, FileText, 
  HelpCircle, Plus, Sparkles, CheckCircle2, RefreshCw, Info, Smile, Activity, ShieldAlert, Frown, Meh
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, query, collection, getDocs, deleteDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';

export interface SmartABCLog {
  id: string;
  userId: string;
  activatingEvent: string;
  beliefs: string;
  consequences: string;
  disputes: string;
  effectiveBeliefs: string;
  createdAt: any;
}

export interface SmartCBALog {
  id: string;
  userId: string;
  prosUsing: string;
  consUsing: string;
  prosSobriety: string;
  consSobriety: string;
  createdAt: any;
}

type ToolTab = 'ABC' | 'CBA' | 'Mood' | 'LOGS';

interface SmartRecoveryToolsProps {
  currentUser?: any;
  showToast: (msg: string, type: 'success' | 'alert' | 'info') => void;
}

export default function SmartRecoveryTools({ currentUser, showToast }: SmartRecoveryToolsProps) {
  const [activeTab, setActiveTab] = useState<ToolTab>('ABC');
  const [expandedSection, setExpandedSection] = useState<string | null>('A');

  // Savable worksheet loading visual state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Loaded logs arrays
  const [abcLogs, setAbcLogs] = useState<SmartABCLog[]>([]);
  const [cbaLogs, setCbaLogs] = useState<SmartCBALog[]>([]);
  const [activeViewedExercise, setActiveViewedExercise] = useState<{ type: 'ABC' | 'CBA'; data: any } | null>(null);

  // ABC Form State initializers
  const [abcForm, setAbcForm] = useState({
    activatingEvent: '',
    beliefs: '',
    consequences: '',
    disputes: '',
    effectiveBeliefs: ''
  });

  // CBA Form State initializers
  const [cbaForm, setCbaForm] = useState({
    prosUsing: '',
    consUsing: '',
    prosSobriety: '',
    consSobriety: ''
  });

  // Mood Log State initializer
  const [moodForm, setMoodForm] = useState({
    moodScore: 5,
    notes: ''
  });

  // Fetch logged exercises from Firestore or LocalStorage
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    const userId = currentUser?.uid || auth.currentUser?.uid;

    if (userId) {
      // Fetch ABC Logs
      try {
        const abcPath = `users/${userId}/abcLogs`;
        const qAbc = query(collection(db, abcPath), orderBy('createdAt', 'desc'));
        const abcSnap = await getDocs(qAbc);
        const tempAbc: SmartABCLog[] = [];
        abcSnap.forEach(doc => {
          const d = doc.data();
          tempAbc.push({
            id: doc.id,
            userId: d.userId,
            activatingEvent: d.activatingEvent || '',
            beliefs: d.beliefs || '',
            consequences: d.consequences || '',
            disputes: d.disputes || '',
            effectiveBeliefs: d.effectiveBeliefs || '',
            createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date()
          });
        });
        setAbcLogs(tempAbc);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}/abcLogs`);
      }

      // Fetch CBA Logs
      try {
        const cbaPath = `users/${userId}/cbaLogs`;
        const qCba = query(collection(db, cbaPath), orderBy('createdAt', 'desc'));
        const cbaSnap = await getDocs(qCba);
        const tempCba: SmartCBALog[] = [];
        cbaSnap.forEach(doc => {
          const d = doc.data();
          tempCba.push({
            id: doc.id,
            userId: d.userId,
            prosUsing: d.prosUsing || '',
            consUsing: d.consUsing || '',
            prosSobriety: d.prosSobriety || '',
            consSobriety: d.consSobriety || '',
            createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date()
          });
        });
        setCbaLogs(tempCba);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}/cbaLogs`);
      }
    } else {
      // Local fallback
      try {
        const localAbc = JSON.parse(localStorage.getItem('myrecovery_local_abc_logs') || '[]');
        const localCba = JSON.parse(localStorage.getItem('myrecovery_local_cba_logs') || '[]');
        setAbcLogs(localAbc);
        setCbaLogs(localCba);
      } catch (e) {
        console.warn('Error fetching localStorage fallback:', e);
      }
    }
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  // Handle ABC submission
  const handleSaveABC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abcForm.activatingEvent || !abcForm.beliefs || !abcForm.effectiveBeliefs) {
      showToast('Please complete key fields before logging.', 'alert');
      return;
    }

    setIsSaving(true);
    const userId = currentUser?.uid || auth.currentUser?.uid;
    const logId = 'abc-' + Date.now();
    const newLogItem = {
      id: logId,
      userId: userId || 'sandbox-user',
      activatingEvent: abcForm.activatingEvent,
      beliefs: abcForm.beliefs,
      consequences: abcForm.consequences,
      disputes: abcForm.disputes,
      effectiveBeliefs: abcForm.effectiveBeliefs,
      createdAt: new Date()
    };

    if (userId) {
      try {
        const logDocRef = doc(db, `users/${userId}/abcLogs`, logId);
        await setDoc(logDocRef, {
          ...newLogItem,
          createdAt: serverTimestamp()
        });
        showToast('🎯 ABC Problem Solving Worksheet Saved successfully to Spokane Database!', 'success');
        
        // Reset Form
        setAbcForm({
          activatingEvent: '',
          beliefs: '',
          consequences: '',
          disputes: '',
          effectiveBeliefs: ''
        });
        setExpandedSection('A');
        fetchLogs();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/abcLogs/${logId}`);
        showToast('Database error occurred. Saved locally instead.', 'alert');
        saveABCLocally(newLogItem);
      }
    } else {
      saveABCLocally(newLogItem);
    }
    setIsSaving(false);
  };

  const saveABCLocally = (item: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('myrecovery_local_abc_logs') || '[]');
      const updated = [item, ...existing];
      localStorage.setItem('myrecovery_local_abc_logs', JSON.stringify(updated));
      showToast('🎯 ABC Problem Solving worksheet backed up to Local Storage (Sandbox Mode)', 'success');
      setAbcForm({
        activatingEvent: '',
        beliefs: '',
        consequences: '',
        disputes: '',
        effectiveBeliefs: ''
      });
      setExpandedSection('A');
      fetchLogs();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle CBA submission
  const handleSaveCBA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbaForm.prosUsing && !cbaForm.consUsing && !cbaForm.prosSobriety && !cbaForm.consSobriety) {
      showToast('Please enter elements inside the Cost-benefit quadrants.', 'alert');
      return;
    }

    setIsSaving(true);
    const userId = currentUser?.uid || auth.currentUser?.uid;
    const logId = 'cba-' + Date.now();
    const newLogItem = {
      id: logId,
      userId: userId || 'sandbox-user',
      prosUsing: cbaForm.prosUsing,
      consUsing: cbaForm.consUsing,
      prosSobriety: cbaForm.prosSobriety,
      consSobriety: cbaForm.consSobriety,
      createdAt: new Date()
    };

    if (userId) {
      try {
        const logDocRef = doc(db, `users/${userId}/cbaLogs`, logId);
        await setDoc(logDocRef, {
          ...newLogItem,
          createdAt: serverTimestamp()
        });
        showToast('⚖️ Cost-Benefit Analysis worksheet synchronized to Cloud Storage!', 'success');
        
        // Reset Form
        setCbaForm({
          prosUsing: '',
          consUsing: '',
          prosSobriety: '',
          consSobriety: ''
        });
        fetchLogs();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/cbaLogs/${logId}`);
        showToast('Database error occurred. Saved locally instead.', 'alert');
        saveCBALocally(newLogItem);
      }
    } else {
      saveCBALocally(newLogItem);
    }
    setIsSaving(false);
  };

  const saveCBALocally = (item: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('myrecovery_local_cba_logs') || '[]');
      const updated = [item, ...existing];
      localStorage.setItem('myrecovery_local_cba_logs', JSON.stringify(updated));
      showToast('⚖️ Cost-Benefit Analysis worksheet stored safely inside Local Storage Cache!', 'success');
      setCbaForm({
        prosUsing: '',
        consUsing: '',
        prosSobriety: '',
        consSobriety: ''
      });
      fetchLogs();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Mood submission
  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodForm.notes.trim()) {
      showToast('Please insert a private reflection or notes.', 'alert');
      return;
    }

    setIsSaving(true);
    const userId = currentUser?.uid || auth.currentUser?.uid;
    const logId = 'mood-' + Date.now();

    // Mapping 1-10 slider score to standard app mood identifiers
    let mappedMood: 'great' | 'good' | 'okay' | 'struggling' | 'crisis' = 'okay';
    if (moodForm.moodScore <= 2) mappedMood = 'crisis';
    else if (moodForm.moodScore <= 4) mappedMood = 'struggling';
    else if (moodForm.moodScore <= 6) mappedMood = 'okay';
    else if (moodForm.moodScore <= 8) mappedMood = 'good';
    else mappedMood = 'great';

    const newLogItem = {
      id: logId,
      userId: userId || 'sandbox-user',
      mood: mappedMood,
      note: moodForm.notes,
      timestamp: new Date().toISOString()
    };

    if (userId) {
      try {
        // Saving directly to our subcollection (reactive sync via App onSnapshot)
        const moodDocRef = doc(db, `users/${userId}/moodLogs`, logId);
        await setDoc(moodDocRef, {
          userId: userId,
          mood: mappedMood,
          note: moodForm.notes,
          timestamp: serverTimestamp()
        });
        showToast('📈 Wellness Mood Log synchronized successfully to Spokane Database!', 'success');

        // Reset Form
        setMoodForm({
          moodScore: 5,
          notes: ''
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/moodLogs/${logId}`);
        showToast('Database error occurred. Saved locally instead.', 'alert');
        saveMoodLocally(newLogItem);
      }
    } else {
      saveMoodLocally(newLogItem);
    }
    setIsSaving(false);
  };

  const saveMoodLocally = (item: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('sober_spokane_moodLogs') || '[]');
      const updated = [item, ...existing];
      localStorage.setItem('sober_spokane_moodLogs', JSON.stringify(updated));
      showToast('📈 Wellness Mood Log stored safely inside Local Storage Cache!', 'success');
      setMoodForm({
        moodScore: 5,
        notes: ''
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Delete log exercises
  const handleDeleteLogItem = async (id: string, type: 'ABC' | 'CBA') => {
    const confirmed = window.confirm(`Are you sure you want to delete this completed ${type} worksheet?`);
    if (!confirmed) return;

    const userId = currentUser?.uid || auth.currentUser?.uid;
    if (userId) {
      try {
        const collectionPath = type === 'ABC' ? 'abcLogs' : 'cbaLogs';
        const docRef = doc(db, `users/${userId}/${collectionPath}`, id);
        await deleteDoc(docRef);
        showToast('Worksheet removed from Cloud.', 'success');
        if (activeViewedExercise?.data?.id === id) {
          setActiveViewedExercise(null);
        }
        fetchLogs();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}/${type === 'ABC' ? 'abcLogs' : 'cbaLogs'}/${id}`);
      }
    } else {
      try {
        const localName = type === 'ABC' ? 'myrecovery_local_abc_logs' : 'myrecovery_local_cba_logs';
        const existing = JSON.parse(localStorage.getItem(localName) || '[]');
        const updated = existing.filter((item: any) => item.id !== id);
        localStorage.setItem(localName, JSON.stringify(updated));
        showToast('Worksheet removed from Local Storage.', 'success');
        if (activeViewedExercise?.data?.id === id) {
          setActiveViewedExercise(null);
        }
        fetchLogs();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getMoodAesthetic = (score: number) => {
    if (score <= 2) {
      return {
        label: 'Crisis',
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        textColor: 'text-rose-400',
        icon: <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0" />
      };
    }
    if (score <= 4) {
      return {
        label: 'Struggling',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        textColor: 'text-amber-400',
        icon: <Frown className="w-8 h-8 text-amber-500 shrink-0" />
      };
    }
    if (score <= 6) {
      return {
        label: 'Neutral / Okay',
        color: 'text-slate-400',
        bg: 'bg-slate-400/10',
        border: 'border-slate-800',
        textColor: 'text-slate-300',
        icon: <Meh className="w-8 h-8 text-slate-400 shrink-0" />
      };
    }
    if (score <= 8) {
      return {
        label: 'Good / Progressing',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        textColor: 'text-blue-300',
        icon: <Smile className="w-8 h-8 text-blue-400 shrink-0" />
      };
    }
    return {
      label: 'Great / Thriving',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      textColor: 'text-emerald-300',
      icon: <Sparkles className="w-8 h-8 text-emerald-400 shrink-0 animate-bounce" />
    };
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-1">
      {/* Header Summary Panel */}
      <div className="bg-gradient-to-br from-slate-900/90 to-blue-950/25 border border-slate-800/80 p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shadow-inner">
              <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div className="text-left space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">SMART Recovery Workspaces</h2>
              <p className="text-slate-400 text-xs font-medium max-w-lg leading-relaxed">
                Empirical self-management tools based on Cognitive Behavioral Therapy (CBT) and Motivational Interviewing. Harness reason and action to regulate feelings, identify triggers, and fuel sobriety.
              </p>
            </div>
          </div>
          <div className="bg-slate-950/50 p-4 border border-slate-800/80 rounded-2xl text-left flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
              <div>Sync Node State</div>
              <div className="text-emerald-400 font-black mt-0.5">Durable Ledger Sync</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls Layout */}
      <div className="bg-slate-900/40 p-2 border border-slate-800/60 rounded-[2rem] flex flex-wrap gap-2">
        <button
          onClick={() => { setActiveTab('ABC'); setActiveViewedExercise(null); }}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'ABC' 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/40 border border-indigo-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          ABC Problem Solving
        </button>
        <button
          onClick={() => { setActiveTab('CBA'); setActiveViewedExercise(null); }}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'CBA' 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/40 border border-indigo-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Scale className="w-4 h-4" />
          Cost-Benefit Analysis (CBA)
        </button>
        <button
          onClick={() => { setActiveTab('Mood'); setActiveViewedExercise(null); }}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'Mood' 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/40 border border-indigo-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          Mood Log
        </button>
        <button
          onClick={() => { setActiveTab('LOGS'); }}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ml-auto ${
            activeTab === 'LOGS' 
              ? 'bg-slate-800 text-indigo-400 shadow-xl border border-slate-700' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Logged Worksheets ({abcLogs.length + cbaLogs.length})
        </button>
      </div>

      {/* Primary Tools Workspace */}
      <div className="bg-[#0f172a]/80 border border-slate-800/80 p-6 md:p-8 rounded-[2rem] shadow-xl">
        {/* TAB 1: ABC Problem Solving */}
        {activeTab === 'ABC' && (
          <form onSubmit={handleSaveABC} className="space-y-6 text-left">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1.5 text-slate-300">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">The ABCs of Emotional Self-Regulation</p>
                <p>
                  Emotional consequences don't flow directly from events, but from the beliefs we construct about them. Map your irrational thoughts (such as awfulizing or musturbation), challenge their logic, and formulate realistic beliefs.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { 
                  id: 'A', 
                  title: 'A - Activating Event', 
                  subtitle: 'Describe the raw trigger, event, or occurrence neutrally.',
                  placeholder: 'e.g., I received a text from my ex-partner asking about outstanding documents, causing immediate adrenaline and anxiety...',
                  field: 'activatingEvent' 
                },
                { 
                  id: 'B', 
                  title: 'B - Beliefs (Internal Script)', 
                  subtitle: 'What absolute statements are you telling yourself? Look for "musts" and "shoulds".',
                  placeholder: 'e.g., I must not feel like this. Everything is ruined. This always happens to me and I will never move past my past mistakes.',
                  field: 'beliefs' 
                },
                { 
                  id: 'C', 
                  title: 'C - Emotional and Behavioral Consequences', 
                  subtitle: 'Identify what you felt (anger, fear, shame) and how you wanted to act (urges, isolation).',
                  placeholder: 'e.g., Extreme panic weight in my chest. Instant urge to escape or numb out with substances. Closed social media accounts.',
                  field: 'consequences' 
                },
                { 
                  id: 'D', 
                  title: 'D - Dispute / Challenge Logic', 
                  subtitle: 'Challenge your assumptions. Is it truly awful or just uncomfortable? What is the evidence?',
                  placeholder: 'e.g., It is just a text message, not an emergency. I have dealt with difficult text exchanges before. While it is annoying, it does not ruin my recovery progress.',
                  field: 'disputes' 
                },
                { 
                  id: 'E', 
                  title: 'E - Effective New Belief', 
                  subtitle: 'Formulate an objective, balanced, and productive worldview to replace the old script.',
                  placeholder: 'e.g., This is an unpleasant message, but I am strong. I can handle this without reverting to old coping habits. I will address it tomorrow when I am calm.',
                  field: 'effectiveBeliefs' 
                },
              ].map((section) => (
                <div key={section.id} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/10 hover:border-slate-805 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-5 bg-slate-900/45 hover:bg-slate-900/70 transition-all text-left"
                  >
                    <div>
                      <div className="font-extrabold text-sm text-white tracking-tight">{section.title}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{section.subtitle}</div>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {expandedSection === section.id && (
                    <div className="p-5 bg-slate-950/40 border-t border-slate-800/40">
                      <textarea
                        required={section.id !== 'C' && section.id !== 'D'}
                        value={abcForm[section.field as keyof typeof abcForm]}
                        onChange={(e) => setAbcForm({ ...abcForm, [section.field]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 min-h-[125px] outline-none transition-all placeholder-slate-600 font-medium leading-relaxed font-sans"
                        placeholder={section.placeholder}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-950/20 disabled:opacity-50 mt-6"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Synchronizing Ledger...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save ABC Problem Solving Log
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: Cost-Benefit Analysis (CBA) */}
        {activeTab === 'CBA' && (
          <form onSubmit={handleSaveCBA} className="space-y-6 text-left">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-start gap-3">
              <Scale className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1.5 text-slate-300">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">Weighing the Reality of Cravings vs. Sobriety</p>
                <p>
                  Most addictive habits provide immediate short-term benefits followed by heavy, catastrophic long-term costs. Fill out the advantages and disadvantages of each path to objectively break down the urge.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Using Column */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-400 border-b border-rose-950/40 pb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                  Option A: Engaging in relapse / behavior
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-4.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Advantages (Short-term Relief/Pros)
                    </label>
                    <textarea
                      value={cbaForm.prosUsing}
                      onChange={(e) => setCbaForm({ ...cbaForm, prosUsing: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-white min-h-[110px] outline-none focus:border-rose-800/60 font-sans"
                      placeholder="e.g., Immediate escape from feelings of emptiness, brief euphoric rush, numbs out sensory overwhelm..."
                    />
                  </div>

                  <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-4.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Disadvantages (Long-term Catastrophes/Cons)
                    </label>
                    <textarea
                      value={cbaForm.consUsing}
                      onChange={(e) => setCbaForm({ ...cbaForm, consUsing: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-white min-h-[110px] outline-none focus:border-rose-800/60 font-sans"
                      placeholder="e.g., Fractured financial stability, lost mental clarity, massive guilt/shame spiral, medical decline, broken trust of support peers..."
                    />
                  </div>
                </div>
              </div>

              {/* Recovery/Sober Column */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-950/40 pb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
                  Option B: Maintaining Sobriety / Not using
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-4.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Advantages (Long-term Fruits/Pros)
                    </label>
                    <textarea
                      value={cbaForm.prosSobriety}
                      onChange={(e) => setCbaForm({ ...cbaForm, prosSobriety: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-white min-h-[110px] outline-none focus:border-emerald-800/60 font-sans"
                      placeholder="e.g., Restored physical health, steady employment, authentic pride, genuine connection with Spokane recovery mentors, real confidence..."
                    />
                  </div>

                  <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-4.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Disadvantages (Short-term Hardships/Cons)
                    </label>
                    <textarea
                      value={cbaForm.consSobriety}
                      onChange={(e) => setCbaForm({ ...cbaForm, consSobriety: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-white min-h-[110px] outline-none focus:border-emerald-800/60 font-sans"
                      placeholder="e.g., Uncomfortable boredom, having to process difficult grief or memory triggers, physical anxiety spikes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 mt-6"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Synchronizing Ledger...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Cost-Benefit Analysis (CBA)
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB: Mood Log */}
        {activeTab === 'Mood' && (
          <form onSubmit={handleSaveMood} className="space-y-6 text-left">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-start gap-3">
              <Activity className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1.5 text-slate-300">
                <p className="font-bold text-white uppercase tracking-wider text-[11px]">Holistic Wellness & Trigger Tracking</p>
                <p>
                  Daily mood charting empowers self-awareness, allowing you to discover psychological patterns, trace triggering event connections, and document your recovery development over time.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-6">
              {/* Dynamic Status Display Card */}
              {(() => {
                const aesthetic = getMoodAesthetic(moodForm.moodScore);
                return (
                  <div className={`p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${aesthetic.bg} ${aesthetic.border}`}>
                    {aesthetic.icon}
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Current Assessment</span>
                      <h4 className={`text-lg font-black tracking-tight ${aesthetic.color}`}>{aesthetic.label} ({moodForm.moodScore} / 10)</h4>
                    </div>
                  </div>
                );
              })()}

              {/* Slider Controller */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  Select Daily Wellness Rating (1 - 10)
                </label>
                <div className="flex items-center gap-4 py-2">
                  <Frown className="w-5 h-5 text-slate-600 shrink-0" />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodForm.moodScore}
                    onChange={(e) => setMoodForm({ ...moodForm, moodScore: parseInt(e.target.value, 10) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 font-sans"
                  />
                  <Smile className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider px-1">
                  <span>Struggling (1-3)</span>
                  <span>Neutral (4-6)</span>
                  <span>Thriving (7-10)</span>
                </div>
              </div>

              {/* Reflections Area */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  Daily Reflections & Challenges (Required)
                </label>
                <textarea
                  required
                  value={moodForm.notes}
                  onChange={(e) => setMoodForm({ ...moodForm, notes: e.target.value })}
                  placeholder="What influenced your emotional state today? Describe any triggers, cravings confronted, or victories achieved..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 min-h-[140px] outline-none transition-all placeholder-slate-600 font-medium leading-relaxed font-sans"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Synchronizing Log...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Mood Reflection Log
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: My Logged Exercises */}
        {activeTab === 'LOGS' && (
          <div className="space-y-6 text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Sober-Management Exercise History
            </h3>

            {isLoadingLogs ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2 font-mono">
                <RefreshCw size={24} className="animate-spin text-indigo-400 mb-2" />
                Retrieving database ledger history...
              </div>
            ) : abcLogs.length === 0 && cbaLogs.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                <Brain className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">No exercise logs found</div>
                <div className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Start logging your thoughts using the ABC Problem Solving tool or the Cost-Benefit Analysis worksheet!
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Logs Sidebar List */}
                <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/60 p-2 rounded-lg text-center select-none">
                    Select a logged exercise to view detail
                  </div>

                  {/* Render ABC Logs List */}
                  {abcLogs.map(log => (
                    <div 
                      key={log.id}
                      onClick={() => setActiveViewedExercise({ type: 'ABC', data: log })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                        activeViewedExercise?.data?.id === log.id 
                          ? 'bg-indigo-650/15 border-indigo-500/40' 
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/70 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-mono font-black uppercase tracking-wider rounded border border-indigo-400/20">
                          ABC Form
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLogItem(log.id, 'ABC');
                          }}
                          className="text-slate-600 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="text-xs font-extrabold text-white mt-2.5 truncate">
                        {log.activatingEvent}
                      </div>
                      <div className="text-[9.5px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  ))}

                  {/* Render CBA Logs List */}
                  {cbaLogs.map(log => (
                    <div 
                      key={log.id}
                      onClick={() => setActiveViewedExercise({ type: 'CBA', data: log })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                        activeViewedExercise?.data?.id === log.id 
                          ? 'bg-blue-650/15 border-blue-500/40' 
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/70 hover:border-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[8px] font-mono font-black uppercase tracking-wider rounded border border-cyan-400/20">
                          CBA Quadrants
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLogItem(log.id, 'CBA');
                          }}
                          className="text-slate-600 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="text-xs font-extrabold text-white mt-2.5 truncate">
                        Pros: {log.prosSobriety || 'Maintaining sober boundaries'}
                      </div>
                      <div className="text-[9.5px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detail Viewer Pane */}
                <div className="lg:col-span-2 bg-[#020617]/50 border border-slate-850 rounded-[2rem] p-6 min-h-[350px]">
                  {activeViewedExercise ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${activeViewedExercise.type === 'ABC' ? 'bg-indigo-500' : 'bg-cyan-400'}`} />
                            {activeViewedExercise.type === 'ABC' ? 'ABC Problem Solving Logged Detail' : 'Saved Cost-Benefit Analysis'}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            Logged date: {new Date(activeViewedExercise.data.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteLogItem(activeViewedExercise.data.id, activeViewedExercise.type)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>

                      {/* Display Selected ABC Log */}
                      {activeViewedExercise.type === 'ABC' && (
                        <div className="space-y-4">
                          {[
                            { label: 'A - Activating Event', value: activeViewedExercise.data.activatingEvent, color: 'border-l-indigo-500' },
                            { label: 'B - Beliefs (Internal Script)', value: activeViewedExercise.data.beliefs, color: 'border-l-amber-500' },
                            { label: 'C - Emotional and Behavioral Consequences', value: activeViewedExercise.data.consequences || 'None recorded', color: 'border-l-rose-500' },
                            { label: 'D - Dispute / Challenging Self-Assumptions', value: activeViewedExercise.data.disputes || 'None recorded', color: 'border-l-blue-500' },
                            { label: 'E - Effective New Balanced belief', value: activeViewedExercise.data.effectiveBeliefs, color: 'border-l-emerald-500' },
                          ].map((item, idx) => (
                            <div key={idx} className={`p-4 bg-slate-900/40 border border-slate-850 border-l-4 ${item.color} rounded-r-xl`}>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</span>
                              <p className="text-xs text-slate-100 font-medium mt-2 leading-relaxed whitespace-pre-wrap font-sans">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display Selected CBA Log */}
                      {activeViewedExercise.type === 'CBA' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900/30 border border-slate-850 border-t-4 border-t-rose-500/70 rounded-xl space-y-2">
                              <span className="text-[10.5px] font-black text-rose-400 uppercase tracking-widest block border-b border-slate-850 pb-1">Using - Pros</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">{activeViewedExercise.data.prosUsing || 'No advantages entered'}</p>
                            </div>
                            <div className="p-4 bg-slate-900/30 border border-slate-850 border-t-4 border-t-rose-500/70 rounded-xl space-y-2">
                              <span className="text-[10.5px] font-black text-rose-400 uppercase tracking-widest block border-b border-slate-850 pb-1">Using - Cons</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">{activeViewedExercise.data.consUsing || 'No disadvantages entered'}</p>
                            </div>
                            <div className="p-4 bg-slate-900/30 border border-slate-850 border-t-4 border-t-emerald-500/70 rounded-xl space-y-2">
                              <span className="text-[10.5px] font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-850 pb-1">Sober - Pros</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">{activeViewedExercise.data.prosSobriety || 'No advantages entered'}</p>
                            </div>
                            <div className="p-4 bg-slate-900/30 border border-slate-850 border-t-4 border-t-emerald-500/70 rounded-xl space-y-2">
                              <span className="text-[10.5px] font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-850 pb-1">Sober - Cons</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">{activeViewedExercise.data.consSobriety || 'No disadvantages entered'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-16 text-center text-slate-600 gap-2">
                      <Sparkles className="w-8 h-8 text-slate-850 animate-bounce" />
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">No Worksheet Selected</div>
                      <p className="text-[10.5px] text-slate-600 max-w-xs leading-relaxed">
                        Click on any completed ABC form or CBA quadrant set on the left to inspect its parameters.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
