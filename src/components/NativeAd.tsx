import React, { useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

interface NativeAdProps {
  className?: string;
}

export const NativeAd: React.FC<NativeAdProps> = ({ className = '' }) => {
  useEffect(() => {
    try {
      if (window.googletag && window.googletag.cmd) {
        window.googletag.cmd.push(function() {
          window.googletag.display('div-gpt-ad-native');
        });
      }
    } catch (error) {
      console.error('GPT Native Error:', error);
    }
  }, []);

  return (
    <div className={`group relative bg-slate-800/40 border border-slate-800 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all overflow-hidden ${className}`}>
      {/* Ad Indicator */}
      <div className="absolute top-4 right-6 flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full">
        <Sparkles size={10} className="text-blue-500" />
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sponsored</span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Ad Container */}
        <div id="div-gpt-ad-native" className="min-h-[100px] w-full" />
        
        {/* Fallback/Placeholder UX if ad hasn't loaded */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-slate-600">
            <ExternalLink size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-base">Community Wellness Partner</h4>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-tight mt-1">
              Supporting Spokane's recovery journey with local expertise and care.
            </p>
          </div>
        </div>
      </div>

      {/* Gloss Effect */}
      <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] group-hover:left-[150%] transition-all duration-1000 ease-in-out pointer-events-none" />
    </div>
  );
};
