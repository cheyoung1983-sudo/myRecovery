
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { MoodEntry } from '../types';

interface AISupportViewProps {
  currentUser: FirebaseUser | null;
  moodLogs: MoodEntry[];
}

export const AISupportView: React.FC<AISupportViewProps> = ({ currentUser, moodLogs }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hello! I'm your Spokane Recovery Guide. How's your journey going today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);
  const [anxietyDetected, setAnxietyDetected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        <button 
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl transition-all disabled:opacity-50"
        >
          <Sparkles size={20} />
        </button>
      </form>
    </div>
  );
};
