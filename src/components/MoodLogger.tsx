
import React, { useState } from 'react';
import { Sparkles, Smile, Meh, Frown, ShieldAlert } from 'lucide-react';
import { MoodEntry } from '../types';

interface MoodLoggerProps {
  onLog: (mood: MoodEntry['mood'], note: string) => void;
}

export const MoodLogger: React.FC<MoodLoggerProps> = ({ onLog }) => {
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
