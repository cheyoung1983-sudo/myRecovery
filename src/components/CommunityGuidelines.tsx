import React from 'react';
import { ShieldCheck, Heart, AlertCircle, Sparkles, BookOpen, Brain, ThumbsUp } from 'lucide-react';
import { MyRecoveryLogo } from './MyRecoveryLogo';

interface CommunityGuidelinesProps {
  onAccept: () => void;
  className?: string;
}

export const CommunityGuidelines: React.FC<CommunityGuidelinesProps> = ({ onAccept, className = '' }) => {
  return (
    <div className={`bg-slate-900 text-slate-105 border border-slate-800 rounded-[2.5rem] w-full max-w-xl mx-auto shadow-2xl relative overflow-hidden flex flex-col ${className}`}>
      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-gradient-to-tr from-[#10b981]/10 to-[#4f46e5]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="p-8 pb-5 text-center relative border-b border-slate-800/80">
        <div className="flex justify-center mb-3">
          <MyRecoveryLogo size={60} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
          Peer Code & Clinical Consilience
        </span>
        <h2 className="text-2xl font-black text-white italic tracking-tight uppercase leading-none mt-1">
          Spokane Peer Guidelines
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto font-sans leading-relaxed">
          Trauma-informed, scientifically grounded, and respectful rules built to establish a safe environment for all Spokane peers.
        </p>
      </div>

      {/* Content Area with rich scrollable guidelines */}
      <div className="p-8 py-6 space-y-5 max-h-[26rem] overflow-y-auto custom-scrollbar flex-1 text-left">
        {/* Core Philosophy Section */}
        <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-350 leading-relaxed font-sans space-y-2">
          <p className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-indigo-400">
            <Brain size={13} /> Trauma-Informed Philosophy
          </p>
          <p>
            We adhere to a model of <strong>Clinical Consilience</strong>—balancing the biological realities of neuroplastic healing with psychological growth. Cravings and emotional dysregulation are handled as legitimate physiological markers of the triphasic recovery process, never as moral pitfalls.
          </p>
        </div>

        {/* Guidelines Grid */}
        <div className="space-y-4">
          {/* Guideline 1: Choice & Autonomy */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl mt-0.5 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">1. Support Voluntary Choice & Agency</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Remission is driven by voluntary behavioral adaptation (per Heyman's Choice Model). We respect all recovery modalities (e.g., 12-Step alignments, SMART, medical assistance, or raw natural restoration). No peer's chosen pathway should be discredited.
              </p>
            </div>
          </div>

          {/* Guideline 2: Safe attributions (iRISA trigger prevention) */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl mt-0.5 shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">2. Attentional Over-Salience Protection</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Excessive trigger exposure causes VM-prefrontal hyperactivation in vulnerable sign-trackers (under-iRISA model guidelines). <strong>Avoid describing graphic details of past consumption, particular substance amounts, drug recipes, or administrative methods</strong>. Keep discussions focused on emotional processing and action steps.
              </p>
            </div>
          </div>

          {/* Guideline 3: Isolation and Enriched Environment */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-450 rounded-xl mt-0.5 shrink-0">
              <Heart size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">3. Cultivate An Enriched Social Network</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Addiction thrives in environments of isolation (the Bruce Alexander "Rat Park" lesson). Our chats, feedback boards, and meetings exist to establish positive social connection. Lift others up, participate actively, and keep Spokane peers linked.
              </p>
            </div>
          </div>

          {/* Guideline 4: Zero Tolerance for Harassment */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl mt-0.5 shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">4. Emotional Safety & Stigma-Free Conduct</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Harassment, stigma, bullying, or boundary violations on the basis of gender, orientation, background, or physical status will not be tolerated. Keep peer-matching parameters safe, and respect each person’s anonymity.
              </p>
            </div>
          </div>

          {/* Guideline 5: Seek Integration, Not Judgment */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 bg-slate-800 border border-slate-700 text-slate-350 rounded-xl mt-0.5 shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">5. Local Spokane Integrity</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                We are a local peer group from Spokane neighborhoods. We agree to follow local meeting practices, support local mutual aid sponsors, map clean pathways, and maintain accurate checking standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-8 border-t border-slate-800/80 bg-slate-950/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <ShieldCheck className="text-emerald-500 w-4 h-4" />
          <span>Legally Encrypted Peer Pact</span>
        </div>
        <button
          onClick={onAccept}
          className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          id="accept-guidelines-btn"
        >
          <ThumbsUp size={14} /> I Accept & Pledge Support
        </button>
      </div>
    </div>
  );
};
