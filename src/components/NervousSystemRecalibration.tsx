import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Wind, Activity, Zap, Compass, RefreshCw, ChevronRight, 
  Smile, ShieldCheck, Heart, AlertTriangle, ArrowRight, Play, 
  Pause, CheckCircle2, Waves, Eye, Fingerprint, Volume2, Flower2, Coffee, Trash2, Calendar,
  BookOpen, ChevronLeft, Type, Clock, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, query, collection, getDocs, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';

interface SomaticLog {
  id: string;
  userId: string;
  type: 'hrv' | 'somatic';
  createdAt: Date;
  // HRV specific
  durationMinutes?: number;
  // Somatic specific
  safeSpot?: string;
  temperature?: string;
  weight?: string;
  texture?: string;
  sensationDescription?: string;
  dischargeSymptom?: string;
}

interface NervousSystemRecalibrationProps {
  currentUser?: any;
  showToast?: (msg: string, type: 'success' | 'alert' | 'info') => void;
  onClose?: () => void;
}

export const NervousSystemRecalibration: React.FC<NervousSystemRecalibrationProps> = ({ 
  currentUser, 
  showToast = () => {}, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'hrv' | 'breathing' | 'somatic' | 'grounding' | 'history'>('guide');
  const [logs, setLogs] = useState<SomaticLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // HRV Pacer state
  const [hrvActive, setHrvActive] = useState(false);
  const [hrvTimeLeft, setHrvTimeLeft] = useState(300); // 5 minutes default (300s)
  const [hrvTotalDuration, setHrvTotalDuration] = useState(300);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [breathSeconds, setBreathSeconds] = useState(5); // 5s timer
  const [simulatedHR, setSimulatedHR] = useState(72);
  const [hrvHistory, setHrvHistory] = useState<number[]>(Array.from({ length: 40 }, () => 70 + Math.random() * 5));

  // Guided Breathing state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingTimeLeft, setBreathingTimeLeft] = useState(300); // in seconds
  const [breathingTotalDuration, setBreathingTotalDuration] = useState(300);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut'>('inhale');
  const [breathingSeconds, setBreathingSeconds] = useState(5);
  const [customInhale, setCustomInhale] = useState(5);
  const [customHoldIn, setCustomHoldIn] = useState(0);
  const [customExhale, setCustomExhale] = useState(5);
  const [customHoldOut, setCustomHoldOut] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<'coherence' | 'box' | 'calm' | 'custom'>('coherence');
  const [breathingTheme, setBreathingTheme] = useState<'ocean' | 'sunrise' | 'nebula' | 'forest'>('ocean');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedBreathsCount, setCompletedBreathsCount] = useState(0);
  const [breathingMinsInput, setBreathingMinsInput] = useState(5);
  const [breathingNote, setBreathingNote] = useState('');
  const [breathingSessionComplete, setBreathingSessionComplete] = useState(false);
  const [completedSessionDetails, setCompletedSessionDetails] = useState<{ duration: number; breaths: number; preset: string; note: string } | null>(null);

  // Somatic Wizard State
  const [somaticStep, setSomaticStep] = useState(1);
  const [safeSpot, setSafeSpot] = useState('');
  const [somaticTemp, setSomaticTemp] = useState<'Hot' | 'Cold' | 'Neutral' | null>(null);
  const [somaticWeight, setSomaticWeight] = useState<'Heavy' | 'Light' | 'Throbbing' | 'Dense' | null>(null);
  const [somaticTexture, setSomaticTexture] = useState<'Sharp' | 'Dull' | 'Fuzzy' | 'Tingly' | null>(null);
  const [sensationDesc, setSensationDesc] = useState('');
  const [pendulationActive, setPendulationActive] = useState(false);
  const [pendulationPhase, setPendulationPhase] = useState<'safe' | 'symptom'>('safe');
  const [pendulationSeconds, setPendulationSeconds] = useState(15);
  const [pendulationCycles, setPendulationCycles] = useState(0);
  const [dischargeTypes, setDischargeTypes] = useState<string[]>([]);
  const [somaticDuration, setSomaticDuration] = useState(300); // default 5 mins (300s)
  const [somaticTimeLeft, setSomaticTimeLeft] = useState(300);
  const [isSaving, setIsSaving] = useState(false);

  // Neuroscience Grief Report & Expressive Writing states
  const [showGriefGuide, setShowGriefGuide] = useState(false);
  const [griefFont, setGriefFont] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [griefFontSize, setGriefFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [writingActive, setWritingActive] = useState(false);
  const [writingText, setWritingText] = useState('');
  const [writingTimeLeft, setWritingTimeLeft] = useState(900); // default 15 minutes (900 seconds)
  const [writingTotalDuration, setWritingTotalDuration] = useState(900);

  // Breathing/Writing interactive sub-tab state
  const [breathingMode, setBreathingMode] = useState<'breath' | 'writing'>('breath');
  const [pennebakerDay, setPennebakerDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pennebaker_day');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  // 5-4-3-2-1 Grounding state
  const [groundingStep, setGroundingStep] = useState(0);
  const groundingSteps = [
    { label: "Look: 5 things you can see", desc: "Scan your surroundings. Name them out loud or in your mind softly.", icon: <Eye className="text-blue-400" size={32} /> },
    { label: "Touch: 4 things you can feel", desc: "Notice physical pressures. The fabric of your pants, the cooling air, the firmness of your chair.", icon: <Fingerprint className="text-emerald-400" size={32} /> },
    { label: "Hear: 3 things you can hear", desc: "Listen beneath the noise. A car distance away, an air conditioner vent humming, your own soft breathing.", icon: <Volume2 className="text-purple-400" size={32} /> },
    { label: "Smell: 2 things you can smell", desc: "Inhale deeply. Is there coffee, old paper, fresh grass, or simply neutral atmosphere?", icon: <Flower2 className="text-pink-400" size={32} /> },
    { label: "Taste: 1 thing you can taste", desc: "Explore your palate. The lingering mint toothpaste, coffee notes, or a sip of cold water.", icon: <Coffee className="text-amber-400" size={32} /> },
  ];

  // Fetch logged somatic/hrv sessions from Firestore or LocalStorage
  const fetchSomaticLogs = async () => {
    setIsLoadingLogs(true);
    const userId = currentUser?.uid || auth.currentUser?.uid;

    if (userId) {
      try {
        const path = `users/${userId}/somaticLogs`;
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const tempLogs: SomaticLog[] = [];
        snap.forEach(doc => {
          const d = doc.data();
          tempLogs.push({
            id: doc.id,
            userId: d.userId,
            type: d.type,
            durationMinutes: d.durationMinutes,
            safeSpot: d.safeSpot,
            temperature: d.temperature,
            weight: d.weight,
            texture: d.texture,
            sensationDescription: d.sensationDescription,
            dischargeSymptom: d.dischargeSymptom,
            createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date()
          });
        });
        setLogs(tempLogs);
      } catch (err) {
        console.error('Error loading somatic database logs:', err);
      }
    } else {
      try {
        const local = JSON.parse(localStorage.getItem('myrecovery_local_somatic_logs') || '[]');
        setLogs(local);
      } catch (e) {
        console.warn('LocalStorage fallback failed:', e);
      }
    }
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    fetchSomaticLogs();
  }, [currentUser]);

  // HRV timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (hrvActive) {
      interval = setInterval(() => {
        // Countdown remaining session time
        setHrvTimeLeft((prev) => {
          if (prev <= 1) {
            handleCompleteHrvSession();
            return 0;
          }
          return prev - 1;
        });

        // Breathing cycle tracking (5s in, 5s out)
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            const nextPhase = breathPhase === 'inhale' ? 'exhale' : 'inhale';
            setBreathPhase(nextPhase);
            // Quick notification wave cue
            return 5;
          }
          return prev - 1;
        });

        // Generate biofeedback heart-rate fluctuations based on breathing phase
        // Heart rate rises during inhale, drops during exhale
        setSimulatedHR((prev) => {
          let change = 0;
          if (breathPhase === 'inhale') {
            // Heart rate trends higher (vagal withdrawal)
            change = 1.6 + Math.random() * 0.8;
          } else {
            // Heart rate drops (respiratory sinus arrhythmia, vagal stimulation)
            change = -2.2 - Math.random() * 1.0;
          }
          const nextHR = Math.max(55, Math.min(95, prev + change));
          
          // Append to chart history path
          setHrvHistory(prevHistory => {
            const updated = [...prevHistory.slice(1), nextHR];
            return updated;
          });

          return Math.round(nextHR * 10) / 10;
        });

      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hrvActive, breathPhase]);

  // Pendulation timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pendulationActive) {
      interval = setInterval(() => {
        // Countdown remaining session time for somatic exercise
        setSomaticTimeLeft((prev) => {
          if (prev <= 1) {
            setPendulationActive(false);
            setSomaticStep(4);
            showToast("🌱 Somatic pendulation session complete! Let's process the discharge release.", 'success');
            return 0;
          }
          return prev - 1;
        });

        setPendulationSeconds((prev) => {
          if (prev <= 1) {
            // Swing state!
            const nextPhase = pendulationPhase === 'safe' ? 'symptom' : 'safe';
            setPendulationPhase(nextPhase);
            if (nextPhase === 'safe') {
              setPendulationCycles((c) => c + 1);
            }
            showToast(
              nextPhase === 'safe' 
                ? "🌱 Swing focus to your Safe anchor spot." 
                : "⚡ Gently shift awareness back to the physical sensation.",
              'info'
            );
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pendulationActive, pendulationPhase]);

  const handleStartHrv = (durationMins: number) => {
    setHrvTotalDuration(durationMins * 60);
    setHrvTimeLeft(durationMins * 60);
    setBreathPhase('inhale');
    setBreathSeconds(5);
    setHrvActive(true);
    showToast('📲 Breathing pacer started. Sync your lungs with the moving waves.', 'info');
  };

  const handleSetSomaticDuration = (mins: number) => {
    setSomaticDuration(mins * 60);
    setSomaticTimeLeft(mins * 60);
    showToast(`🕒 Somatic pendulation duration set to ${mins} minutes.`, 'info');
  };

  // Pennebaker Expressive Writing timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (writingActive) {
      interval = setInterval(() => {
        setWritingTimeLeft((prev) => {
          if (prev <= 1) {
            setWritingActive(false);
            handleCompleteWritingSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [writingActive]);

  const handleCompleteWritingSession = async () => {
    setWritingActive(false);
    const userId = currentUser?.uid || auth.currentUser?.uid;
    const durationLogged = Math.round((writingTotalDuration - writingTimeLeft) / 60) || 1;
    
    const newLog: SomaticLog = {
      id: userId ? doc(collection(db, 'users')).id : 'local_' + Math.random().toString(36).substring(2, 11),
      userId: userId || 'anonymous',
      type: 'somatic',
      createdAt: new Date(),
      safeSpot: `Pennebaker Expressive Writing (Day ${pennebakerDay})`,
      temperature: 'Grief Neuro-Integration',
      weight: `Day ${pennebakerDay} Protocol`,
      texture: 'Neuro-Psychology of Grief',
      sensationDescription: writingText.trim() || `Completed Day ${pennebakerDay} of Dr. Pennebaker's Expressive Writing protocol: organizing emotional narratives into the prefrontal cortex.`,
      dischargeSymptom: `Pennebaker 4-Day Protocol Day ${pennebakerDay} integrated.`
    };

    setIsSaving(true);
    if (userId) {
      try {
        await setDoc(doc(db, `users/${userId}/somaticLogs`, newLog.id), {
          ...newLog,
          createdAt: serverTimestamp()
        });
        showToast('📝 Expressive writing session saved successfully to history logs!', 'success');
        fetchSomaticLogs();
      } catch (err) {
        console.error('Firestore save failed for writing:', err);
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/somaticLogs/${newLog.id}`);
        saveSomaticLocally(newLog);
      }
    } else {
      saveSomaticLocally(newLog);
    }
    setIsSaving(false);
    const dayCompleted = pennebakerDay;
    if (pennebakerDay < 4) {
      const nextDay = pennebakerDay + 1;
      setPennebakerDay(nextDay);
      localStorage.setItem('pennebaker_day', nextDay.toString());
      showToast(`🏆 Protocol Day ${dayCompleted} complete! Advanced to Day ${nextDay}.`, 'success');
    } else {
      showToast(`🏆 Protocol Day 4 of 4 completed! You have successfully organized and integrated your emotional narrative. Outstanding.`, 'success');
    }
    setWritingText('');
    setWritingTimeLeft(writingTotalDuration);
  };

  const handleCompleteHrvSession = async () => {
    setHrvActive(false);
    const userId = currentUser?.uid || auth.currentUser?.uid;
    const durationLogged = Math.round((hrvTotalDuration - hrvTimeLeft) / 60);

    if (durationLogged <= 0) {
      showToast('Session cancelled too early to record.', 'info');
      return;
    }

    const logId = 'som-hrv-' + Date.now();
    const newLog: SomaticLog = {
      id: logId,
      userId: userId || 'sandbox-user',
      type: 'hrv',
      durationMinutes: durationLogged,
      createdAt: new Date()
    };

    setIsSaving(true);
    if (userId) {
      try {
        await setDoc(doc(db, `users/${userId}/somaticLogs`, logId), {
          ...newLog,
          createdAt: serverTimestamp()
        });
        showToast(`📊 Balanced! Logged ${durationLogged} min HRV Breathing Session.`, 'success');
        fetchSomaticLogs();
      } catch (err) {
        saveSomaticLocally(newLog);
      }
    } else {
      saveSomaticLocally(newLog);
    }
    setIsSaving(false);
    setActiveTab('history');
  };

  // Web Audio synthetic chime creator
  const playBreathingChime = (phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      let freq = 440;
      if (phase === 'inhale') freq = 523.25;      // C5 (ascending, opening)
      else if (phase === 'holdIn') freq = 659.25;  // E5 (suspension, high point)
      else if (phase === 'exhale') freq = 392.00;  // G4 (descending, releasing)
      else if (phase === 'holdOut') freq = 329.63; // E4 (stillness, grounding)
      
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.62);
    } catch (e) {
      console.warn('Audio play suppressed/failed:', e);
    }
  };

  const applyPreset = (preset: 'coherence' | 'box' | 'calm' | 'custom') => {
    setSelectedPreset(preset);
    if (preset === 'coherence') {
      setCustomInhale(5);
      setCustomHoldIn(0);
      setCustomExhale(5);
      setCustomHoldOut(0);
    } else if (preset === 'box') {
      setCustomInhale(4);
      setCustomHoldIn(4);
      setCustomExhale(4);
      setCustomHoldOut(4);
    } else if (preset === 'calm') {
      setCustomInhale(4);
      setCustomHoldIn(7);
      setCustomExhale(8);
      setCustomHoldOut(0);
    }
  };

  // Guided Breathing timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (breathingActive) {
      interval = setInterval(() => {
        // 1. Session Duration Count down
        setBreathingTimeLeft((prev) => {
          if (prev <= 1) {
            handleCompleteBreathingSession();
            return 0;
          }
          return prev - 1;
        });

        // 2. Phrase timer count down
        setBreathingSeconds((prevSecs) => {
          if (prevSecs <= 1) {
            let nextPhase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut' = 'inhale';
            let nextDuration = customInhale;

            // Determine next phase
            if (breathingPhase === 'inhale') {
              if (customHoldIn > 0) {
                nextPhase = 'holdIn';
                nextDuration = customHoldIn;
              } else {
                nextPhase = 'exhale';
                nextDuration = customExhale;
              }
            } else if (breathingPhase === 'holdIn') {
              nextPhase = 'exhale';
              nextDuration = customExhale;
            } else if (breathingPhase === 'exhale') {
              if (customHoldOut > 0) {
                nextPhase = 'holdOut';
                nextDuration = customHoldOut;
              } else {
                nextPhase = 'inhale';
                nextDuration = customInhale;
                setCompletedBreathsCount((c) => c + 1);
              }
            } else if (breathingPhase === 'holdOut') {
              nextPhase = 'inhale';
              nextDuration = customInhale;
              setCompletedBreathsCount((c) => c + 1);
            }

            setBreathingPhase(nextPhase);
            playBreathingChime(nextPhase);
            return nextDuration;
          }
          return prevSecs - 1;
        });

      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breathingActive, breathingPhase, customInhale, customHoldIn, customExhale, customHoldOut, soundEnabled]);

  const handleStartBreathing = () => {
    const totalSecs = (breathingMinsInput || 5) * 60;
    setBreathingTotalDuration(totalSecs);
    setBreathingTimeLeft(totalSecs);
    
    setBreathingPhase('inhale');
    setBreathingSeconds(customInhale);
    setCompletedBreathsCount(0);
    setBreathingActive(true);
    
    showToast('💨 Guided breathing session active. Breathe smoothly in sync.', 'success');
    playBreathingChime('inhale');
  };

  const handleCompleteBreathingSession = async () => {
    setBreathingActive(false);
    const userId = currentUser?.uid || auth.currentUser?.uid;
    const durationLogged = Math.round((breathingTotalDuration - breathingTimeLeft) / 60) || 1;

    const logId = 'som-breathing-' + Date.now();
    const newLog: SomaticLog = {
      id: logId,
      userId: userId || 'sandbox-user',
      type: 'hrv',
      durationMinutes: durationLogged,
      sensationDescription: `Custom Breathing: ${customInhale}s In / ${customHoldIn}s Hold / ${customExhale}s Out / ${customHoldOut}s Hold. Pattern: ${selectedPreset}. Notes: ${breathingNote || 'Completed breathing exercise.'}`,
      createdAt: new Date()
    };

    setCompletedSessionDetails({
      duration: durationLogged,
      breaths: completedBreathsCount || Math.round((durationLogged * 60) / (customInhale + customHoldIn + customExhale + customHoldOut || 10)),
      preset: selectedPreset,
      note: breathingNote || 'N/A'
    });

    setIsSaving(true);
    if (userId) {
      try {
        await setDoc(doc(db, `users/${userId}/somaticLogs`, logId), {
          ...newLog,
          createdAt: serverTimestamp()
        });
        showToast(`🌬️ Logged! Stored ${durationLogged} min custom guided breathing session.`, 'success');
        fetchSomaticLogs();
      } catch (err) {
        saveSomaticLocally(newLog);
      }
    } else {
      saveSomaticLocally(newLog);
    }
    setIsSaving(false);
    setBreathingSessionComplete(true);
    setBreathingNote('');
  };

  const handleSaveSomaticWalkthrough = async () => {
    const userId = currentUser?.uid || auth.currentUser?.uid;
    const logId = 'som-somatic-' + Date.now();
    
    if (!safeSpot.trim()) {
      showToast('Please type a safety anchor spot first.', 'alert');
      return;
    }

    const newLog: SomaticLog = {
      id: logId,
      userId: userId || 'sandbox-user',
      type: 'somatic',
      safeSpot,
      temperature: somaticTemp || 'Neutral',
      weight: somaticWeight || 'Neutral',
      texture: somaticTexture || 'Neutral',
      sensationDescription: sensationDesc,
      dischargeSymptom: dischargeTypes.join(', ') || 'No felt discharge yet',
      createdAt: new Date()
    };

    setIsSaving(true);
    if (userId) {
      try {
        await setDoc(doc(db, `users/${userId}/somaticLogs`, logId), {
          ...newLog,
          createdAt: serverTimestamp()
        });
        showToast('🧘 Somatic Listening recalibration saved to cloud journal!', 'success');
        fetchSomaticLogs();
      } catch (err) {
        saveSomaticLocally(newLog);
      }
    } else {
      saveSomaticLocally(newLog);
    }
    setIsSaving(false);

    // Reset somatic wizard
    setSomaticStep(1);
    setSafeSpot('');
    setSomaticTemp(null);
    setSomaticWeight(null);
    setSomaticTexture(null);
    setSensationDesc('');
    setPendulationActive(false);
    setPendulationCycles(0);
    setDischargeTypes([]);
    setSomaticDuration(300);
    setSomaticTimeLeft(300);
    
    setActiveTab('history');
  };

  const saveSomaticLocally = (item: SomaticLog) => {
    try {
      const existing = JSON.parse(localStorage.getItem('myrecovery_local_somatic_logs') || '[]');
      const updated = [item, ...existing];
      localStorage.setItem('myrecovery_local_somatic_logs', JSON.stringify(updated));
      showToast('Session logged locally in Sandbox mode.', 'success');
      fetchSomaticLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLog = async (id: string) => {
    const confirmed = window.confirm('Permanently delete this nervous system record?');
    if (!confirmed) return;

    const userId = currentUser?.uid || auth.currentUser?.uid;
    if (userId) {
      try {
        await deleteDoc(doc(db, `users/${userId}/somaticLogs`, id));
        showToast('Record deleted.', 'success');
        fetchSomaticLogs();
      } catch (e) {
        console.error('Error deleting:', e);
      }
    } else {
      const existing = JSON.parse(localStorage.getItem('myrecovery_local_somatic_logs') || '[]');
      const updated = existing.filter((item: any) => item.id !== id);
      localStorage.setItem('myrecovery_local_somatic_logs', JSON.stringify(updated));
      showToast('Record deleted.', 'success');
      fetchSomaticLogs();
    }
  };

  const toggleDischarge = (type: string) => {
    setDischargeTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // SVG drawing of current HRV wave sequence
  const renderHrvPath = () => {
    const width = 360;
    const height = 65;
    const pointsCount = hrvHistory.length;
    const xStep = width / (pointsCount - 1);
    
    // Scale heart rate to SVG coordinate heights
    const minHR = Math.min(...hrvHistory, 55);
    const maxHR = Math.max(...hrvHistory, 95);
    const diff = maxHR - minHR || 10;

    const points = hrvHistory.map((hr, idx) => {
      const x = idx * xStep;
      // Invert height so higher HR is higher on scale
      const y = height - ((hr - minHR) / diff) * (height - 15) - 5;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left space-y-6">
      {/* Visual background gradient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px] pointer-events-none -ml-16 -mb-16" />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-5 relative">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600/15 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <Waves className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tight">Nervous System Recalibration</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-md">
              Regulate your vagal tone, cool the amygdala fear engine, and shift back into somatic peace.
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-350 cursor-pointer border border-slate-850 px-3 py-1.5 rounded-xl bg-slate-900/40"
          >
            ← Exit
          </button>
        )}
      </div>

      {/* Tab controls */}
      <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-850/60 p-1.5 rounded-2xl overflow-x-auto select-none snap-x scrollbar-none">
        {[
          { id: 'guide', label: 'Guide & Read', icon: Compass },
          { id: 'hrv', label: 'HRV Pacer', icon: Activity },
          { id: 'breathing', label: 'Guided Breathing', icon: Wind },
          { id: 'somatic', label: 'Somatic Listening', icon: Brain },
          { id: 'grounding', label: '5-4-3-2-1', icon: Wind },
          { id: 'history', label: 'My Calming Logs', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                // Terminate loops on tab switch
                if (tab.id !== 'hrv' && hrvActive) {
                  setHrvActive(false);
                }
                if (tab.id !== 'breathing') {
                  if (breathingActive) setBreathingActive(false);
                  setBreathingSessionComplete(false);
                }
                if (tab.id !== 'somatic' && pendulationActive) {
                  setPendulationActive(false);
                }
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap snap-center ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      <AnimatePresence mode="wait">
        
        {/* PANEL 1: GUIDE */}
        {activeTab === 'guide' && (
          <motion.div 
            key="guide" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {showGriefGuide ? (
              /* DEEP IMMERSIVE READING SPACE FOR NEUROSCIENCE OF GRIEF */
              <div className="bg-slate-950/40 border border-slate-850 p-6 md:p-8 rounded-[2rem] space-y-6 relative overflow-hidden text-left">
                {/* Back Link & Reading controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-4.5">
                  <button
                    onClick={() => {
                      setShowGriefGuide(false);
                      setWritingActive(false);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#818cf8] hover:text-white transition-all bg-indigo-950/20 border border-indigo-900/40 px-3 py-2 rounded-xl cursor-pointer"
                  >
                    <ChevronLeft size={13} /> Return to Recalibration Methods
                  </button>

                  <div className="flex items-center gap-3.5 flex-wrap">
                    {/* Font Selector */}
                    <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-lg items-center gap-1">
                      {(['serif', 'sans', 'mono'] as const).map(font => (
                        <button
                          key={font}
                          onClick={() => setGriefFont(font)}
                          className={`px-2 py-1 text-[9px] uppercase font-bold rounded cursor-pointer transition-all ${
                            griefFont === font ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-205 hover:text-slate-200'
                          }`}
                        >
                          {font}
                        </button>
                      ))}
                    </div>

                    {/* Font Size Selector */}
                    <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-lg items-center gap-1">
                      <button
                        onClick={() => setGriefFontSize('normal')}
                        className={`p-1 text-xs rounded cursor-pointer ${
                          griefFontSize === 'normal' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Normal Font Size"
                      >
                        <Type size={11} />
                      </button>
                      <button
                        onClick={() => setGriefFontSize('large')}
                        className={`p-1 text-xs rounded cursor-pointer ${
                          griefFontSize === 'large' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Large Font Size"
                      >
                        <Type size={14} />
                      </button>
                      <button
                        onClick={() => setGriefFontSize('xl')}
                        className={`p-1 text-xs rounded cursor-pointer ${
                          griefFontSize === 'xl' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Extra Large Font Size"
                      >
                        <Type size={17} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Article Container */}
                <div className={`space-y-8 ${
                  griefFont === 'serif' ? 'font-serif' : griefFont === 'mono' ? 'font-mono' : 'font-sans'
                } ${
                  griefFontSize === 'xl' ? 'text-[14px] md:text-[15.5px] leading-relaxed text-slate-205' : griefFontSize === 'large' ? 'text-[12.5px] md:text-[14px] leading-relaxed text-slate-205' : 'text-[11px] md:text-[12.5px] leading-relaxed text-slate-300'
                }`}>
                  
                  {/* Hero Banner */}
                  <div className="text-center space-y-3 pb-6 border-b border-slate-850">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-rose-400 font-sans block">
                      Neuroscience & Psychology Integration Report
                    </span>
                    <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-sans">
                      The Neuroscience and Psychology of Grief:<br />
                      <span className="text-[#818cf8]">Evidence-Based Pathways to Healing & Integration</span>
                    </h1>
                    <p className="text-slate-450 uppercase text-[9px] font-mono font-bold tracking-wider max-w-lg mx-auto">
                      Written to consolidate modern scientific understanding about bereavement, neural predictive coding models, and cognitive-behavioral recovery.
                    </p>
                  </div>

                  {/* Intro/Abstract */}
                  <p className="indent-6 text-slate-200 tracking-wide font-medium leading-relaxed">
                    For decades, popular culture has conceptualized grief through the lens of Elisabeth Kübler-Ross’s "Five Stages" (denial, anger, bargaining, depression, acceptance). While groundbreaking in its time, modern psychological and neurological science has moved far beyond this linear model. Today, science understands grief not as a sequence of emotional hurdles to "get over," but as a profound neurological rewiring process. When we lose a deep attachment, the brain must update its internal map of reality.
                  </p>

                  {/* Blockquote callout */}
                  <div className="p-5 md:p-6 bg-[#13101b]/70 border border-[#818cf8]/15 rounded-3xl relative overflow-hidden font-sans">
                    <div className="absolute top-0 right-0 text-7xl text-indigo-500/5 font-serif -mt-6 -mr-2 pointer-events-none select-none">“</div>
                    <p className="text-[#a5b4fc] text-xs md:text-sm leading-relaxed font-semibold italic relative z-10">
                      "Grief is the mismatch between the brain's baseline cognitive map of space-time-closeness, and the agonizing incoming sensory reality of physical absence. The intense yearning and confusion is the physical nervous system working overtime to update millions of neural pathways."
                    </p>
                    <div className="mt-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      — Summary of Vagal Integration Principles
                    </div>
                  </div>

                  {/* Part I Section */}
                  <div className="space-y-4">
                    <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-sans border-b border-indigo-950/80 pb-1.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px]">I</span>
                      Part I: The Neurobiology of Grief
                    </h2>
                    
                    <p className="text-slate-305 text-slate-300">
                      To understand how to heal from grief, we must first understand what it does to the physical brain. Dr. Mary-Frances O’Connor, a pioneering neuroscientist in the study of grief, describes the grieving brain as an organ struggling to solve a massive cognitive dissonance.
                    </p>

                    <div className="space-y-4.5 pl-2.5 border-l-2 border-slate-850 mt-4 font-sans">
                      <div>
                        <h4 className="text-[12px] font-black text-slate-205 uppercase tracking-tight">1. The Brain's Internal Map and Predictive Coding</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">
                          The human brain is a predictive machine. It maps out our relationships across three dimensions: time, space, and closeness. When you form a deep bond with someone, your brain physically wires them into your baseline understanding of reality. When that person dies, the brain's predictive coding fails. The cognitive map says the person is "out there" and will return, but the incoming sensory reality says they are gone. Grief is the neurological mismatch between these two realities. The intense yearning and confusion of grief is the brain working overtime to rewrite millions of neural pathways to understand that the person is permanently inaccessible in physical space.
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[12px] font-black text-slate-205 uppercase tracking-tight">2. The Reward System and the Amygdala</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">
                          Attachment is heavily mediated by the brain's reward centers (the nucleus accumbens) and hormones like oxytocin and dopamine.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                            <span className="text-[9px] font-black uppercase text-indigo-400 block tracking-wider">Withdrawal</span>
                            <span className="text-[11px] text-slate-355 leading-relaxed block mt-0.5">
                              Bereavement triggers a neurological state remarkably similar to chemical withdrawal. The brain yearns for the neurochemical reward of the lost loved one.
                            </span>
                          </div>
                          <div className="p-3 bg-slate-900/60 border border-slate-855 rounded-xl">
                            <span className="text-[9px] font-black uppercase text-[#ef4444] block tracking-wider">Threat Response</span>
                            <span className="text-[11px] text-slate-355 leading-relaxed block mt-0.5">
                              Simultaneously, the loss of a major attachment figure is interpreted by the amygdala (the threat-detection center) as a survival threat, triggering chronic "fight or flight" activation, elevated cortisol, and profound physiological exhaustion.
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[12px] font-black text-slate-205 uppercase tracking-tight">3. Prolonged Grief Disorder (Complicated Grief)</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">
                          In most people, the brain gradually updates its map. However, in about 7-10% of bereaved individuals, the brain gets "stuck." Known clinically as Prolonged Grief Disorder (PGD), neuroimaging shows that in these individuals, the nucleus accumbens (the reward center) continues to fire intensely in response to reminders of the deceased, reinforcing an endless loop of craving and yearning rather than adaptation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Part II Section */}
                  <div className="space-y-4">
                    <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-sans border-b border-indigo-950/80 pb-1.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px]">II</span>
                      Part II: Modern Psychological Frameworks of Healing
                    </h2>
                    
                    <p className="text-slate-300">
                      Contemporary psychology has abandoned the idea of "closure." Instead, the scientific consensus focuses on integration—learning to carry the loss while re-engaging with life.
                    </p>

                    <div className="space-y-4 ml-1">
                      <div className="bg-slate-900/40 border border-slate-850/80 p-5 rounded-2xl relative font-sans space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">1. The Dual Process Model of Coping (Stroebe & Schut)</h3>
                        <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                          Currently the most scientifically supported model of grief, the Dual Process Model suggests that healthy grieving is not a linear march toward acceptance, but an oscillation (a pendulum swing) between two distinct states:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
                            <strong className="text-indigo-400 text-[10.5px] uppercase block tracking-wider">A) Loss-Oriented Stressors</strong>
                            <span className="text-[11px] text-slate-405 mt-0.5 block leading-relaxed font-sans">
                              Crying, looking at photos, yearning, processing the pain of the absence, and directly feeling the grief.
                            </span>
                          </div>
                          <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-850/50">
                            <strong className="text-emerald-400 text-[10.5px] uppercase block tracking-wider">B) Restoration-Oriented Stressors</strong>
                            <span className="text-[11px] text-slate-405 mt-0.5 block leading-relaxed font-sans">
                              Distracting oneself, returning to work, socializing, or learning new life skills (e.g., managing finances).
                            </span>
                          </div>
                        </div>
                        <p className="text-[11.5px] text-slate-400 leading-relaxed pt-2 font-medium">
                          Science shows that humans need this natural oscillation. Spending 100% of the time in the loss state leads to clinical depression; spending 100% of the time in the restoration state (avoidance) leads to traumatic buildup. Healing happens in the swinging back and forth.
                        </p>

                        {/* Interactive Oscillation Trigger Link */}
                        <div className="pt-2 bg-slate-955 p-4 rounded-xl border border-emerald-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="text-left">
                            <span className="text-[8.5px] font-black uppercase tracking-widest text-[#10b981]">Neuroscience Workbook Link</span>
                            <span className="text-[10px] text-slate-300 font-extrabold block">Ready to practice conscious physical oscillation?</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowGriefGuide(false);
                              setActiveTab('somatic');
                              showToast("🔄 Switched to Somatic listening. Let's practice pendulation.", 'info');
                            }}
                            className="w-full sm:w-auto px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase text-[9.5px] tracking-wider rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5"
                          >
                            Launch Somatic Pendulation <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 border border-slate-850/80 p-5 rounded-2xl relative font-sans space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#a5b4fc]">2. Meaning Reconstruction (Robert Neimeyer)</h3>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          Dr. Robert Neimeyer’s research posits that grief is fundamentally a crisis of meaning. The scientific metric for recovery is not the cessation of sadness, but the ability to construct a new, coherent narrative. This involves making sense of the death and finding a way to carry the deceased’s legacy forward into the future (creating a continuing, internal bond rather than severing it).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Part III Section */}
                  <div className="space-y-4">
                    <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider font-sans border-b border-indigo-950/80 pb-1.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px]">III</span>
                      Part III: Scientifically Validated Methods for Coping & Integration
                    </h2>
                    
                    <p className="text-slate-300">
                      How do we actively facilitate this neurological and psychological integration? Clinical research validates several specific interventions.
                    </p>

                    <div className="space-y-5 ml-1 font-sans">
                      {/* CGT */}
                      <div className="p-4 bg-slate-900/20 border border-slate-850 rounded-xl space-y-2">
                        <h4 className="text-[12px] font-black text-slate-205 uppercase tracking-tight">1. Complicated Grief Treatment (CGT)</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Developed by Dr. M. Katherine Shear at Columbia University, CGT is a highly structured, evidence-based psychotherapy specifically designed for complicated grief. It incorporates:
                        </p>
                        <ul className="list-disc list-inside text-xs text-slate-400 pl-2 space-y-1">
                          <li><strong>Imaginal Exposure:</strong> Safely revisiting the story of the death to reduce the amygdala's traumatic panic response.</li>
                          <li><strong>Future Detailing:</strong> Actively visualizing a future that has purpose and joy, even in the absence of the deceased.</li>
                        </ul>
                      </div>

                      {/* Pennebaker Paradigm + Writing Workshop */}
                      <div className="p-4 md:p-6 bg-slate-950 border border-indigo-950/60 rounded-[2rem] space-y-4">
                        <div className="flex items-start gap-3 border-b border-slate-850 pb-3">
                          <PenTool className="text-indigo-400 w-5 h-5 shrink-0 mt-0.5" />
                          <div className="text-left">
                            <h4 className="text-[12px] font-black text-indigo-300 uppercase tracking-widest">2. The Pennebaker Expressive Writing Paradigm</h4>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                              Clinical Expressive Arts Therapy Integration
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          Dr. James Pennebaker's decades of research on expressive writing show that translating traumatic, chaotic emotions into structured written language has profound physiological benefits. 
                        </p>

                        <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 text-left space-y-1">
                          <span className="text-[9px] uppercase tracking-widest text-[#818cf8] font-extrabold block font-sans">The Pennebaker Formula:</span>
                          <span className="text-[11px] text-slate-300 font-medium block leading-relaxed font-sans">
                            ✍ Write continuously for <strong>15-20 minutes a day</strong> for four consecutive days about your deepest emotions regarding the loss.
                          </span>
                          <span className="text-[11px] text-slate-350 font-medium block leading-relaxed font-sans mt-1 text-slate-400">
                            🧠 <strong>The Science:</strong> Brain imaging shows this practice moves processing from hyperactive emotional centers (amygdala) to the prefrontal cortex, organizing the narrative, lowering cortisol levels, reducing blood pressure, and boosting immune function.
                          </span>
                        </div>

                        {/* WORKBOOK ACTIVE FORM */}
                        <div className="bg-slate-900/60 border border-slate-850/80 p-4.5 rounded-2xl space-y-4 text-left">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#818cf8] block pb-1 border-b border-slate-850">
                            Pennebaker Grief Writing Workshop Workbook
                          </span>

                          {writingActive ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center bg-slate-950 p-3 border border-slate-850 rounded-xl font-mono">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-black text-indigo-500 uppercase block">Active Writing Workshop</span>
                                  <span className="text-[10px] text-white font-extrabold flex items-center gap-1.5 uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    Emotional Discharge Session
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Remaining</span>
                                  <span className="text-sm font-black text-indigo-400">
                                    {Math.floor(writingTimeLeft / 60)}:{(writingTimeLeft % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850/60">
                                <motion.div 
                                  className="bg-indigo-500 h-full rounded-full"
                                  style={{ width: `${((writingTotalDuration - writingTimeLeft) / writingTotalDuration) * 100}%` }}
                                  transition={{ ease: "linear" }}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9.5px] font-black text-slate-550 uppercase block tracking-wider font-sans">
                                  Pour Your Stream Of Consciousness Below (No formatting, just pure memory and emotion)
                                </label>
                                <textarea
                                  value={writingText}
                                  onChange={(e) => setWritingText(e.target.value)}
                                  placeholder="Begin writing here... Do not hold back, let the words spill out of you. Do not edit, review or correct errors. Write about the loss, the memories, your deepest pains, the anger, or the love..."
                                  className="w-full min-h-[160px] bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-650 rounded-2xl p-4.5 text-xs text-slate-300 placeholder-slate-650 focus:outline-none transition-colors leading-relaxed font-sans scrollbar-none"
                                />
                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-medium">
                                  <span>{writingText.length} Characters typed</span>
                                  <span className="text-[#818cf8] font-semibold">Scientifically proven to cool amygdala trigger tracks.</span>
                                </div>
                              </div>

                              <div className="flex sm:flex-row flex-col gap-2.5">
                                <button
                                  type="button"
                                  onClick={handleCompleteWritingSession}
                                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer text-center shadow"
                                >
                                  Complete & Save Session Log
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const confirmCancel = window.confirm("Discard your current draft? Discarding is irreversible.");
                                    if (confirmCancel) {
                                      setWritingActive(false);
                                      setWritingText('');
                                    }
                                  }}
                                  className="py-3 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-205 text-[10.5px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer text-center"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3.5 text-center py-2">
                              <p className="text-[11px] text-slate-450 leading-relaxed font-medium max-w-sm mx-auto">
                                Run a simulated or real clinical writing cycle now. Choose a writing pace to release pressure from memory and bodily trauma stores.
                              </p>

                              <div className="flex items-center justify-center gap-3.5">
                                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">
                                  Duration:
                                </span>
                                <div className="flex items-center gap-2">
                                  {[2, 5, 10, 15].map(mins => (
                                    <button
                                      key={mins}
                                      type="button"
                                      onClick={() => {
                                        setWritingTotalDuration(mins * 60);
                                        setWritingTimeLeft(mins * 60);
                                        showToast(`⏱️ Expressive Writing session duration set to ${mins} minutes.`, 'info');
                                      }}
                                      className={`py-1.5 px-3 rounded-lg text-[10.5px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                                        Math.round(writingTotalDuration / 60) === mins
                                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                          : 'bg-slate-950 border-slate-850 text-slate-405 hover:text-white'
                                      }`}
                                    >
                                      {mins}m
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setWritingActive(true);
                                  showToast('📝 Expressive writing session initiated. Begin streaming your raw emotions.', 'success');
                                }}
                                className="w-full max-w-xs mx-auto py-3 bg-indigo-650/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-605 group-hover:bg-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs uppercase font-black tracking-widest transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow shadow-indigo-950/20"
                              >
                                Launch Healing Workspace <ArrowRight size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Somatic Experiencing */}
                      <div className="p-4 bg-slate-900/20 border border-slate-850 rounded-xl space-y-3">
                        <h4 className="text-[12px] font-black text-slate-205 uppercase tracking-tight">3. Somatic Regulation and Mindfulness</h4>
                        <p className="text-xs text-slate-405 leading-relaxed font-medium">
                          Because grief lives deeply in the body's autonomic nervous system, talk therapy alone is often not enough.
                        </p>
                        <ul className="list-disc list-inside text-xs text-slate-405 pl-2 space-y-1 font-medium space-y-1.5">
                          <li><strong>Mindfulness-Based Stress Reduction (MBSR):</strong> Helps grievers observe physical waves of panic story-free, training the nervous system that deep emotion is safe.</li>
                          <li><strong>Somatic Experiencing:</strong> Discharges the physical "freeze" or "flight" trauma energy trapped in tissues after deep bereavement.</li>
                        </ul>

                        <div className="pt-1.5 flex flex-col sm:flex-row gap-2.5">
                          <button
                            onClick={() => {
                              setShowGriefGuide(false);
                              setActiveTab('hrv');
                              showToast("🌊 Opened biofeedback chest harmonizer. Let's practice daily deep breathing.", 'info');
                            }}
                            className="bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white rounded-xl py-2.5 px-4 text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 transition-all text-center flex-1 cursor-pointer"
                          >
                            <Activity size={13} className="text-indigo-400" /> Start HRV Pacer
                          </button>
                          <button
                            onClick={() => {
                              setShowGriefGuide(false);
                              setActiveTab('breathing');
                              showToast("🌬️ Opened structured breath training. Calm your amygdala.", 'info');
                            }}
                            className="bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white rounded-xl py-2.5 px-4 text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 transition-all text-center flex-1 cursor-pointer"
                          >
                            <Wind size={13} className="text-teal-400" /> Open Guided Breathing
                          </button>
                        </div>
                      </div>

                      {/* Behavioral Activation */}
                      <div className="p-4 bg-slate-900/20 border border-slate-850 rounded-xl space-y-2">
                        <h4 className="text-[12px] font-black text-slate-205 uppercase tracking-tight">4. Behavioral Activation</h4>
                        <p className="text-xs text-slate-405 leading-relaxed font-medium">
                          A core component of Cognitive Behavioral Therapy (CBT), behavioral activation involves scheduling and forcing engagement in small, positive, routine activities (a walk, a coffee with a friend) even when motivation is at zero. Neurologically, this begins to drip-feed dopamine back into a depleted system, slowly proving to the brain that positive reinforcement still exists in the environment.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conclusion Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h2 className="text-sm md:text-base font-black text-rose-400 uppercase tracking-wider font-sans flex items-center gap-2">
                      ⭐ Conclusion: The Horizon of Acceptance
                    </h2>
                    
                    <p className="text-slate-200 font-medium leading-relaxed">
                      In scientific literature, "acceptance" does not mean being okay with the loss, nor does it mean the sadness completely vanishes.
                    </p>
                    <p className="text-slate-350 italic font-semibold pl-3 border-l-2 border-rose-500/30 leading-relaxed font-sans">
                      "Acceptance is a neurological achievement. It means the brain has successfully rewritten its internal map to reflect reality: acknowledging that the person is gone in physical space, while successfully relocating them to a permanent, safe space in one's internal emotional landscape. Healing is not moving on from the person; it is moving forward with them integrated into a new life."
                    </p>
                  </div>

                </div>

                <div className="flex justify-center pt-6 border-t border-slate-850">
                  <button
                    onClick={() => {
                      setShowGriefGuide(false);
                      setWritingActive(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="py-3 px-8 bg-slate-900 hover:bg-slate-850 text-slate-350 uppercase font-black text-[10.5px] tracking-widest border border-slate-850 rounded-xl transition-all cursor-pointer"
                  >
                    ← Exit Article
                  </button>
                </div>
              </div>
            ) : (
              /* ORIGINAL RECALIBRATION METHODS DASHBOARD + NEW SCIENTIFIC REPORT GATEWAY CARD */
              <>
                <div className="p-4 bg-indigo-500/5 text-indigo-400 rounded-3xl border border-indigo-500/10 flex items-start gap-3">
                  <Zap className="shrink-0 text-indigo-400 w-5 h-5 mt-1 animate-pulse" />
                  <div className="text-xs leading-relaxed text-left">
                    <span className="font-extrabold text-indigo-300 block uppercase tracking-wider mb-1">
                      How conscious attention rewires physiology
                    </span>
                    Understanding the mind-body connection is great, but applying it is where the real healing happens! The goal is simple: use your conscious attention to stimulate the vagus nerve, calm the amygdala, and shift your autonomic nervous system into <strong className="text-white">"rest, digest, and repair"</strong> mode.
                  </div>
                </div>

                {/* Main 2 columns with physical recalibration helpers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  
                  {/* Method 1 Card */}
                  <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 flex flex-col justify-between hover:border-slate-800 transition-all group">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#818cf8] border border-indigo-950 px-2 py-0.5 rounded-md bg-indigo-950/10">
                          Method 📲
                        </span>
                        <Activity className="text-indigo-400 group-hover:scale-110 transition-transform" size={18} />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">At-Home Biofeedback (HRV Training)</h3>
                        <p className="text-[11px] text-slate-405 leading-relaxed font-sans font-medium mt-1.5">
                          Measure a biological signal, watch it, and consciously relax to change that signal in real-time. High heart rate variability (HRV) signals a highly flexible, relaxed nervous system. Syncing breathing at about 5.5 to 6 breaths per minute aligns your blood cycle and vagal tone perfectly.
                        </p>
                      </div>

                      <div className="bg-slate-950/30 p-3 rounded-2xl border border-slate-850/50 space-y-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">The Rhythm:</span>
                        <span className="text-[10px] text-slate-300 font-mono font-medium leading-relaxed block">
                          👃 Inhale slowly through nose for <strong>5 seconds</strong>
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono font-medium leading-relaxed block">
                          👄 Exhale slowly through pursed lips for <strong>5 seconds</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('hrv')}
                      className="w-full mt-6 py-3.5 bg-indigo-650/15 group-hover:bg-indigo-600 group-hover:text-white border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Launch HRV Breathing Pacer <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Method 2 Card */}
                  <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 flex flex-col justify-between hover:border-slate-800 transition-all group">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-950 px-2 py-0.5 rounded-md bg-emerald-950/10">
                          Method 🧘‍♀️
                        </span>
                        <Brain className="text-emerald-400 group-hover:scale-110 transition-transform" size={18} />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Somatic Listening & Pendulation</h3>
                        <p className="text-[11px] text-slate-405 leading-relaxed font-sans font-medium mt-1.5">
                          Drop the "story" and communicate directly with raw sensory chemistry without resisting or judging. Resource complete safety in a neutral body spot first, approach the tension to categorize its Temperature, Weight, and Texture, and swing focus back and forth (Pendulation) to train your brain that symptoms aren't lethal threats.
                        </p>
                      </div>

                      <div className="bg-slate-950/30 p-3 rounded-2xl border border-[#slate-850]/50 space-y-1 border-slate-850/50">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Key Phases:</span>
                        <span className="text-[10px] text-slate-300 font-medium block">
                          1. Resource (Anchor) ➔ 2. Translate sense descriptors ➔ 3. Oscillate focus (Pendulation) ➔ 4. Integrate somatic release.
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('somatic')}
                      className="w-full mt-6 py-3.5 bg-emerald-650/15 group-hover:bg-emerald-650 hover:bg-emerald-600 group-hover:text-white border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Start Somatic Companion <ArrowRight size={13} />
                    </button>
                  </div>

                </div>

                {/* NEW INTEGRATION SECTION: CLINICAL SCIENCE REPORT GATEWAY */}
                <div className="bg-gradient-to-r from-indigo-950/30 to-slate border border-[#818cf8]/15 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-center hover:border-[#818cf8]/35 transition-all group relative overflow-hidden bg-slate-900/20 border-slate-850">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/[0.02] to-transparent pointer-events-none" />
                  <div className="space-y-2 max-w-xl text-left relative z-10">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-[#818cf8] border border-indigo-950 px-2 py-0.5 bg-indigo-950/20 rounded-md">
                      Special Evidence-Based Resource 🔬
                    </span>
                    <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight mt-1.5">
                      The Neuroscience and Psychology of Grief
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
                      Understand bereavement as a physical cognitive update model. Discover the science behind predictive coding relationship baselines, the amygdala threat axis, and clinical Pennebaker expressive writing protocols.
                    </p>
                    <div className="flex gap-4 items-center pt-1 text-[10px] text-slate-500 font-mono font-bold">
                      <span className="flex items-center gap-1.5"><BookOpen size={11} className="text-[#818cf8]" /> 12 Min Read</span>
                      <span className="flex items-center gap-1.5"><Heart size={11} className="text-rose-400" /> Interactive Workbook</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowGriefGuide(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="shrink-0 w-full md:w-auto py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all rounded-xl cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50"
                  >
                    Open Healing Pathways <ArrowRight size={13} />
                  </button>
                </div>

                {/* Consistency statement */}
                <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-[2rem] text-center max-w-md mx-auto">
                  <span className="text-[9.5px] font-bold uppercase text-slate-500 tracking-[0.15em] block font-sans">Consistency is Key</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-sans">
                    Taking just <strong>10 minutes a day</strong> to practice HRV breathing or somatic pendulation fundamentally rewires the neural pathways between your brain and your immune system.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* PANEL 2: HRV PACER */}
        {activeTab === 'hrv' && (
          <motion.div 
            key="hrv" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Active Running State */}
            {hrvActive ? (
              <div className="bg-slate-950/40 border border-slate-850 p-6 md:p-8 rounded-[2rem] space-y-8 relative overflow-hidden">
                <div className="flex justify-between items-center bg-slate-900/60 border border-slate-850/60 p-3.5 rounded-xl">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Active HRV Session</span>
                    <span className="text-xs text-indigo-400 font-extrabold font-mono uppercase tracking-wider mt-0.5 block flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      Lung Synchronizer Core Active
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Remaining</span>
                    <span className="text-base text-white font-black font-mono">
                      {Math.floor(hrvTimeLeft / 60)}:{(hrvTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-1.5 px-1 bg-slate-900/20 border border-slate-850/30 p-3.5 rounded-xl">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>Exercise Progress</span>
                    <span className="text-indigo-400 font-mono font-bold">
                      {Math.round(((hrvTotalDuration - hrvTimeLeft) / hrvTotalDuration) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850/60">
                    <motion.div 
                      className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, ((hrvTotalDuration - hrvTimeLeft) / hrvTotalDuration) * 100))}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>
                </div>

                {/* Breathing Expansion Orb Wrapper */}
                <div className="flex flex-col items-center justify-center py-6 relative">
                  {/* Glowing background halo */}
                  <motion.div 
                    animate={{ 
                      scale: breathPhase === 'inhale' ? 1.75 : 1.15,
                      opacity: breathPhase === 'inhale' ? 0.35 : 0.15 
                    }}
                    transition={{ duration: 5, ease: "easeInOut" }}
                    className="absolute w-44 h-44 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none"
                  />

                  {/* Pulsing Core Orb */}
                  <motion.div 
                    animate={{ 
                      scale: breathPhase === 'inhale' ? 1.45 : 0.95,
                    }}
                    transition={{ duration: 5, ease: "easeInOut" }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 flex flex-col items-center justify-center shadow-xl shadow-indigo-950/40 border-2 border-indigo-400/30 text-center relative z-10"
                  >
                    <Wind className="text-white animate-pulse" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 font-sans mt-1">
                      {breathPhase === 'inhale' ? 'Inhale 👃' : 'Exhale 👄'}
                    </span>
                    <span className="text-2xl font-black text-white font-mono mt-0.5">
                      {breathSeconds}s
                    </span>
                  </motion.div>

                  <p className="text-xs text-slate-300 font-extrabold tracking-wide text-center mt-8 max-w-xs font-sans">
                    {breathPhase === 'inhale' 
                      ? 'Breathe IN slowly and deeply through your nose.'
                      : 'Breathe OUT slowly through gently pursed lips.'}
                  </p>
                </div>

                {/* Simulated Heart Rate Graph Display */}
                <div className="bg-[#040810]/80 rounded-2xl border border-slate-850 p-4.5 space-y-2 relative">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={12} className="text-teal-400 animate-pulse" />
                      Simulated Heart Rate Frequency (Vagal Cycle)
                    </span>
                    <span className="text-[13px] text-teal-400 font-black font-mono">
                      {simulatedHR} <span className="text-[9px] text-slate-500">BPM</span>
                    </span>
                  </div>

                  <div className="h-[65px] relative">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="hrvGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={renderHrvPath()}
                        fill="none"
                        stroke="url(#hrvGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                  </div>
                  
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center mt-1">
                    Your goal is to transition jagged spikes into smooth, rolling waves.
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (window.confirm('Cancel this session? Progress will not be logged.')) {
                        setHrvActive(false);
                      }
                    }}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-850 text-slate-400 uppercase font-black text-[10px] tracking-widest border border-slate-850 rounded-2xl transition-all cursor-pointer text-center"
                  >
                    Abort
                  </button>
                  <button
                    onClick={handleCompleteHrvSession}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white uppercase font-black text-[10px] tracking-widest shadow-xl shadow-indigo-950/40 rounded-2xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={13} /> Complete & Save
                  </button>
                </div>
              </div>
            ) : (
              // Initial Setup Panel
              <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 space-y-6 text-center">
                <div className="max-w-md mx-auto space-y-2.5">
                  <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Waves className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Active Cardio-Respiratory Pacer</h3>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed font-sans font-medium">
                    This interactive pacer will guide your lung expansions to occur at exactly 6 breaths per minute. Allying your respiration frequency with blood cycle oscillations activates vagal feedback, instantly lowering inflammatory chemicals and panic responses. Focus on the screen waves.
                  </p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Choose Session Duration
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[2, 5, 10, 20].map(mins => (
                      <button
                        key={mins}
                        onClick={() => handleStartHrv(mins)}
                        className="py-3.5 bg-slate-950/60 border border-slate-850 text-slate-300 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-center"
                      >
                        {mins} Min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4.5 bg-slate-950/50 border border-slate-850 rounded-2xl max-w-sm mx-auto flex items-start gap-3 text-left text-[10.5px] font-sans font-medium text-slate-400">
                  <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Tip:</strong> Sit in a comfortable posture with spine straight. Rest the palms of hands on your knees to open the rib cage. Breathe deeply from the abdominal diaphragm.
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* PANEL: GUIDED BREATHING WITH CUSTOM TIMERS & PATTERNS */}
        {activeTab === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Show Mode Selector pills only if neither is actively running to prevent distraction and preserve immersion */}
            {!breathingActive && !writingActive && !breathingSessionComplete && (
              <div className="flex justify-center mb-2">
                <div className="bg-slate-950/80 border border-slate-850 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setBreathingMode('breath');
                      showToast('🌬️ Switched to Guided Breathing Pacer.', 'info');
                    }}
                    className={`px-5 py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      breathingMode === 'breath' 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                    }`}
                  >
                    <Wind size={13} className="animate-pulse" />
                    Respiratory Pacer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBreathingMode('writing');
                      showToast('✍ Switched to Pennebaker Expressive Writing.', 'info');
                    }}
                    className={`px-5 py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      breathingMode === 'writing' 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                    }`}
                  >
                    <PenTool size={13} />
                    Emotional Writing
                  </button>
                </div>
              </div>
            )}

            {breathingMode === 'breath' ? (
              <>
                {breathingSessionComplete ? (
              <div className="bg-slate-950/40 border border-slate-850 p-6 md:p-8 rounded-[2rem] space-y-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none" />
                
                {/* Visual Checkmark icon with breathing pulse waves */}
                <div className="flex flex-col items-center justify-center py-6 relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.25, 0.1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute w-36 h-36 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"
                  />
                  
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border border-emerald-450/40 flex items-center justify-center relative z-10 shadow-lg mb-4">
                    <CheckCircle2 className="text-emerald-400 w-12 h-12" />
                  </div>

                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    Session Complete!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed font-semibold">
                    Your nervous system has taken a deep, conscious breath. This exercise has been registered into your history.
                  </p>
                </div>

                {/* Session Summary facts */}
                {completedSessionDetails && (
                  <div className="bg-slate-900/60 border border-slate-850 p-4.5 rounded-2xl max-w-md mx-auto space-y-3.5 text-left">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#10b981] block border-b border-slate-850 pb-2">
			Active Log Summary
                    </span>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Duration</span>
                        <span className="text-white text-sm font-black font-mono mt-0.5 block">
                          {completedSessionDetails.duration} Minutes
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Cycles completed</span>
                        <span className="text-white text-sm font-black font-mono mt-0.5 block">
                          ~{completedSessionDetails.breaths} breaths
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Respiration Formula</span>
                        <span className="text-slate-200 text-xs font-bold uppercase tracking-wider mt-0.5 block">
                          {completedSessionDetails.preset === 'custom' ? 'Custom Formula' : completedSessionDetails.preset.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Status</span>
                        <span className="text-emerald-400 text-xs font-black uppercase tracking-wider mt-0.5 block flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Automatically Saved
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Focus Intention / Note</span>
                      <p className="text-slate-300 text-xs italic font-medium mt-0.5">
                        "{completedSessionDetails.note || 'No notes added.'}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Confirm actions */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
                  <button
                    onClick={() => setBreathingSessionComplete(false)}
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-350 uppercase font-black text-[10px] tracking-widest border border-slate-850 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Breathe Again Setup
                  </button>
                  <button
                    onClick={() => {
                      setBreathingSessionComplete(false);
                      setActiveTab('history');
                    }}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white uppercase font-black text-[10px] tracking-widest shadow-xl shadow-indigo-950/40 rounded-xl transition-all cursor-pointer text-center"
                  >
                    View Calming Logs
                  </button>
                </div>

              </div>
            ) : breathingActive ? (
              <div className="bg-slate-955 bg-slate-950/40 border border-slate-850 p-6 md:p-8 rounded-[2rem] space-y-8 relative overflow-hidden text-left">
                
                {/* Active Session Theme BG overlay */}
                {breathingTheme === 'ocean' && <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none" />}
                {breathingTheme === 'sunrise' && <div className="absolute inset-0 bg-orange-500/[0.02] pointer-events-none" />}
                {breathingTheme === 'nebula' && <div className="absolute inset-0 bg-purple-500/[0.02] pointer-events-none" />}
                {breathingTheme === 'forest' && <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />}

                <div className="flex justify-between items-center bg-slate-900/60 border border-slate-850/60 p-3.5 rounded-xl">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">Custom Guided Breath</span>
                    <span className={`text-xs font-extrabold font-mono uppercase tracking-wider mt-0.5 block flex items-center gap-1.5 ${
                      breathingTheme === 'ocean' ? 'text-indigo-400' :
                      breathingTheme === 'sunrise' ? 'text-orange-400' :
                      breathingTheme === 'nebula' ? 'text-purple-400' :
                      'text-emerald-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full animate-ping ${
                        breathingTheme === 'ocean' ? 'bg-indigo-500' :
                        breathingTheme === 'sunrise' ? 'bg-orange-500' :
                        breathingTheme === 'nebula' ? 'bg-purple-500' :
                        'bg-emerald-500'
                      }`} />
                      {selectedPreset === 'custom' ? 'Custom Formula Space' : `${selectedPreset.toUpperCase()} Preset`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Remaining</span>
                    <span className="text-base text-white font-black font-mono">
                      {Math.floor(breathingTimeLeft / 60)}:{(breathingTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Animated Breathing Circle stages */}
                <div className="flex flex-col items-center justify-center py-6 relative">
                  
                  {/* Outer Ripple circle effect */}
                  <motion.div
                    animate={{
                      scale: 
                        breathingPhase === 'inhale' ? [1.1, 1.8] : 
                        breathingPhase === 'holdIn' ? 1.8 : 
                        breathingPhase === 'exhale' ? [1.8, 1.1] : 
                        1.1,
                      opacity: 
                        breathingPhase === 'inhale' ? [0.15, 0.35] : 
                        breathingPhase === 'holdIn' ? 0.35 : 
                        breathingPhase === 'exhale' ? [0.35, 0.15] : 
                        0.1
                    }}
                    transition={{
                      duration: 
                        breathingPhase === 'inhale' ? customInhale : 
                        breathingPhase === 'holdIn' ? (customHoldIn || 1) : 
                        breathingPhase === 'exhale' ? customExhale : 
                        (customHoldOut || 1),
                      ease: "easeInOut"
                    }}
                    className={`absolute w-36 h-36 rounded-full blur-2xl pointer-events-none ${
                        breathingTheme === 'ocean' ? 'bg-indigo-500' :
                        breathingTheme === 'sunrise' ? 'bg-orange-500' :
                        breathingTheme === 'nebula' ? 'bg-purple-500' :
                        'bg-emerald-500'
                    }`}
                  />

                  {/* Inner breathing circle */}
                  <motion.div
                    animate={{
                      scale: 
                        breathingPhase === 'inhale' ? 1.6 : 
                        breathingPhase === 'holdIn' ? 1.6 : 
                        breathingPhase === 'exhale' ? 0.95 : 
                        0.95
                    }}
                    transition={{
                      duration: 
                        breathingPhase === 'inhale' ? customInhale : 
                        breathingPhase === 'holdIn' ? (customHoldIn || 1) : 
                        breathingPhase === 'exhale' ? customExhale : 
                        (customHoldOut || 1),
                      ease: "easeInOut"
                    }}
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl border-2 text-center relative z-10 ${
                      breathingTheme === 'ocean' ? 'bg-gradient-to-br from-indigo-500 to-teal-500 border-indigo-400/30' :
                      breathingTheme === 'sunrise' ? 'bg-gradient-to-br from-orange-500 to-amber-500 border-orange-400/30' :
                      breathingTheme === 'nebula' ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400/30' :
                      'bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-400/30'
                    }`}
                  >
                    <Wind className="text-white animate-pulse" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 font-sans mt-1">
                      {breathingPhase === 'inhale' ? 'Inhale 👃' : 
                       breathingPhase === 'holdIn' ? 'Hold In 🧘' : 
                       breathingPhase === 'exhale' ? 'Exhale 👄' : 
                       'Hold Out 🍃'}
                    </span>
                    <span className="text-3xl font-black text-white font-mono mt-0.5">
                      {breathingSeconds}s
                    </span>
                  </motion.div>

                  <div className="text-center mt-8 space-y-2 max-w-sm">
                    <span className="text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider block">
                      ☘️ Completed: <span className="text-white">{completedBreathsCount} full cycles</span>
                    </span>
                    <p className="text-xs text-slate-300 font-extrabold tracking-wide font-sans px-4">
                      {breathingPhase === 'inhale' && 'Inhale gently and slowly, expanding your lower diaphragm.'}
                      {breathingPhase === 'holdIn' && 'Softly suspend your breath, keeping heart and throat light.'}
                      {breathingPhase === 'exhale' && 'Let go with a soft, steady sigh through pursed lips.'}
                      {breathingPhase === 'holdOut' && 'Stay empty and calm in complete muscular stillness.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Cancel this breathing session? Progress won\'t be saved.')) {
                        setBreathingActive(false);
                      }
                    }}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-850 text-slate-400 uppercase font-black text-[10px] tracking-widest border border-slate-850 rounded-2xl transition-all cursor-pointer text-center"
                  >
                    Abort
                  </button>
                  <button
                    onClick={handleCompleteBreathingSession}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white uppercase font-black text-[10px] tracking-widest shadow-xl shadow-indigo-950/40 rounded-2xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={13} /> Log & Complete
                  </button>
                </div>
              </div>
            ) : (
              // Initial Setup view with custom modifiers
              <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 md:p-8 space-y-6 text-left">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Wind className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Guided Custom Breathing Setup
                    </h3>
                    <p className="text-[11.5px] text-slate-400 mt-1 max-w-xl font-sans font-medium">
                      Configure your ideal inhalation, hold, exhalation, and emptiness ratios to maximize HRV biofeedback. Slow breath holds stimulate your pineal system and the calming pathways of your body.
                    </p>
                  </div>
                  
                  {/* Sound Toggle and Theme */}
                  <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-850/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
                        soundEnabled ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      🔊 {soundEnabled ? 'Sound On' : 'Muted'}
                    </button>
                  </div>
                </div>

                {/* Respiration Presets selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">
                    Choose Respiration Formula Preset
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'coherence', label: 'Resonant Flow', desc: '5s In / 5s Out (HRV)' },
                      { id: 'box', label: 'Box Breath', desc: '4s In/Hold/Out/Hold' },
                      { id: 'calm', label: 'Calm 4-7-8', desc: 'Sleep & Panic Stop' },
                      { id: 'custom', label: 'Custom Spec ⚙️', desc: 'Build Your Own' }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedPreset === preset.id
                            ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg'
                            : 'bg-slate-950/40 border-slate-850/60 hover:border-slate-750 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider block">{preset.label}</span>
                        <span className="text-[9px] text-slate-500 font-medium block mt-0.5 leading-tight">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliding ratio regulators for Custom profile */}
                <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-850/60 gap-4 grid grid-cols-1 md:grid-cols-2">
                  {/* Inhale */}
                  <div className={`space-y-1.5 ${selectedPreset !== 'custom' ? 'opacity-40' : ''}`}>
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-400">Inhale Duration</span>
                      <span className="text-indigo-400">{customInhale}s</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={customInhale}
                      disabled={selectedPreset !== 'custom'}
                      onChange={(e) => setCustomInhale(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Hold in */}
                  <div className={`space-y-1.5 ${selectedPreset !== 'custom' ? 'opacity-40' : ''}`}>
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-400">Hold After Inhale</span>
                      <span className="text-purple-400">{customHoldIn}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={customHoldIn}
                      disabled={selectedPreset !== 'custom'}
                      onChange={(e) => setCustomHoldIn(parseInt(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Exhale */}
                  <div className={`space-y-1.5 ${selectedPreset !== 'custom' ? 'opacity-40' : ''}`}>
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-400">Exhale Duration</span>
                      <span className="text-emerald-400">{customExhale}s</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={customExhale}
                      disabled={selectedPreset !== 'custom'}
                      onChange={(e) => setCustomExhale(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Hold out */}
                  <div className={`space-y-1.5 ${selectedPreset !== 'custom' ? 'opacity-40' : ''}`}>
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-400">Hold After Exhale</span>
                      <span className="text-amber-400">{customHoldOut}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={customHoldOut}
                      disabled={selectedPreset !== 'custom'}
                      onChange={(e) => setCustomHoldOut(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Duration select & Visual theme picker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Session Duration */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-440 tracking-wider block">
                      Choose Session Length (Minutes)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 5, 10, 15].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setBreathingMinsInput(m)}
                          className={`py-2 rounded-lg text-[10.5px] font-black uppercase tracking-wider text-center transition-all border cursor-pointer ${
                            breathingMinsInput === m
                              ? 'bg-indigo-650/15 border-indigo-500 text-indigo-400 shadow'
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Theme Selector */}
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-440 tracking-wider block">
                      Select Breath Aura Visual Theme
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'ocean', label: 'Ocean Teal', bg: 'bg-gradient-to-r from-indigo-500 to-teal-500' },
                        { id: 'sunrise', label: 'Sunrise', bg: 'bg-gradient-to-r from-orange-400 to-amber-500' },
                        { id: 'nebula', label: 'Purp Nebula', bg: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                        { id: 'forest', label: 'Deep Forest', bg: 'bg-gradient-to-r from-emerald-500 to-teal-600' }
                      ].map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setBreathingTheme(theme.id as any)}
                          className={`p-1.5 rounded-lg border text-[8.5px] font-extrabold uppercase tracking-wide cursor-pointer transition-all ${
                            breathingTheme === theme.id
                              ? 'border-indigo-500 text-white'
                              : 'border-slate-850 hover:border-slate-750 text-slate-400'
                          }`}
                        >
                          <div className={`h-2 w-full rounded-sm mb-1 ${theme.bg}`} />
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Session Journal Note (Optional) */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-440 tracking-wider block">
                    Focus Intention or Symptom Note (recorded with session logs)
                  </label>
                  <input
                    type="text"
                    value={breathingNote}
                    onChange={(e) => setBreathingNote(e.target.value)}
                    placeholder="e.g. Setting safe intentions / Relieving chest tightness..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Launch Button */}
                <button
                  type="button"
                  onClick={handleStartBreathing}
                  className={`w-full py-4 text-white hover:opacity-90 transition-all font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                    breathingTheme === 'ocean' ? 'bg-gradient-to-r from-indigo-600 to-teal-600' :
                    breathingTheme === 'sunrise' ? 'bg-gradient-to-r from-orange-600 to-amber-600' :
                    breathingTheme === 'nebula' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                    'bg-gradient-to-r from-emerald-600 to-teal-700'
                  }`}
                >
                  <Wind size={14} className="animate-pulse" /> Launch Custom Guided Breathing ({breathingMinsInput} min)
                </button>

              </div>
            )}
              </>
            ) : (
              /* PENNEBAKER EXPRESSIVE WRITING WORKSPACE */
              <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 md:p-8 space-y-6 text-left relative overflow-hidden">
                {/* Protocol Progress Header */}
                <div className="border-b border-slate-850/60 pb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-base font-black text-rose-400 uppercase tracking-tight flex items-center gap-2">
                        <PenTool className="text-rose-400 animate-pulse w-5 h-5" />
                        Pennebaker 4-Day Expressive Writing Protocol
                      </h3>
                      <p className="text-[11.5px] text-slate-400 mt-1 max-w-xl font-sans font-medium leading-relaxed">
                        Dr. James Pennebaker's clinically proven program. Writing continuously about deep traumatic memories organizes raw, chaotic cerebral images into structured, manageable narratives in your prefrontal cortex, enhancing immunological and autonomic tone.
                      </p>
                    </div>
                    {/* Active Streak or completed days count can be represented here */}
                    <div className="bg-slate-950/60 border border-slate-850 px-3.5 py-2.5 rounded-xl text-right font-mono self-start md:self-auto">
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Current Day State</span>
                      <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        Day {pennebakerDay} of 4
                      </span>
                    </div>
                  </div>

                  {/* Day Navigation Line */}
                  <div className="mt-6 grid grid-cols-4 gap-2 md:gap-4 select-none">
                    {[1, 2, 3, 4].map(day => {
                      const dayNames = ["Facts & Feelings", "Deep Emotions", "Cognitive Mapping", "Outlook & Legacy"];
                      const isActive = pennebakerDay === day;
                      const isPast = pennebakerDay > day;
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            setPennebakerDay(day);
                            localStorage.setItem('pennebaker_day', day.toString());
                            showToast(`Selected Pennebaker Protocol Day ${day}.`, 'info');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                            isActive 
                              ? 'bg-rose-500/10 border-rose-500 shadow shadow-rose-950/20' 
                              : isPast 
                              ? 'bg-slate-950/20 border-slate-800 text-slate-500' 
                              : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-rose-400' : isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                              Day {day}
                            </span>
                            {isPast && <span className="text-[8px] font-black text-rose-500/80 uppercase">★ Done</span>}
                          </div>
                          <span className={`text-[10px] md:text-[11px] font-bold block mt-1 uppercase truncate tracking-tight ${isActive ? 'text-white' : 'text-slate-400'}`}>
                            {dayNames[day - 1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instructions for current Day */}
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850/70 space-y-3.5">
                  <div className="flex justify-between items-center border-b border-slate-850/50 pb-2">
                    <span className="text-[9.5px] font-black text-rose-400 uppercase tracking-widest font-mono">
                      {pennebakerDay === 1 && "📋 Focus: The Objective Event & Raw Sensory Imprints"}
                      {pennebakerDay === 2 && "❤️ Focus: The Vulnerability, Older Triggers & Inner Voice"}
                      {pennebakerDay === 3 && "🧠 Focus: Connecting Self-Identity & Modern Mind Rebuilding"}
                      {pennebakerDay === 4 && "🌟 Focus: Meaning Reconstruction, Continuing Bonds & Future Legacy"}
                    </span>
                    <span className="text-[8.5px] font-black text-slate-500 uppercase font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md">
                      Protocol Guide
                    </span>
                  </div>

                  <p className="text-[11.5px] leading-relaxed text-slate-300 font-sans font-medium">
                    {pennebakerDay === 1 && "For today's focus, reconstruct the event objectively, almost like a journalist detailing facts. Chronologically trace the event, who was there, and what was said. Interweave this factual narrative with the raw sensory details and direct immediate emotions that flooded your body during and right after."}
                    {pennebakerDay === 2 && "Today, bypass facts and drop deep into the body's internal emotional response. Write about how this loss or wound affects your self-esteem, relationships, and deepest sense of security. Connect the raw sensations in your body to older fears, habits, or patterns running through your life."}
                    {pennebakerDay === 3 && "Begin to actively synthesize this experience into your personal history. Connect who you were before the event, who you are now in its shadow, and who you want to build yourself to be. Explore what parts of your prior beliefs have crumbled, and what positive values are starting to take their place."}
                    {pennebakerDay === 4 && "Explore your continuing internal bond and find resolution. Rather than 'moving on' from the past, explore how you carry this story or relationship inside your emotional core as you step forward. Write about your lasting legacy, what lessons you want to honor, and your values for future growth."}
                  </p>

                  <div className="text-[10.5px] bg-[#1a161b]/30 p-3 rounded-lg border border-rose-500/10 text-rose-300/90 leading-relaxed font-sans font-medium flex gap-2.5">
                    <Zap size={14} className="shrink-0 text-rose-400 mt-0.5 animate-pulse" />
                    <div>
                      <strong className="text-rose-200">The Ground Rules:</strong> Write absolutely continuously for the entire duration. If you run out of things to say, write about what you are feeling in the moment, but keep your hands moving. Do not check spelling, grammar, or edit any words. This is for you alone.
                    </div>
                  </div>
                </div>

                {/* Timer configuration if not active */}
                {!writingActive ? (
                  <div className="space-y-4 pt-2">
                    <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Choose daily session length</span>
                        <div className="text-[11px] font-sans font-medium text-slate-400">
                          Recommended: <strong className="text-white">15-20 minutes</strong> for deep therapeutic benefit.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {[
                          { id: 900, label: "15 Min", desc: "Standard" },
                          { id: 1200, label: "20 Min", desc: "Extended" },
                          { id: 120, label: "2 Min", desc: "Trial / Test" },
                          { id: 300, label: "5 Min", desc: "Compact" }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setWritingTotalDuration(opt.id);
                              setWritingTimeLeft(opt.id);
                              showToast(`⏱️ Daily writing session duration set to ${opt.id / 60} minutes.`, 'info');
                            }}
                            className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                              writingTotalDuration === opt.id 
                                ? 'bg-rose-500/10 border-rose-500 text-rose-405 font-black shadow-sm' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                            }`}
                          >
                            <span className="text-xs font-mono block">{opt.label}</span>
                            <span className="text-[8px] text-slate-500 block uppercase font-bold mt-0.5">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWritingActive(true);
                        showToast(`📝 Timer active. Starting Pennebaker Day ${pennebakerDay} Expressive Writing.`, 'success');
                      }}
                      className="w-full py-4 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PenTool size={14} className="animate-pulse" />
                      Begin Day {pennebakerDay} Expressive Writing ({writingTotalDuration / 60}m)
                    </button>
                  </div>
                ) : (
                  /* ACTIVE WRITING SCREEN */
                  <div className="space-y-5">
                    {/* Active Header card */}
                    <div className="flex justify-between items-center bg-slate-950 border border-slate-850 p-4.5 rounded-2xl">
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider block">Pennebaker Expressive Writing Workshop</span>
                        <span className="text-[11px] text-white font-black flex items-center gap-1.5 uppercase font-sans">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Protocol Day {pennebakerDay} In Progress
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[9px] text-slate-500 uppercase block font-sans font-bold">Time remaining</span>
                        <span className="text-sm md:text-base font-black text-rose-400 font-mono">
                          {Math.floor(writingTimeLeft / 60)}:{(writingTimeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <motion.div 
                        className="bg-rose-500 h-full rounded-full animate-pulse"
                        style={{ width: `${((writingTotalDuration - writingTimeLeft) / writingTotalDuration) * 100}%` }}
                        transition={{ ease: "linear" }}
                      />
                    </div>

                    {/* Prompts ticker overlay when active */}
                    <div className="bg-[#1c1214]/60 p-3.5 rounded-xl border border-rose-500/10 text-[11px] leading-relaxed text-slate-350 text-left">
                      <strong className="text-rose-400">Continuous Prompt Reminder:</strong>{" "}
                      {pennebakerDay === 1 && "Chronology, names, facts, physical actions, immediate emotional reactions, raw sensory imprints."}
                      {pennebakerDay === 2 && "Vulnerability, inner feelings, older triggers, impact on relationships, self-esteem, deep psychological impacts."}
                      {pennebakerDay === 3 && "Past vs. present, what values crumbled, what surviving beliefs are emerging, who you want to build yourself to be."}
                      {pennebakerDay === 4 && "Legacy, continuing bonds, carrying their memory safely, finding growth or direction for the future path."}
                    </div>

                    {/* Interactive Text area space */}
                    <div className="space-y-1.5 text-left">
                      <textarea
                        value={writingText}
                        onChange={(e) => setWritingText(e.target.value)}
                        placeholder="Stream your consciousness... Let your thoughts spill out continuously. Don't stop to correct errors, worry about spelling, or judge what you write. Let the narrative flow..."
                        className="w-full min-h-[220px] bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-rose-500/80 rounded-[2rem] p-5 text-xs text-slate-200 placeholder-slate-605 focus:outline-none transition-colors leading-relaxed font-sans scrollbar-none"
                      />
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-medium">
                        <span>{writingText.length} Characters typed</span>
                        <span className="text-rose-400 flex items-center gap-1">
                          <Brain size={11} className="text-rose-400 animate-spin" />
                          Prefrontal cortex integration active.
                        </span>
                      </div>
                    </div>

                    {/* Complete & Cancel Actions */}
                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <button
                        type="button"
                        onClick={handleCompleteWritingSession}
                        className="py-4 bg-rose-600 hover:bg-rose-500 text-white text-[11px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={13} /> Complete & Save Session Log
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const conf = window.confirm("Aborting this session will discard your current writing. Are you sure you want to stop?");
                          if (conf) {
                            setWritingActive(false);
                            setWritingText('');
                            setWritingTimeLeft(writingTotalDuration);
                          }
                        }}
                        className="py-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white text-[11px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Discard Draft
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* PANEL 3: SOMATIC LISTENING */}
        {activeTab === 'somatic' && (
          <motion.div 
            key="somatic" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Step Wizard Container */}
            <div className="bg-slate-950/40 border border-slate-850 p-6 md:p-8 rounded-[2.5rem] space-y-6">
              
              {/* Wizard Steps Header */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-4.5">
                <div>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-[#10b981] block">Somatic Companion Wizard</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mt-0.5">
                    Step {somaticStep} of 5: {
                      somaticStep === 1 ? 'Resourcing (Deep Anchor Target)' :
                      somaticStep === 2 ? 'Approach & Translate the Felt Sense' :
                      somaticStep === 3 ? 'Active Pendulation Oscillation' :
                      somaticStep === 4 ? 'Integrated Release phenomenon' :
                      'Log & Affirm Calm Session'
                    }
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono font-black">{somaticStep}/5</span>
              </div>

              {/* STEP 1: RESOURCING */}
              {somaticStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                    First, find a physical location or dynamic in your body that feels completely neutral, pleasant, or secure (for example: your earlobe, your heel, the tip of your elbow, or where the chair supports your back). We call this your <strong className="text-white">"Safe Anchor Spot"</strong>.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-[10.5px] font-black uppercase text-slate-450 tracking-wider block">
                      Name or Describe Your Local Safe Spot Anchor
                    </label>
                    <input
                      type="text"
                      value={safeSpot}
                      onChange={(e) => setSafeSpot(e.target.value)}
                      placeholder="e.g. My right earlobe, my breath at the nosetips, the touch point of my lower back..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-semibold text-white focus:border-indigo-500 outline-none transition-all placeholder-flat"
                    />
                  </div>

                  <div className="bg-slate-900/40 border border-slate-850/60 p-4 rounded-2xl text-[10.5px] font-sans font-medium text-slate-400">
                    💡 Spend 30 seconds focusing exclusively on this neutral area. Recognize that safe, steady energy already exists within your cellular landscape even during emotional spikes.
                  </div>

                  <button
                    disabled={!safeSpot.trim()}
                    onClick={() => setSomaticStep(2)}
                    className="w-full py-4 bg-[#10b981] hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xl shadow-emerald-950/20 disabled:opacity-50"
                  >
                    I have my safe anchor spot <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STEP 2: APPROACH & TRANSLATE */}
              {somaticStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                    Now, let's gently approach the distressing symptom (such as localized anxiety weight, stomach tension, or headache pressure). Drop any narrative of "why this hurts". Avoid analyzing the cause. Instead, treat it like an objective biological specimen. Categorize its raw, physical, direct <strong className="text-white">"Felt Sense"</strong>:
                  </p>

                  <div className="space-y-4">
                    {/* Temperature Row */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">1. Sensation Temperature</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['Hot', 'Cold', 'Neutral'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSomaticTemp(t as any)}
                            className={`py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border cursor-pointer text-center ${
                              somaticTemp === t 
                                ? 'bg-indigo-650/15 border-indigo-500/40 text-indigo-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Weight Row */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">2. Sensation Density Weight</span>
                      <div className="grid grid-cols-4 gap-2">
                        {['Heavy', 'Light', 'Throbbing', 'Dense'].map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setSomaticWeight(w as any)}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer text-center ${
                              somaticWeight === w 
                                ? 'bg-indigo-650/15 border-indigo-500/40 text-indigo-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Texture Row */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">3. Sensation Texture</span>
                      <div className="grid grid-cols-4 gap-2">
                        {['Sharp', 'Dull', 'Fuzzy', 'Tingly'].map(tx => (
                          <button
                            key={tx}
                            type="button"
                            onClick={() => setSomaticTexture(tx as any)}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer text-center ${
                              somaticTexture === tx 
                                ? 'bg-indigo-650/15 border-indigo-500/40 text-indigo-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                            }`}
                          >
                            {tx}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Freeform description */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">4. Dynamic details (Optional)</span>
                      <input
                        type="text"
                        value={sensationDesc}
                        onChange={(e) => setSensationDesc(e.target.value)}
                        placeholder="e.g. A dense, hot pressure behind my eyes that stays static"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-semibold text-white focus:border-indigo-500 outline-none transition-all placeholder-flat"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSomaticStep(1)}
                      className="px-5 py-4 bg-slate-900 border border-slate-850 text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider rounded-2xl hover:text-white cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      disabled={!somaticTemp || !somaticWeight || !somaticTexture}
                      onClick={() => setSomaticStep(3)}
                      className="flex-1 py-4 bg-[#10b981] disabled:opacity-40 hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xl shadow-emerald-950/20"
                    >
                      Sensation translated <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PENDULATION ACTIVITY */}
              {somaticStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                    Now we will practice <strong className="text-white">Pendulation</strong> (oscillation). We will swing our focus back and forth between your safe anchor area and the local distress focus. This rhythmic oscillation trains your central nervous system that distress is an local focus that is transient, and NOT a lethal threat to survival.
                  </p>

                  <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex flex-col items-center text-center space-y-5 relative">
                    {/* Visual anchor dots with swinging connection */}
                    <div className="flex items-center justify-between w-full max-w-xs relative py-4">
                      {/* Swing path line */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
                      
                      {/* Active swing indicator orb */}
                      <motion.div 
                        animate={{ 
                          left: pendulationPhase === 'safe' ? '0%' : '100%',
                          x: pendulationPhase === 'safe' ? 12 : -12
                        }}
                        transition={{ duration: 15, ease: "easeInOut" }}
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-400 rounded-full shadow-lg shadow-amber-900/30 border border-amber-300 z-10"
                      />

                      {/* Left Dot: Safe */}
                      <div className={`relative z-20 p-2 rounded-full border transition-all ${
                        pendulationPhase === 'safe' 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 scale-110' 
                          : 'bg-slate-950 border-slate-850 text-slate-500'
                      }`}>
                        <ShieldCheck size={20} />
                      </div>

                      {/* Middle Cycles count */}
                      <div className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-md text-[8.5px] font-mono text-slate-400 uppercase font-black z-20">
                        {pendulationCycles} Swings
                      </div>

                      {/* Right Dot: Sensation */}
                      <div className={`relative z-20 p-2 rounded-full border transition-all ${
                        pendulationPhase === 'symptom' 
                          ? 'bg-rose-500/10 border-rose-500 text-rose-500 scale-110' 
                          : 'bg-slate-950 border-slate-850 text-slate-500'
                      }`}>
                        <Brain size={20} />
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Current focus target</span>
                      <h4 className={`text-base font-extrabold tracking-tight uppercase ${
                        pendulationPhase === 'safe' ? 'text-emerald-400' : 'text-rose-450 text-rose-400'
                      }`}>
                        {pendulationPhase === 'safe' 
                          ? `⚓ Safe Spot focus: ${safeSpot}`
                          : `⚡ Sensation focus: ${somaticTemp} ${somaticWeight} (${somaticTexture})`}
                      </h4>
                      <p className="text-[10.5px] text-slate-400 font-mono italic">
                        Swings automatically in {pendulationSeconds} seconds...
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPendulationActive(!pendulationActive)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer border ${
                        pendulationActive 
                          ? 'bg-rose-650/20 border-rose-500/20 text-rose-400' 
                          : 'bg-indigo-600 border-indigo-500/20 text-white'
                      }`}
                    >
                      {pendulationActive ? (
                        <>
                          <Pause size={12} /> Pause Auto-Swing pacer
                        </>
                      ) : (
                        <>
                          <Play size={12} /> Start Bio-Swing rhythm (15s cycles)
                        </>
                      )}
                    </button>

                    {/* Configurable Session Duration Picker */}
                    <div className="w-full max-w-sm space-y-2 mt-4 bg-slate-950/45 p-3.5 border border-slate-850/60 rounded-xl text-left">
                      <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block text-center">
                        Select Pendulation Session Length
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 5, 10, 20].map((mins) => {
                          const isActive = Math.round(somaticDuration / 60) === mins;
                          return (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => handleSetSomaticDuration(mins)}
                              className={`py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider text-center transition-all border cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-650/15 border-emerald-500 text-emerald-400 shadow'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-750'
                              }`}
                            >
                              {mins}m
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="w-full max-w-sm space-y-1.5 px-1 bg-slate-950/20 border border-slate-850/30 p-3.5 rounded-xl text-left">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <span>Exercise Progress</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {Math.round(((somaticDuration - somaticTimeLeft) / somaticDuration) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850/60">
                        <motion.div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, ((somaticDuration - somaticTimeLeft) / somaticDuration) * 100))}%` }}
                          transition={{ ease: "linear" }}
                        />
                      </div>
                      <div className="text-right text-[10px] font-extrabold text-slate-400 tracking-wide font-mono mt-1">
                        {Math.floor(somaticTimeLeft / 60)}:{(somaticTimeLeft % 60).toString().padStart(2, '0')} Remaining
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setPendulationActive(false);
                        setSomaticStep(2);
                      }}
                      className="px-5 py-4 bg-slate-900 border border-slate-850 text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider rounded-2xl hover:text-white cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        setPendulationActive(false);
                        setSomaticStep(4);
                      }}
                      className="flex-1 py-4 bg-[#10b981] hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xl shadow-emerald-950/20"
                    >
                      Completed Swings <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: ALLOW DISCHARGE */}
              {somaticStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                    As you alternate and observe without fear, your amygdala receives neurological safety feedback. The body starts discharging trapped adrenal tension. Tap any of the biological <strong className="text-white">discharge release signals</strong> you localy felt inside raw tissue during or right after pendulation:
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'yawn', label: 'Spontaneous Yawn 🥱' },
                      { id: 'deep_breath', label: 'Deep Involuntary Sigh 🌬️' },
                      { id: 'temp_shift', label: 'Dynamic Temp Shift 🌡️' },
                      { id: 'shiver', label: 'Muscular Shiver/Release 📳' },
                      { id: 'tummy_gurgle', label: 'Tummy Gurgle (Rest&Digest) 🌀' },
                      { id: 'tears', label: 'Soft Lacrimation (Tears) 💧' }
                    ].map(d => {
                      const isSelected = dischargeTypes.includes(d.label);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDischarge(d.label)}
                          className={`p-3.5 border rounded-2xl h-16 flex items-center justify-center text-center text-[10.5px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-650/15 border-emerald-500/40 text-emerald-400 shadow-inner' 
                              : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSomaticStep(3)}
                      className="px-5 py-4 bg-slate-900 border border-slate-850 text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider rounded-2xl hover:text-white cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setSomaticStep(5)}
                      className="flex-1 py-4 bg-[#10b981] hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xl shadow-emerald-950/20"
                    >
                      Review Summary <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW SUMMARY & COMPLETE */}
              {somaticStep === 5 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-850 pb-2">
                      Recalibration Summary Details
                    </h4>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[9px] font-black uppercase block text-slate-550 tracking-wider">Anchor Safety resource:</span>
                        <span className="text-white font-bold block mt-0.5">{safeSpot}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase block text-slate-550 tracking-wider">Translational Sensation:</span>
                        <span className="text-white font-bold block mt-0.5">
                          {somaticTemp} • {somaticWeight} • {somaticTexture}
                        </span>
                      </div>
                    </div>
                    {sensationDesc && (
                      <div className="text-xs">
                        <span className="text-[9px] font-black uppercase block text-slate-550 tracking-wider">Dynamic observation detail:</span>
                        <span className="text-white font-medium block mt-0.5">{sensationDesc}</span>
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="text-[9px] font-black uppercase block text-slate-550 tracking-wider">My physiological release discharge factors:</span>
                      <span className="text-teal-400 font-extrabold block mt-0.5">
                        {dischargeTypes.join(', ') || 'No physical releases logged yet.'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-400 italic block font-sans text-center max-w-sm mx-auto leading-relaxed">
                    By naming the chemistry and shifting consciousness focal points, you successfully demonstrated self-soothing agency to your brain stem. Excellent job.
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSomaticStep(4)}
                      className="px-5 py-4 bg-slate-900 border border-slate-850 text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider rounded-2xl hover:text-white cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      disabled={isSaving}
                      onClick={handleSaveSomaticWalkthrough}
                      className="flex-1 py-4 bg-indigo-650 hover:bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xl shadow-indigo-950/20 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" /> Committing Journal...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> Complete & Register Journal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* PANEL 4: 5-4-3-2-1 GROUNDING */}
        {activeTab === 'grounding' && (
          <motion.div 
            key="grounding" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/40 border border-slate-850 rounded-[2rem] p-6 text-center space-y-6">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-11 h-11 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                  <Wind className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">5-4-3-2-1 Grounding Sequence</h3>
                <p className="text-[11.5px] text-slate-400 leading-relaxed font-sans font-medium">
                  When sensory escalation or cravings overwhelm abstract logic, anchor back into the absolute physical present using your five primary cognitive senses.
                </p>
              </div>

              <div className="flex flex-col items-center text-center py-6 bg-slate-950/60 p-6 rounded-3xl border border-slate-850 max-w-sm mx-auto relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={groundingStep}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <div className="p-6 bg-slate-900 rounded-full border border-slate-800 shadow-md">
                      {groundingSteps[groundingStep].icon}
                    </div>
                    
                    <div className="space-y-1.5 px-3">
                      <h4 className="text-base font-extrabold text-white tracking-tight uppercase leading-tight font-sans">
                        {groundingSteps[groundingStep].label}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium max-w-xs">
                        {groundingSteps[groundingStep].desc}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-8 max-w-xs">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300" 
                    style={{ width: `${((groundingStep + 1) / 5) * 100}%` }} 
                  />
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 font-mono">
                  Stage {groundingStep + 1} of 5
                </div>
              </div>

              <button 
                onClick={() => setGroundingStep((prev) => (prev + 1) % 5)}
                className="w-full max-w-sm mx-auto py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-lg shadow-indigo-950/30 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                {groundingStep === 4 ? "Restart Exercise" : "Next Sense Focus"} <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* PANEL 5: HISTORY & CALMING LOGS */}
        {activeTab === 'history' && (
          <motion.div 
            key="history" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                Calming Exercise Ledger
              </h3>
              <button 
                onClick={fetchSomaticLogs}
                className="p-1 px-2.5 bg-slate-950 rounded-lg border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1"
              >
                <RefreshCw size={10} /> Reload
              </button>
            </div>

            {isLoadingLogs ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2 font-mono text-xs">
                <RefreshCw size={24} className="animate-spin text-indigo-400 mb-2" />
                Querying calming record datatables...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-slate-850 rounded-[2.5rem] text-slate-500">
                <Brain className="w-10 h-10 mx-auto text-slate-705 text-slate-700 mb-3" />
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">No calm history logged yet</div>
                <div className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Start your daily vagus recalibration by practicing Method 1 (HRV Breathing) or Method 2 (Somatic Listening Walkthrough)!
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="bg-slate-900/40 border border-slate-850/80 p-5 rounded-2xl relative flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-slate-800 transition-all">
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.type === 'hrv' ? (
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-mono font-black uppercase tracking-wider rounded border border-indigo-400/20">
                            HRV Breathing ({log.durationMinutes} Min)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-black uppercase tracking-wider rounded border border-emerald-405 border-emerald-400/20">
                            Somatic listening
                          </span>
                        )}
                        
                        <span className="text-[9.5px] text-slate-500 font-mono flex items-center gap-1 font-semibold ml-1">
                          <Calendar size={11} className="text-slate-600" />
                          {new Date(log.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {log.type === 'somatic' ? (
                        <div className="space-y-1">
                          <div className="text-[11.5px] leading-relaxed text-slate-300 font-medium">
                            ⚓ Safety Resource: <strong className="text-white">{log.safeSpot}</strong>
                          </div>
                          <div className="text-[10px] text-slate-450 text-slate-400 flex items-center gap-2 flex-wrap font-sans">
                            <span>Sensation: <strong className="text-slate-300">{log.temperature} • {log.weight} • {log.texture}</strong></span>
                            {log.dischargeSymptom && (
                              <span className="before:content-['•'] before:mr-1 text-teal-400">
                                Discharge: <strong>{log.dischargeSymptom}</strong>
                              </span>
                            )}
                          </div>
                          {log.sensationDescription && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">"{log.sensationDescription}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-350">
                          Completed slow 5s-in/5s-out vagus nerve stimulation breathing session.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-2 text-slate-600 hover:text-rose-450 hover:bg-rose-500/10 rounded-xl transition-all self-end md:self-center cursor-pointer border border-transparent hover:border-rose-950/20"
                      title="Remove record"
                    >
                      <Trash2 size={13} />
                    </button>
                    
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
