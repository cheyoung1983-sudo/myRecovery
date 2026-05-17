import React, { useEffect } from 'react';

interface AdBannerProps {
  className?: string;
}

declare global {
  interface Window {
    googletag: any;
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  className = ''
}) => {
  useEffect(() => {
    try {
      if (window.googletag && window.googletag.cmd) {
        window.googletag.cmd.push(function() {
          window.googletag.display('div-gpt-ad-banner');
        });
      }
    } catch (error) {
      console.error('GPT Error:', error);
    }
  }, []);

  return (
    <div className={`my-4 overflow-hidden rounded-2xl bg-slate-800/30 border border-slate-800 p-2 ${className}`}>
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 px-2">Sponsored Content</div>
      <div className="flex justify-center items-center min-h-[60px] bg-slate-900 rounded-xl overflow-hidden relative">
        {/* GPT Ad Slot */}
        <div id="div-gpt-ad-banner" className="w-[320px] h-[50px] mx-auto z-10" />
        
        {/* Placeholder UI that stays until ad loads (optional backdrop) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
          <span className="text-[10px] font-black italic tracking-tighter">SPOKANE RECOVERY AD NETWORK</span>
          <span className="text-[8px] uppercase tracking-widest mt-1 font-bold">Community Partner</span>
        </div>
      </div>
    </div>
  );
};
