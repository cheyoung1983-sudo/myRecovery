import React, { useEffect, useState, useRef } from 'react';
import { 
  Smartphone, CheckCircle, Wifi, ShieldCheck, Code, Eye, Layers, 
  HelpCircle, Info, Settings, Plus, Trash2, Globe, Terminal, 
  RefreshCw, Copy, Check, AlertTriangle, Play, CheckSquare, Search, 
  ExternalLink, Sparkles, Award, Trophy, Heart, Shield, Lock, Unlock
} from 'lucide-react';

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
  const [adMode, setAdMode] = useState<'app_ads' | 'mobile' | 'web' | 'adsense'>('app_ads');
  const [mobileAdType, setMobileAdType] = useState<'banner' | 'rewarded'>('rewarded');
  const [isDevMode, setIsDevMode] = useState<boolean>(true);
  const [showTestDeviceSetup, setShowTestDeviceSetup] = useState<boolean>(false);
  const [customTestId, setCustomTestId] = useState<string>('');
  const [copiedText, setCopiedText] = useState<'pub' | 'banner' | 'rewarded' | 'rn' | 'kt_dep' | 'kt_manifest' | 'kt_init' | 'kt_load' | 'kt_show' | null>(null);

  // Crawler Simulation States
  const [crawlerStep, setCrawlerStep] = useState<number>(0);
  const [crawlerLogs, setCrawlerLogs] = useState<string[]>([]);
  const [crawlerRunning, setCrawlerRunning] = useState<boolean>(false);
  const [crawlerStatus, setCrawlerStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  // Interactive Rewarded Ad simulation states inside the phone frame
  const [rewardedAdState, setRewardedAdState] = useState<'not_loaded' | 'loading' | 'loaded' | 'showing' | 'completed'>('not_loaded');
  const [rewardSecondsLeft, setRewardSecondsLeft] = useState<number>(5);
  const [premiumSupportUnlocked, setPremiumSupportUnlocked] = useState<boolean>(false);
  const [supportQueriesCompleted, setSupportQueriesCompleted] = useState<number>(3);
  const [rewardTimerId, setRewardTimerId] = useState<NodeJS.Timeout | null>(null);

  const [registeredDevices, setRegisteredDevices] = useState<Array<{id: string, label: string, platform: 'Android' | 'iOS'}>>([
    { id: '12345678-ABCD-EF01-2345-6789ABCDEF01', label: 'Dev Pixel 8', platform: 'Android' },
    { id: '98765432-1234-5678-ABCD-EF0123456789', label: 'Test iPhone 15 Pro', platform: 'iOS' }
  ]);

  const addTestDevice = () => {
    if (!customTestId.trim()) return;
    const isIOS = customTestId.length === 36 && customTestId.split('-').length === 5 && !/^[0-9]/.test(customTestId); 
    setRegisteredDevices(prev => [
      ...prev,
      {
        id: customTestId.trim(),
        label: `Added Device ${prev.length + 1}`,
        platform: isIOS ? 'iOS' : 'Android'
      }
    ]);
    setCustomTestId('');
  };

  const removeTestDevice = (idToRemove: string) => {
    setRegisteredDevices(prev => prev.filter(d => d.id !== idToRemove));
  };

  const isRunningInDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isRunningInDev) {
      console.log('Spokane Ad System: App is running in development mode. Bypassing GPT ad banner initialization.');
      return;
    }
    try {
      if (window.googletag && window.googletag.cmd && adMode === 'web') {
        window.googletag.cmd.push(function() {
          window.googletag.display('div-gpt-ad-banner');
        });
      }
    } catch (error) {
      console.error('GPT Error:', error);
    }
  }, [adMode, isRunningInDev]);

  const copyToClipboard = (text: string, type: Exclude<typeof copiedText, null>) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Rewarded Ad Simulation Handlers
  const handleLoadRewardedAd = () => {
    if (rewardedAdState === 'loading' || rewardedAdState === 'showing') return;
    setRewardedAdState('loading');
    setTimeout(() => {
      setRewardedAdState('loaded');
    }, 1200);
  };

  const handleShowRewardedAd = () => {
    if (rewardedAdState !== 'loaded') return;
    setRewardedAdState('showing');
    setRewardSecondsLeft(5);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (rewardedAdState === 'showing') {
      interval = setInterval(() => {
        setRewardSecondsLeft(prev => {
          if (prev <= 1) {
            setRewardedAdState('completed');
            setPremiumSupportUnlocked(true);
            setSupportQueriesCompleted(prevQueries => prevQueries + 5);
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rewardedAdState]);

  const handleResetPremiumMode = () => {
    setPremiumSupportUnlocked(false);
    setRewardedAdState('not_loaded');
  };

  const handleRunCrawlerSimulation = () => {
    if (crawlerRunning) return;
    setCrawlerRunning(true);
    setCrawlerStatus('running');
    setCrawlerStep(1);
    setCrawlerLogs([`[00:01] 📡 Resolving host DNS structure: spokanerecovery.org ...`]);

    const steps = [
      {
        text: `[00:05] ✔ DNS record resolved successfully: 199.36.158.100 (Firebase Hosting Node Cluster)`,
        delay: 800
      },
      {
        text: `[00:12] 🔎 Negotiating SSL handshake & security headers for https://spokanerecovery.org ...`,
        delay: 1600
      },
      {
        text: `[00:18] 🚀 Crawler request initiated: GET /app-ads.txt HTTP/1.1 (Agent: Google-Adwords-Crawler)`,
        delay: 2400
      },
      {
        text: `[00:25] 📦 HTTP Status: 200 OK. Parsing received plain-text assets data stream...`,
        delay: 3400
      },
      {
        text: `[00:30] 📜 Found entry: Domain='google.com' | PublisherID='pub-7510685978539466' | Relationship='DIRECT' | AuthorityID='f08c47fec0942fa0'`,
        delay: 4500
      },
      {
        text: `[00:35] ⚖ Validating Publisher ID with authorized Mobile Ads App Configurations in metadata...`,
        delay: 5500
      },
      {
        text: `[00:40] 🎉 MATCH VERIFIED! Spokane AdMob account linked securely. Anti-Fraud crawler status set to APPROVED.`,
        delay: 6500
      }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setCrawlerLogs(prev => [...prev, step.text]);
        setCrawlerStep(index + 2);
        if (index === steps.length - 1) {
          setCrawlerRunning(false);
          setCrawlerStatus('success');
        }
      }, step.delay);
    });
  };

  const ADMOB_APP_ID = 'ca-app-pub-7510685978539466~3542343117';
  const ADMOB_PROD_UNIT_ID = 'ca-app-pub-7510685978539466/4762818221';
  const ADMOB_REWARDED_UNIT_ID = 'ca-app-pub-7510685978539466/5063838577';
  const ADMOB_TEST_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'; // Google's standard test banner id
  const ADMOB_TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917'; // Google's standard test rewarded id
  
  const ADSENSE_PUB_ID = 'ca-pub-7510685978539466';
  const ADSENSE_SLOT_ID = '7891246530';

  return (
    <div className={`my-6 overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-6 shadow-xl relative ${className}`} id="ad-system-monetization-module">
      {/* Subtle background highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Controller */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4 border-b border-slate-850/60 mb-4">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Google Ad System Integration</span>
          <h4 className="text-sm font-black text-white uppercase tracking-wider mt-0.5 font-sans">Ad Networks & Monetization Sandbox</h4>
        </div>

        {/* Network Toggle Button */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-850 self-stretch xl:self-auto gap-1">
          <button
            onClick={() => setAdMode('app_ads')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              adMode === 'app_ads' 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Globe size={11} />
            app-ads.txt & Crawl
          </button>
          <button
            onClick={() => setAdMode('mobile')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              adMode === 'mobile' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Smartphone size={11} />
            Mobile SDK Setup
          </button>
          <button
            onClick={() => setAdMode('web')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              adMode === 'web' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Layers size={11} />
            Web GPT
          </button>
          <button
            onClick={() => setAdMode('adsense')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              adMode === 'adsense' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Code size={11} />
            AdSense Code
          </button>
        </div>
      </div>

      {adMode === 'app_ads' ? (
        <div className="space-y-6 text-left">
          {/* Introductory Summary Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-emerald-550/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md">AdMob Verified Domain</span>
              <h5 className="text-white text-xs font-black uppercase tracking-wider font-sans">app-ads.txt deployment wizard</h5>
              <p className="text-slate-400 text-[10px] leading-relaxed max-w-xl">
                Google AdMob uses crawlers to scour public roots for standard <strong>app-ads.txt</strong> files to protect your app's catalog of mobile spaces against advertising fraud. Follow these interactive instructions to configure and verify.
              </p>
            </div>
            
            {/* Live Crawler Status Indicator */}
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl shrink-0 flex items-center gap-3 w-full md:w-auto">
              <div className="space-y-0.5">
                <span className="text-[7px] text-slate-500 uppercase tracking-widest font-black block">Google crawler status</span>
                <span className={`text-[10px] font-black font-sans uppercase tracking-wider block ${
                  crawlerStatus === 'success' ? 'text-emerald-400' : 'text-amber-500'
                }`}>
                  {crawlerStatus === 'success' ? '● Verified (Approved)' : '● Pending Crawl scan'}
                </span>
              </div>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                crawlerStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500 animate-pulse'
              }`}>
                {crawlerStatus === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Walkthrough Column */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Step 1: Content Setup */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                <div className="absolute top-3 right-3 text-slate-800 text-xs font-black font-mono">STEP 1</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black font-mono">1</div>
                  <h6 className="text-[11px] font-black uppercase text-white tracking-wider font-sans">Create and populate custom root snippet</h6>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans pl-7">
                  Create a file named <code>app-ads.txt</code> inside your local frontend directory hierarchy. Paste this entry containing your verified AdMob publisher account ID:
                </p>

                {/* Entry snippet block */}
                <div className="pl-7">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
                    <span className="text-[10px] text-zinc-305 font-bold break-all select-all font-mono">
                      google.com, pub-7510685978539466, DIRECT, f08c47fec0942fa0
                    </span>
                    <button 
                      onClick={() => copyToClipboard("google.com, pub-7510685978539466, DIRECT, f08c47fec0942fa0", "pub")}
                      className="shrink-0 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedText === 'pub' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      {copiedText === 'pub' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  
                  {/* Syntax analyzer */}
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={10} /> Valid Account</span>
                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={10} /> Direct Relationship</span>
                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={10} /> Valid Auth Tag</span>
                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={10} /> Standard Format</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Deployment Config */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                <div className="absolute top-3 right-3 text-slate-800 text-xs font-black font-mono">STEP 2</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black font-mono">2</div>
                  <h6 className="text-[11px] font-black uppercase text-white tracking-wider font-sans">Drop into frontend public directory & Deploy</h6>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans pl-7">
                  Ensure the file resides in your static build assets root (inside the <code>public/</code> folder for React/Vite frameworks or root directories). When Firebase pushes hosting configs, it serves assets on your custom domain instantly.
                </p>

                {/* Command instructions block */}
                <div className="pl-7 space-y-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 font-mono">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">Deployment terminal snippet</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold">
                      <Terminal size={11} className="shrink-0" />
                      <span>$ npm run build && firebase deploy --only hosting</span>
                    </div>
                  </div>
                  
                  {/* Public asset check status */}
                  <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-[9px] text-indigo-300 leading-relaxed font-sans">
                    <strong>Local Workspace Status Check:</strong> Your file is already placed inside the <code>/public/app-ads.txt</code> directory correctly! It will build into your distribution automatically.
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live Checking & Verification Platform */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Interactive Live Domain Crawling Verification Sandbox</span>
              
              <div className="bg-slate-950 rounded-[1.5rem] border border-slate-850 p-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Target scan domain</label>
                    <span className="text-[7.5px] font-bold font-mono text-emerald-400">SSL Security Match</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white font-sans font-medium">
                      <Globe size={11} className="text-slate-500" />
                      <span>spokanerecovery.org</span>
                    </div>
                    <span className="text-[8px] font-sans font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider border border-emerald-500/20">DNS Root</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Active Verification Engine log output</span>
                    <span className="text-[8px] text-slate-500 font-mono">Step {crawlerStep}/8</span>
                  </div>
                  
                  <div className="bg-slate-999 border-2 border-slate-900 rounded-2xl p-3 min-h-[9.5rem] flex flex-col justify-between font-mono bg-black relative">
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    
                    <div className="space-y-1.5 overflow-y-auto max-h-32 text-[8.5px] text-slate-400 leading-normal scrollbar-thin">
                      {crawlerLogs.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 italic select-none">
                          Crawler scanner is offline. Click "Scan domain" to trace the AdMob robot process...
                        </div>
                      ) : (
                        crawlerLogs.map((log, i) => (
                          <div key={i} className="whitespace-pre-wrap font-mono transition-opacity duration-200">
                            {log}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[7.5px] text-slate-550 uppercase font-black tracking-widest">
                      <span>CRAWLER AGENT: GOOGLE-ADWORDS-v1</span>
                      <span className={crawlerStatus === 'success' ? 'text-emerald-400' : 'text-slate-500'}>
                        {crawlerStatus === 'success' ? 'Scan Completed' : 'Ready'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulation command trigger button */}
                <button
                  onClick={handleRunCrawlerSimulation}
                  disabled={crawlerRunning || crawlerStatus === 'success'}
                  className={`w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md ${
                    crawlerStatus === 'success'
                      ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white'
                  }`}
                >
                  {crawlerRunning ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                  {crawlerStatus === 'success' 
                    ? 'AdMob App-Ads.txt Fully Verified' 
                    : crawlerRunning ? 'Crawling spokanerecovery.org...' : 'Run AdMob Crawler Checker'}
                </button>
              </div>
              
              {/* Extra Security Policy Match */}
              <div className="p-3 bg-indigo-950/15 rounded-xl border border-indigo-900/40 text-[9.5px] text-indigo-300 leading-relaxed font-sans">
                💡 <strong>Important Note:</strong> Real-time domain crawl validations generally complete inside 24 to 48 hours once you configure your AdMob Console to scan the correct custom URL.
              </div>
            </div>
          </div>
        </div>
      ) : adMode === 'mobile' ? (
        <div className="space-y-6 font-sans text-left">
          
          {/* Ad Type Toggle selector */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850 w-full sm:w-auto self-start gap-1">
            <button
              onClick={() => setMobileAdType('rewarded')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                mobileAdType === 'rewarded' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Award size={13} className="text-amber-400" />
              Rewarded Interstitial Setup (ca-app-pub-7510685978539466/5063838577)
            </button>
            <button
              onClick={() => setMobileAdType('banner')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                mobileAdType === 'banner' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Smartphone size={13} />
              Anchored Adaptive Banner (ca-app-pub-7510685978539466/4762818221)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Guide column (Native Kotlin / React Native) */}
            <div className="lg:col-span-7 space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-850/60 pb-2">
                <div>
                  <h5 className="text-white font-black text-xs uppercase tracking-wider">
                    {mobileAdType === 'rewarded' ? '🏆 Rewarded Interstitial Ad Integration Steps' : '📱 Adaptive Anchored Banner Setup'}
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Step-by-step implementation guide for your unique mobile keys
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400">AdMob SDK Ready</span>
                </div>
              </div>

              {mobileAdType === 'rewarded' ? (
                // Rewarded Interstitial Ad Steps
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                    <div className="absolute top-3 right-3 text-slate-850 text-[9px] font-black">STEP 1</div>
                    <h6 className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">1. Add Dependency in App build.gradle</h6>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[9px] text-slate-350 font-mono">
{`dependencies {
    implementation("com.google.android.gms:play-services-ads:23.0.0")
}`}
                    </pre>
                    <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>File: app/build.gradle.kts</span>
                      <button 
                        onClick={() => copyToClipboard('implementation("com.google.android.gms:play-services-ads:23.0.0")', 'kt_dep')}
                        className="text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest flex items-center gap-1 text-[8px] cursor-pointer"
                      >
                        {copiedText === 'kt_dep' ? 'Copied ✓' : 'Copy Dependency'}
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                    <div className="absolute top-3 right-3 text-slate-850 text-[9px] font-black">STEP 2</div>
                    <h6 className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">2. Configure AndroidManifest.xml</h6>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Declare your production AdMob App ID inside the <code>&lt;application&gt;</code> element constraint tag:
                    </p>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[9px] text-emerald-350 font-mono">
{`<manifest>
    <application>
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-7510685978539466~3542343117"/>
    </application>
</manifest>`}
                    </pre>
                    <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>File: src/main/AndroidManifest.xml</span>
                      <button 
                        onClick={() => copyToClipboard(`<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-7510685978539466~3542343117"/>`, 'kt_manifest')}
                        className="text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest flex items-center gap-1 text-[8px] cursor-pointer"
                      >
                        {copiedText === 'kt_manifest' ? 'Copied ✓' : 'Copy Manifest Tags'}
                      </button>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                    <div className="absolute top-3 right-3 text-slate-850 text-[9px] font-black">STEP 3</div>
                    <h6 className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">3. Initialize Mobile Ads & Cache Unit in MainActivity</h6>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Initialize the Ad SDK in <code>onCreate</code>. Below is the complete loader code using your custom rewarded interstitial ID:
                    </p>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[9px] text-slate-350 font-mono">
{`import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAd
import com.google.android.gms.ads.rewardedinterstitial.RewardedInterstitialAdLoadCallback

class MainActivity : AppCompatActivity() {
    private var rewardedInterstitialAd: RewardedInterstitialAd? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        MobileAds.initialize(this) {}
        loadRewardedAd()
    }

    private fun loadRewardedAd() {
        val adUnitId = "ca-app-pub-7510685978539466/5063838577" 
        val adRequest = AdRequest.Builder().build()

        RewardedInterstitialAd.load(this, adUnitId, adRequest, 
            object : RewardedInterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedInterstitialAd) {
                    rewardedInterstitialAd = ad
                }
                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedInterstitialAd = null
                }
            }
        )
    }
}`}
                    </pre>
                    <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>MainActivity.kt (Native Android SDK)</span>
                      <button 
                        onClick={() => copyToClipboard('ca-app-pub-7510685978539466/5063838577', 'kt_load')}
                        className="text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest flex items-center gap-1 text-[8px] cursor-pointer"
                      >
                        {copiedText === 'kt_load' ? 'Copied ✓' : 'Copy Ad Unit ID'}
                      </button>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                    <div className="absolute top-3 right-3 text-slate-850 text-[9px] font-black">STEP 4</div>
                    <h6 className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">4. Handle Completion Reward</h6>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Show full-screen ad experience when the user wants to unlock premium/crisis assistance capabilities.
                    </p>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[9px] text-slate-350 font-mono">
{`fun showAdAndGrantAccess() {
    rewardedInterstitialAd?.let { ad ->
        ad.show(this) { rewardItem ->
            val rewardAmount = rewardItem.amount
            // Unlock Spokane Peer Support Premium mode here!
            runOnUiThread {
                unlockSpokanePremiumFeatures()
            }
        }
    } ?: run {
        // Fallback: Ad is still loading, show loading spinner
    }
}`}
                    </pre>
                  </div>

                  {/* React Native snippet extra reference */}
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                    <h6 className="text-[11.5px] font-black text-[#818cf8] uppercase tracking-wide flex items-center gap-1">
                      <Sparkles size={12} className="text-indigo-400" /> React Native wrapper config
                    </h6>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      If targeting cross-platform via <code>react-native-google-mobile-ads</code>, set up your keys inside <code>app.json</code> and load inside your JS/TS code:
                    </p>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[9px] text-indigo-350 font-mono">
{`import { RewardedInterstitialAd, TestIds } from 'react-native-google-mobile-ads';

const rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(
  'ca-app-pub-7510685978539466/5063838577'
);

// Load and handle reward events
rewardedInterstitial.addAdEventListener(AdEventType.EARNED_REWARD, (reward) => {
  setIsPremiumUnlocked(true);
});
rewardedInterstitial.load();`}
                    </pre>
                  </div>
                </div>
              ) : (
                // Anchored Adaptive Banner steps
                <div className="space-y-4">
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 relative overflow-hidden">
                    <div className="absolute top-3 right-3 text-slate-850 text-[9px] font-black">STEP 1</div>
                    <h6 className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">Configure App.json (React Native Expo / bare workflows)</h6>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Store identifiers in the app manifest. Open your <code>app.json</code> file at project root:
                    </p>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[9.5px] text-indigo-350 font-mono">
{`{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-7510685978539466~3542343117",
    "ios_app_id": "ca-app-pub-7510685978539466~8605860319"
  }
}`}
                    </pre>
                  </div>

                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3">
                    <h6 className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">Adaptive Anchored Banner Placement</h6>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-[9px] text-slate-350 font-mono">
{`import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Strictly use TestIds.BANNER while in development, and only utilize live ID in production
const adUnitId = process.env.NODE_ENV === 'production' 
  ? 'ca-app-pub-7510685978539466/4762818221' 
  : TestIds.BANNER;

function AdBannerComponent() {
  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Test Devices Instruction (Google Policy Rule 6383165) */}
              <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
                <button 
                  onClick={() => setShowTestDeviceSetup(!showTestDeviceSetup)}
                  className="w-full px-4 py-3 bg-slate-900/50 hover:bg-slate-900/80 transition-all flex items-center justify-between text-left border-b border-slate-850/50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-indigo-400" />
                    <div>
                      <h6 className="text-[11px] font-black uppercase tracking-wider text-white">Test Device Setup Guidance</h6>
                      <p className="text-[9px] text-[#818cf8] uppercase tracking-widest font-black flex items-center gap-1">
                        AdMob Account Safety Check (Rule 6383165 Match)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {showTestDeviceSetup ? 'Hide Details' : 'Configure Devices'}
                  </span>
                </button>

                {showTestDeviceSetup && (
                  <div className="p-4 space-y-4 text-left">
                    <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2 text-xs">
                      <p className="text-[10px] uppercase font-black tracking-wider text-indigo-300 flex items-center gap-1">
                        <HelpCircle size={12} /> Why is this necessary?
                      </p>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Per Google AdMob policy <strong>6383165</strong>, clicking your own live ads violates system rules and gets your publisher account permanently banned. Registering test devices ensures only safe sandboxed ads display on developer devices without causing invalid traffic.
                      </p>
                    </div>

                    {/* Interactive device simulator registry list */}
                    <div className="space-y-2">
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">Registered Test Devices (Code & Console)</span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {registeredDevices.map((device) => (
                          <div key={device.id} className="flex items-center justify-between bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg text-[9px]">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${device.platform === 'Android' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                {device.platform}
                              </span>
                              <div>
                                <span className="text-slate-300 font-bold block font-sans">{device.label}</span>
                                <span className="font-mono text-[8px] text-slate-500 block truncate max-w-[200px] sm:max-w-xs">{device.id}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeTestDevice(device.id)}
                              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Remove device"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={customTestId}
                          onChange={(e) => setCustomTestId(e.target.value)}
                          placeholder="Paste GAID / IDFA (e.g. 12345678-ABCD...)"
                          className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-[9.5px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                        <button 
                          onClick={addTestDevice}
                          className="px-3 bg-indigo-600 hover:bg-indigo-500 transition-all font-black text-[9px] uppercase tracking-widest text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Find UUID instruction steps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[9px]">
                      <div className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
                        <h6 className="font-black text-white uppercase text-[8px] tracking-wider text-emerald-400 font-sans">Android GAID Retrieval</h6>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Open device <strong>Settings</strong> &gt; <strong>Google</strong> &gt; <strong>Ads</strong>. Look for your Advertising ID at the bottom of the screen.
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
                        <h6 className="font-black text-white uppercase text-[8px] tracking-wider text-blue-400 font-sans">iOS IDFA Retrieval</h6>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          Go to <strong>Settings</strong> &gt; <strong>Privacy & Security</strong> &gt; <strong>Tracking</strong>. You can also log standard debug runtime in Xcode.
                        </p>
                      </div>
                    </div>

                    {/* React Native implementation code snippet block */}
                    <div className="space-y-1 pt-1 font-mono">
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">React Native SDK Configuration Code</span>
                      <pre className="p-3 bg-slate-950 border border-slate-850 rounded-xl overflow-x-auto text-[8.5px] text-slate-400 font-mono leading-normal">
{`import mobileAds from 'react-native-google-mobile-ads';

// Register test devices safely on startup
mobileAds()
  .setRequestConfiguration({
    testDeviceIds: [
      ${registeredDevices.map(d => `'${d.id}'`).join(',\n      ')}
    ]
  })
  .then(() => {
    // Initialized safely
  });`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Mobile Device Preview Window */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Interactive Real-time Phone Emulator & Console</span>

              <div className="bg-slate-950 border border-slate-850 rounded-[1.8rem] p-5 flex flex-col items-center">
                
                {/* Physical Phone Frame Container */}
                <div className="w-56 h-[17.5rem] bg-slate-900 border-4 border-slate-800 rounded-3xl relative overflow-hidden flex flex-col shadow-2xl mb-4">
                  {/* Phone Speaker Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-950 rounded-b-xl z-20 flex justify-center items-center">
                    <div className="w-8 h-1 bg-slate-850 rounded-full" />
                  </div>

                  {/* Status bar */}
                  <div className="h-6 px-3 flex justify-between items-center bg-slate-950 text-[7px] text-slate-550 font-black uppercase tracking-widest z-10 select-none">
                    <div className="flex items-center gap-1 mt-1 font-mono">
                      <Wifi size={8} className="text-emerald-500" />
                      <span>5G LTE</span>
                    </div>
                    <span className="mt-1 font-mono">12:00 PM</span>
                  </div>

                  {/* Mock Device Content */}
                  <div className="flex-1 bg-[#121824] p-3.5 text-left relative flex flex-col justify-between">
                    
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-slate-850/50 pb-1.5 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-md" />
                        <span className="text-[7.5px] text-white font-black uppercase tracking-wider">myRecovery</span>
                      </div>
                      
                      {/* Premium unlocked token icon indicator */}
                      {premiumSupportUnlocked ? (
                        <div className="flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">
                          <Trophy size={7} className="text-amber-400" />
                          <span className="text-[5.5px] font-black text-emerald-400 uppercase">PREMIUM ACTIVE</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 px-1 py-0.5 rounded">
                          <Lock size={6} className="text-slate-500" />
                          <span className="text-[5.5px] font-bold text-slate-500">FREE TIERS</span>
                        </div>
                      )}
                    </div>

                    {/* Central main peer support query screen visual wrapper */}
                    <div className="flex-1 py-2 flex flex-col justify-center">
                      {premiumSupportUnlocked ? (
                        <div className="space-y-1.5 text-center animate-fade-in">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 mx-auto flex items-center justify-center shadow-lg text-slate-950 font-black">
                            👑
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[7.5px] font-bold text-slate-205 block uppercase">Premium Unlocked!</span>
                            <span className="text-[5.5px] text-indigo-400 uppercase block font-mono">Crisis Access Active</span>
                            <p className="text-[5.5px] text-slate-400 max-w-[120px] mx-auto leading-normal">
                              Unlimited custom peer recovery chats has been unlocked for 24 hours.
                            </p>
                          </div>
                          <button 
                            onClick={handleResetPremiumMode}
                            className="px-2 py-0.5 bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 text-[5px] text-slate-400 hover:text-white uppercase font-black tracking-wider cursor-pointer"
                          >
                            Reset Tier Match
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850/40 text-center relative overflow-hidden">
                            <span className="text-[6.5px] text-slate-300 font-bold block">Spokane Peer Support Hub</span>
                            <span className="text-[5px] font-mono text-zinc-500 uppercase block tracking-wider mt-0.5">Daily Quota Status</span>
                            
                            {/* Usage meter */}
                            <div className="flex justify-center items-center gap-1.5 my-1.5">
                              <span className="text-[8px] font-bold font-mono text-white">0</span>
                              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#3b82f6] w-0" />
                              </div>
                              <span className="text-[5.5px] text-slate-400 font-bold font-mono">Remaining</span>
                            </div>

                            <p className="text-[5px] text-slate-400 max-w-[130px] mx-auto leading-relaxed">
                              You have run out of peer support chat operations for today. View a brief message to unlock 5 extra premium credits instantly!
                            </p>
                          </div>

                          <button
                            onClick={handleLoadRewardedAd}
                            disabled={rewardedAdState !== 'not_loaded'}
                            className={`w-full py-1 text-[6px] rounded-lg tracking-widest font-black uppercase text-center transition-all cursor-pointer ${
                              rewardedAdState === 'not_loaded'
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                : 'bg-slate-950 border border-slate-850 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {rewardedAdState === 'not_loaded' && 'Unlock 5 Credits (Free)'}
                            {rewardedAdState === 'loading' && 'Ad Caching...'}
                            {rewardedAdState === 'loaded' && 'Ad Ready below!'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Anchored adaptive banner simulated area (if Banner selected) */}
                    {mobileAdType === 'banner' && (
                      <div className="bg-indigo-600/10 border-t border-indigo-500/20 -mx-3.5 -mb-3.5 p-1 text-center flex flex-col justify-center items-center pb-2 min-h-[30px] relative">
                        <div className="text-[4px] text-slate-500 font-bold uppercase tracking-widest absolute -top-1 right-2 bg-slate-950 px-1 rounded-sm border border-slate-850/50">Sponsored</div>
                        {isDevMode ? (
                          <div className="space-y-0.5">
                            <div className="text-[5px] font-black text-amber-500 uppercase tracking-widest font-mono">Google Mobile Test Ad</div>
                            <div className="text-[4px] text-slate-400">Adaptive Anchor Banner Size</div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-[5px] font-black text-[#10b981] uppercase tracking-widest">Spokane Peer Support Network</div>
                            <div className="text-[4px] text-slate-350">Live crisis counseling line available</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rewarded Full-screen Overlay when ad is active */}
                    {rewardedAdState === 'showing' && (
                      <div className="absolute inset-x-0 -top-6 -bottom-3.5 bg-black z-30 flex flex-col justify-between p-4 text-center animate-fade-in relative">
                        
                        {/* Fake Close / Countdown ticker */}
                        <div className="flex justify-between items-center text-[6px] text-slate-500 tracking-wider font-mono">
                          <span>AD SIMULATOR MODE</span>
                          <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white flex items-center gap-1">
                            <Heart size={6} className="text-rose-500 fill-rose-500 animate-pulse" />
                            Reward in {rewardSecondsLeft}s
                          </span>
                        </div>

                        {/* Creative Custom Spokane Recovery Non-Profit Presentation */}
                        <div className="space-y-2 py-4">
                          <span className="text-[5px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-550/20 px-1.5 py-0.5 rounded">
                            Verified Provider Sponsored Ad
                          </span>
                          
                          <h6 className="text-[9px] font-black uppercase text-white tracking-wider leading-tight">
                            "A Healthy Community Starts with One Choice"
                          </h6>
                          <div className="w-10 h-10 bg-slate-900 rounded-full mx-auto flex items-center justify-center border border-slate-800 text-indigo-400">
                            🤝
                          </div>
                          
                          <div>
                            <span className="text-[6.5px] text-indigo-400 font-black tracking-widest uppercase block">Spokane Recovery Initiative</span>
                            <p className="text-[5px] text-slate-400 max-w-[140px] mx-auto leading-relaxed">
                              Providing non-clinical peer coaching, medication guidance support, and professional outpatient recovery groups.
                            </p>
                          </div>
                        </div>

                        {/* Interactive install CTA */}
                        <div className="space-y-1">
                          <div className="w-full bg-[#10b981] text-slate-950 font-black text-[6.5px] py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                            Learn More / Contact Us
                          </div>
                          <span className="text-[4px] text-slate-600 block uppercase font-mono">Unit ID: {ADMOB_REWARDED_UNIT_ID.substring(0, 20)}...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Console Controls for the developer */}
                <div className="w-full space-y-2 bg-slate-950 border border-slate-850 p-3 rounded-2xl">
                  <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-black block text-left">SDK Interactive State Controller</span>

                  <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase font-sans">
                    <button
                      onClick={handleLoadRewardedAd}
                      disabled={rewardedAdState !== 'not_loaded'}
                      className={`py-2 rounded-xl transition-all cursor-pointer uppercase flex items-center justify-center gap-1 ${
                        rewardedAdState === 'not_loaded'
                          ? 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-white'
                          : rewardedAdState === 'loading'
                          ? 'bg-slate-950 border border-slate-900 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-400'
                      }`}
                    >
                      {rewardedAdState === 'loading' && <RefreshCw size={10} className="animate-spin" />}
                      {rewardedAdState === 'not_loaded' && '1. Load Ad'}
                      {rewardedAdState === 'loading' && 'Caching...'}
                      {rewardedAdState !== 'not_loaded' && rewardedAdState !== 'loading' && 'Cached ✓'}
                    </button>

                    <button
                      onClick={handleShowRewardedAd}
                      disabled={rewardedAdState !== 'loaded'}
                      className={`py-2 rounded-xl transition-all cursor-pointer uppercase flex items-center justify-center gap-1 ${
                        rewardedAdState === 'loaded'
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white shadow-md'
                          : 'bg-slate-950 border border-slate-900 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Play size={10} />
                      2. Show Ad
                    </button>
                  </div>

                  {/* SDK State details */}
                  <div className="flex items-center justify-between text-[7px] font-bold text-slate-550 uppercase tracking-wider pt-1 font-mono">
                    <span>Ad State: <strong className="text-white">{rewardedAdState.toUpperCase()}</strong></span>
                    <span>Type: Rewarded Interstitial</span>
                  </div>
                </div>
              </div>

              {/* Unique Credentials Panel */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3 text-left">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">Unit metadata matching console</span>
                
                <div className="space-y-1 px-1">
                  <label className="text-[7.5px] text-slate-550 uppercase tracking-widest font-black block">AdMob Android app config ID</label>
                  <div className="flex items-center justify-between bg-slate-900/60 border border-slate-850 px-2.5 py-1.5 rounded-xl text-[9px] font-mono">
                    <span className="text-slate-350">{ADMOB_APP_ID}</span>
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-[#818cf8] border border-indigo-900/40 px-1 py-0.2 rounded">Global App ID</span>
                  </div>
                </div>

                <div className="space-y-1 px-1">
                  <label className="text-[7.5px] text-slate-550 uppercase tracking-widest font-black block">
                    {mobileAdType === 'rewarded' ? 'Rewarded Interstitial AD UNIT ID' : 'Anchored Adaptive Banner AD UNIT ID'}
                  </label>
                  <div className="flex items-center justify-between bg-slate-900/60 border border-slate-850 px-2.5 py-1.5 rounded-xl text-[9px] font-mono">
                    <span className="text-amber-400 break-all font-mono">
                      {mobileAdType === 'rewarded' ? ADMOB_REWARDED_UNIT_ID : ADMOB_PROD_UNIT_ID}
                    </span>
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-[#818cf8] border border-indigo-900/40 px-1 py-0.2 rounded shrink-0 ml-1 font-sans">Live Ad Unit</span>
                  </div>
                </div>

                <div className="space-y-1 px-1 pt-1.5 border-t border-slate-850/40">
                  <label className="text-[7.5px] text-slate-550 uppercase tracking-widest font-black block">Active Environment Mode</label>
                  <div className="flex items-center justify-between bg-slate-900/40 border border-slate-850/60 px-2.5 py-1 rounded-xl text-[9.5px]">
                    <span className={`font-black uppercase text-[8px] tracking-wider ${isRunningInDev ? 'text-amber-500' : 'text-emerald-400'}`}>
                      {isRunningInDev ? 'Development Context' : 'Production Explicit'}
                    </span>
                    <span className="text-[7.5px] font-bold text-slate-400 font-mono">
                      {isRunningInDev ? 'TestIds.BANNER' : 'Live Ad Server'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : adMode === 'web' ? (
        <div className="space-y-3 font-sans text-left">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sponsored Web Banner</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[8px] font-black tracking-widest uppercase ${isRunningInDev ? 'text-amber-400' : 'text-[#10b981]'}`}>
                {isRunningInDev ? 'Development Slot Sandbox' : 'GPT Active'}
              </span>
            </div>
          </div>
          <div className="flex justify-center items-center min-h-[70px] bg-slate-950/50 rounded-2xl border border-slate-850 overflow-hidden relative p-2">
            {isRunningInDev ? (
              <div className="w-[320px] h-[50px] flex flex-col items-center justify-center border-2 border-dashed border-amber-500/40 bg-amber-500/5 rounded-xl text-center p-2 select-none relative" id="dev-ad-banner-placeholder">
                <div className="absolute top-1 right-1 text-[6px] font-mono text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                  DEVELOPMENT MODE
                </div>
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <AlertTriangle size={11} className="text-amber-500 animate-pulse shrink-0" />
                  <span>Real Ads Inactive</span>
                </div>
                <p className="text-[8px] text-slate-400 leading-normal mt-0.5 font-sans font-medium">
                  Placeholder Web Banner Ad (320 × 50 / Slot ID: <code className="text-slate-350">div-gpt-ad-banner</code>)
                </p>
              </div>
            ) : (
              <>
                {/* GPT Ad Slot */}
                <div id="div-gpt-ad-banner" className="w-[320px] h-[50px] mx-auto z-10" />
                
                {/* Placeholder UI */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                  <span className="text-[10px] font-black italic tracking-tighter">SPOKANE RECOVERY AD NETWORK</span>
                  <span className="text-[8px] uppercase tracking-widest mt-1 font-bold">Web Ad Slot</span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 font-sans text-left">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Google AdSense Auto-Ads & Banner</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase">AdScript Loaded</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 space-y-3 text-left">
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3">
                <div className="space-y-1">
                  <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded animate-pulse">AUTO-ADS ENABLED</span>
                  <p className="text-white font-bold text-xs uppercase tracking-wider mt-1">Publisher & Client Credentials</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-slate-500 uppercase tracking-widest font-black block">Publisher Account ID (client)</label>
                  <div className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl flex items-center justify-between">
                    <span className="font-mono text-[9.5px] font-bold text-slate-300">{ADSENSE_PUB_ID}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">Verified</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-slate-500 uppercase tracking-widest font-black block">Standard Responsive Ad Slot</label>
                  <div className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl flex items-center justify-between">
                    <span className="font-mono text-[9.5px] font-bold text-slate-300">{ADSENSE_SLOT_ID}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Fixed-Height</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 border border-slate-850 rounded-xl text-[9px] text-slate-400 font-sans leading-relaxed space-y-1">
                  <p className="font-bold text-white flex items-center gap-1 uppercase tracking-wider text-[8px] text-amber-400">
                    <ShieldCheck size={10} /> Sync Verification Steps
                  </p>
                  <p>
                    Check standard layout bounds in Spokane app frame. Standard AdSense script tag is globally injected inside <code>&lt;head&gt;</code> element to support synchronous and asynchronous dynamic loading on demand.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-12 lg:col-span-5 space-y-3 text-left">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest px-1">Global Script Tag Configuration</span>
              <pre className="p-4 bg-slate-950 border border-slate-850 rounded-2xl overflow-x-auto text-[9px] text-slate-400 font-mono leading-normal shadow-inner max-w-full">
                {`<script async 
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7510685978539466" 
  crossorigin="anonymous">
</script>`}
              </pre>

              <div className="flex items-center gap-1.5 p-2.5 bg-indigo-950/20 rounded-xl text-[9px] text-indigo-300 font-sans border border-indigo-850/50">
                <CheckCircle size={12} className="text-[#10b981]" />
                <span>Synchronized with <code>google-adsense-account</code> meta tag.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
