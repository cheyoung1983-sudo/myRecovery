
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, ChevronDown, ChevronUp, RefreshCw, Share2, Facebook, Twitter } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { MoodEntry } from '../types';

interface AISupportViewProps {
  currentUser: FirebaseUser | null;
  moodLogs: MoodEntry[];
  streak: number;
}

export const AISupportView: React.FC<AISupportViewProps> = ({ currentUser, moodLogs, streak }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hello! I'm your myRecovery Guide. How's your journey going today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);
  const [anxietyDetected, setAnxietyDetected] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [isHighThinkingMode, setIsHighThinkingMode] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<number, boolean>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateWeeklyReflection = async () => {
    if (moodLogs.length === 0) {
      setMessages(prev => [...prev, { role: 'model', text: "I don't have enough mood logs yet to generate a reflection. Why not log how you're feeling first?" }]);
      return;
    }

    setIsGeneratingReflection(true);
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodLogs: moodLogs.slice(0, 10) })
      });
      const data = await res.json();
      if (data.reflection) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `📊 **Your Weekly Strength Reflection:**\n\n${data.reflection}\n\nKeep going, Spokane! You've logged ${moodLogs.length} times recently and every check-in counts toward your growth.`
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I couldn't generate your reflection right now, but I'm here to chat!" }]);
    } finally {
      setIsGeneratingReflection(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (streak > 0 && (streak % 7 === 0)) {
      setMessages(prev => {
        const hasMilestoneMsg = prev.some(m => m.text.includes(`Milestone: ${streak} Day Streak!`));
        if (hasMilestoneMsg) return prev;
        return [...prev, { 
          role: 'model', 
          text: `🎉 **Milestone: ${streak} Day Streak!**\n\nYou are showing incredible consistency. Would you like a special Milestone Reflection based on your logs?`
        }];
      });
    }
  }, [streak]);

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
              // Enforcing server-side security - Gemini API key is server-side
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
      const timer = setTimeout(checkMood, 15000); 
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
          isCrisis,
          isHighThinkingMode
        })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: data.error || "I'm having a little trouble connecting. Check your local Spokane resources or reach out to a peer mentor!" }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a little trouble connecting. Check your local Spokane resources or reach out to a peer mentor!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseOrStripThoughts = (text: string) => {
    const regex = /<thought_process>([\s\S]*?)<\/thought_process>/i;
    const match = text.match(regex);
    if (match) {
      const thoughts = match[1].trim();
      const cleanedText = text.replace(regex, '').trim();
      return { thoughts, text: cleanedText };
    }
    return { thoughts: null, text };
  };

  const toggleThoughts = (index: number) => {
    setExpandedThoughts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className={`bg-slate-900/50 border rounded-[2.5rem] flex flex-col h-[70vh] overflow-hidden transition-all duration-500 ${isCrisis ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-slate-800'}`}>
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className={isCrisis ? 'text-rose-500' : 'text-blue-500'} />
          <div>
            <h3 className="font-bold text-white">{isCrisis ? 'Crisis Assistant' : 'Recovery Guide'}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {isCrisis ? 'Safety Mode Active' : 'AI Assistance • Gemini'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {!isCrisis && (
            <button 
              onClick={() => setIsHighThinkingMode(!isHighThinkingMode)}
              className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${isHighThinkingMode ? 'bg-indigo-600 border-indigo-505 text-white shadow-lg shadow-indigo-950' : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'}`}
            >
              <Brain className="w-3.5 h-3.5" />
              {isHighThinkingMode ? 'Thinking Active' : 'Deep Thinking'}
            </button>
          )}

          {!isCrisis && (
            <button 
              onClick={generateWeeklyReflection}
              disabled={isLoading || moodLogs.length === 0}
              className="px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
            >
              Weekly Reflection
            </button>
          )}
          <button 
            onClick={() => setIsCrisis(!isCrisis)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCrisis ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            {isCrisis ? 'Deactivate Crisis Mode' : 'I am in Crisis'}
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            title="Share system updates"
            className="flex items-center justify-center p-2 rounded-xl bg-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Share our Latest Innovation</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Help spreads the word! Share our newly deployed **myRecovery Spokane** update. Our custom models and high-fidelity integrations offer next-level trauma-informed and resilient peer recovery services.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Prepared Facebook/Social Copy</label>
              <textarea
                readOnly
                className="w-full bg-transparent text-[11px] text-slate-300 border-none outline-none resize-none h-48 leading-relaxed font-mono font-bold"
                value={`🚀 BIG UPDATE: Today's High-Fidelity Features in myRecovery Spokane! 🚀

We've deployed a massive update combining state-of-the-art trauma-informed AI support with secure, admin-level cloud identity & telemetry:

🧠 "High Thinking Mode" Active: Trauma-informed AI systematically reflects using clinical-grade recovery guidelines before offering localized peer support.
🔒 App Check Security & Attestation: Integrates real-time ReCaptcha Enterprise web attestation and static debug bypasses to block malicious client requests.
🛡️ Administrative IDP Controls: Interactive Super Admin Console to configure, enable, or disable standard Google, Facebook, and Multi-tenant OAuth providers.
📜 Configurable Authentication Schemes: Read, modify, and direct deploy 'firebase.json' auth configurations instantly in the console.
⚙️ Cloud Functions Triggers: Simulated live execution logging for background welcomes, purges, and blocking v2 registration safety filters.
🌐 Customs Auth Domains & DNS: SPF, DKIM, and actions redirect verifying to validate secure custom transactional email senders.
🚇 Real-time Spokane Transit: Live STA arrivals feed parsing GTFS streams with responsive sandbox route simulation fallbacks.
📍 Somatic Database Logs: Client-side healing tracking with automatic Firestore-to-localStorage offline resilience backups.

Experience these cutting-edge features in action now at:
🔗 ${window.location.origin}

#RecoveryHub #TraumaInformed #AppCheck #GoogleCloud #SpokaneRecovery #SoberSpokane #MentalHealthNetwork #FirebaseAdmin #TechForGood #PWAAward`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🚀 BIG UPDATE: Today's High-Fidelity Features in myRecovery Spokane! 🚀\n\nExperience these cutting-edge trauma-informed AI recovery features & GCIP identity modules in action now at:\n🔗 ${window.location.origin}\n\n#RecoveryHub #SoberSpokane #TechForGood`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-center select-none"
              >
                <Twitter className="w-4 h-4 shrink-0" />
                Twitter / X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-center select-none"
              >
                <Facebook className="w-4 h-4 shrink-0" />
                Facebook
              </a>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-850">
              <button
                onClick={() => setShowShareModal(false)}
                className="p-3 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                id="cancel-share-modal"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`🚀 BIG UPDATE: Today's High-Fidelity Features in myRecovery Spokane! 🚀\n\nWe've deployed a massive update combining state-of-the-art trauma-informed AI support with secure, admin-level cloud identity & telemetry:\n\n🧠 "High Thinking Mode" Active: Trauma-informed AI systematically reflects using clinical-grade recovery guidelines before offering localized peer support.\n🔒 App Check Security & Attestation: Integrates real-time ReCaptcha Enterprise web attestation and static debug bypasses to block malicious client requests.\n🛡️ Administrative IDP Controls: Interactive Super Admin Console to configure, enable, or disable standard Google, Facebook, and Multi-tenant OAuth providers.\n📜 Configurable Authentication Schemes: Read, modify, and direct deploy 'firebase.json' auth configurations instantly in the console.\n⚙️ Cloud Functions Triggers: Simulated live execution logging for background welcomes, purges, and blocking v2 registration safety filters.\n🌐 Customs Auth Domains & DNS: SPF, DKIM, and actions redirect verifying to validate secure custom transactional email senders.\n🚇 Real-time Spokane Transit: Live STA arrivals feed parsing GTFS streams with responsive sandbox route simulation fallbacks.\n📍 Somatic Database Logs: Client-side healing tracking with automatic Firestore-to-localStorage offline resilience backups.\n\nExperience these cutting-edge features in action now at:\n🔗 ${window.location.origin}\n\n#RecoveryHub #TraumaInformed #AppCheck #GoogleCloud #SpokaneRecovery #SoberSpokane #MentalHealthNetwork #FirebaseAdmin #TechForGood #PWAAward`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                id="confirm-share-copy"
              >
                {copied ? 'Copied Snippet!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isCrisis && messages.length === 1 && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-4">
            <p className="text-xs text-rose-400 font-bold leading-relaxed font-sans">
              🆘 Crisis mode active. I will prioritize immediate safety strategies and help you ground yourself. Remember you can call 988 at any time.
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const { thoughts, text } = parseOrStripThoughts(m.text);
          const hasThoughts = !!thoughts;
          const isExpanded = expandedThoughts[i] ?? false;

          return (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} flex-col space-y-2`}>
              <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                  {text}
                </div>
              </div>

              {hasThoughts && m.role === 'model' && (
                <div className="flex justify-start px-2">
                  <div className="max-w-[85%] w-full bg-slate-950/60 border border-slate-850 rounded-2xl p-4.5 space-y-2.5">
                    <button 
                      onClick={() => toggleThoughts(i)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Brain className="w-4 h-4 shrink-0" />
                      <span>Internal Recovery Logic & Clinical Reasoning</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && (
                      <div className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap pl-3 border-l-2 border-indigo-950 font-bold">
                        {thoughts}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none animate-pulse text-slate-500 italic text-xs flex items-center gap-2">
              <RefreshCw className="animate-spin w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {isHighThinkingMode ? 'Deliberating step-by-step logic...' : 'Thinking...'}
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
        <button 
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sparkles size={20} />
        </button>
      </form>
    </div>
  );
};
