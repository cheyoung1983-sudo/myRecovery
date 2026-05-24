import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  User, 
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  Lock, 
  Plus, 
  Users, 
  CheckCircle2, 
  Zap,
  Info
} from 'lucide-react';
import { getCachedToken, connectGoogleCalendar, isCalendarConnected } from '../lib/googleCalendar';

interface GoogleSpace {
  name: string; // e.g., "spaces/AAAAAAAA"
  displayName?: string;
  spaceType?: string; // e.g., "SPACE" or "DIRECT_MESSAGE"
  type?: string; 
}

interface GoogleChatMessage {
  name: string;
  sender: {
    displayName: string;
    avatarUrl?: string;
    type: string;
  };
  text: string;
  createTime: string;
}

interface LocalSimMessage {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  timestamp: string;
  tag: string;
}

export const GoogleChatView: React.FC<{ currentUserProfile: any }> = ({ currentUserProfile }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLikingCheck, setIsLikingCheck] = useState<boolean>(false);
  const [spaces, setSpaces] = useState<GoogleSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleSpace | null>(null);
  const [spacesMessages, setSpacesMessages] = useState<GoogleChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  
  // UI states
  const [activeSegment, setActiveSegment] = useState<'real' | 'community'>('community');
  const [loadingSpaces, setLoadingSpaces] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sendingError, setSendingError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // Guided Instruction Accordion
  const [showDocs, setShowDocs] = useState<boolean>(false);

  // Local simulated messages for community chat
  const [localMessages, setLocalMessages] = useState<LocalSimMessage[]>([
    {
      id: 'local-1',
      sender: 'Sponsor Sarah',
      avatar: '👩‍⚕️',
      message: 'Just logged my 5-year coin today! Stay strong everyone in Spokane, day by day it gets lighter. Who is hitting the 7 PM fellowship tonight?',
      timestamp: '10:42 AM',
      tag: 'Milestone'
    },
    {
      id: 'local-2',
      sender: 'Marcus K.',
      avatar: '🧔',
      message: 'I am taking the transit route 90 from Valley to Union Gospel Mission. I can slide in to the meetings at Spokane Center around 6:45 PM. See you guys there!',
      timestamp: '11:15 AM',
      tag: 'Habit'
    },
    {
      id: 'local-3',
      sender: 'Recovery Guide Bot',
      avatar: '🔮',
      message: 'Welcome to the Spokane Sober Alliance Chat! Your Google Chat Space integrations are fully operational. Connect your Workspace to send official announcements now.',
      timestamp: '11:30 AM',
      tag: 'System'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load token on mount
  useEffect(() => {
    const activeToken = getCachedToken();
    if (activeToken) {
      setToken(activeToken);
    }
  }, []);

  // Sync real-time message flow view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [spacesMessages, localMessages]);

  // Fetch Spaces when token is verified
  useEffect(() => {
    if (token) {
      fetchSpaces(token);
    }
  }, [token]);

  // Fetch active Space messages
  useEffect(() => {
    if (token && selectedSpace) {
      fetchSpaceMessages(token, selectedSpace.name);
    }
  }, [token, selectedSpace]);

  const handleGoogleConnect = async () => {
    try {
      const activeToken = await connectGoogleCalendar();
      setToken(activeToken);
      triggerToast('Google Chat credential synchronized!', 'success');
      setActiveSegment('real');
    } catch (e: any) {
      console.error('Failed to authenticate Google Chat:', e);
      triggerToast('Could not fetch Google Chat OAuth permissions.', 'error');
    }
  };

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const fetchSpaces = async (authToken: string) => {
    setLoadingSpaces(true);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (!res.ok) throw new Error('Could not pull your Google Chat spaces');
      const data = await res.json();
      const loadedSpaces: GoogleSpace[] = data.spaces || [];
      setSpaces(loadedSpaces);
      if (loadedSpaces.length > 0) {
        setSelectedSpace(loadedSpaces[0]);
      }
    } catch (error: any) {
      console.warn('Google Chat Space fetching failed:', error);
      triggerToast('Failed to fetch real Google Chat workspaces.', 'info');
    } finally {
      setLoadingSpaces(false);
    }
  };

  const fetchSpaceMessages = async (authToken: string, spaceId: string) => {
    setLoadingMessages(true);
    setSendingError(null);
    try {
      // Endpoint to list messages in a space
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceId}/messages`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (!res.ok) throw new Error('Space message history has access restrictions.');
      const data = await res.json();
      setSpacesMessages(data.messages || []);
    } catch (error: any) {
      console.warn('Google Message retrieval error:', error);
      setSendingError('This Google Chat room requires the chat bot package member to read message lists, or space permissions are restricted.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (activeSegment === 'real' && token && selectedSpace) {
      // Real API post to Google Chat Space
      setLoadingMessages(true);
      setSendingError(null);
      try {
        const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: newMessage.trim()
          })
        });

        if (!res.ok) throw new Error('Failed to deliver message package');
        
        // Optimistic refresh
        setNewMessage('');
        triggerToast('Message posted successfully to Google Chat space!', 'success');
        fetchSpaceMessages(token, selectedSpace.name);
      } catch (error: any) {
        setSendingError(error.message || 'Error occurred while publishing message.');
      } finally {
        setLoadingMessages(false);
      }
    } else {
      // Local simulated message
      const textToAppend = newMessage.trim();
      const author = currentUserProfile?.name || 'MyRecovery Companion';
      setLocalMessages(prev => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          sender: author,
          avatar: '👤',
          message: textToAppend,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tag: 'Direct'
        }
      ]);
      setNewMessage('');
      triggerToast('Simulated announcement placed in peer circle!', 'success');
    }
  };

  return (
    <div className="space-y-6" id="google-chat-comprehensive-platform">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tight leading-none">
            Google Chat Forums<span className="text-pink-500">.</span>
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Real-time Workspace and peer recovery communities
          </p>
        </div>

        {/* Auth status & actions */}
        <div className="flex flex-wrap items-center gap-2">
          {token ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                Workspace Synced
              </span>
              <button 
                onClick={() => fetchSpaces(token)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all ml-1"
                title="Reload spaces"
              >
                <RefreshCw size={12} className={loadingSpaces ? 'animate-spin' : ''} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleConnect}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/10 cursor-pointer flex items-center gap-1.5"
            >
              <Globe size={13} /> Link Google Chat
            </button>
          )}

          <button
            onClick={() => setShowDocs(!showDocs)}
            className="px-4 py-2.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-800 cursor-pointer flex items-center gap-1"
          >
            <Info size={12} />
            {showDocs ? 'Hide Guides' : 'Guides'}
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST MESSAGE BANNER */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-600/15 border border-emerald-500/35 p-4 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 font-bold uppercase tracking-widest"
          >
            <CheckCircle2 size={16} /> {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONSOLE ACTION GUIDANCE */}
      {showDocs && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-950/70 border border-slate-850 p-6 rounded-[2rem] text-slate-400 space-y-3.5 text-xs font-semibold leading-relaxed"
        >
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
            <ShieldCheck size={16} className="text-blue-500" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Workspace Google Chat Sandbox Setup</h4>
          </div>
          <p>
            This applet implements full, authorized access to Google Chat on behalf of the user. To set up your actual Workspace organization chat correctly:
          </p>
          <ul className="list-decimal list-inside space-y-1.5 pl-1.5 text-slate-300">
            <li>Open your Google Cloud Console project settings.</li>
            <li>Verify the <span className="text-pink-500 font-mono">chat.spaces</span> and <span className="text-pink-500 font-mono">chat.messages</span> scopes are checked in your active OAuth consent settings.</li>
            <li>Make sure to register your space or join recovery circles to automatically pull and sync discussions using the live token tab.</li>
          </ul>
        </motion.div>
      )}

      {/* MAIN LAYOUT SPLITTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SIDEBAR: Space lists and configurations (4cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Channel Selector Toggle Segment */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-850 flex gap-1">
            <button
              onClick={() => setActiveSegment('community')}
              className={`flex-1 py-3 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSegment === 'community' 
                  ? 'bg-blue-600 text-white font-black' 
                  : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users size={12} /> Spokane Peer Room
            </button>
            <button
              onClick={() => {
                if (!token) {
                  handleGoogleConnect();
                } else {
                  setActiveSegment('real');
                }
              }}
              className={`flex-1 py-3 text-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.2 break-all ${
                activeSegment === 'real' 
                  ? 'bg-pink-600 text-white font-black' 
                  : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Zap size={11} /> Workspace Live Space
            </button>
          </div>

          {/* Connected spaces lists */}
          {activeSegment === 'real' ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Google Chat Spaces</h4>
                <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold font-mono uppercase">API ON</span>
              </div>

              {loadingSpaces ? (
                <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-500 border-t-pink-500 rounded-full" />
                  Querying Spaces...
                </div>
              ) : spaces.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {spaces.map((sp) => (
                    <button
                      key={sp.name}
                      onClick={() => setSelectedSpace(sp)}
                      className={`w-full p-4 border rounded-2xl text-left transition-all ${
                        selectedSpace?.name === sp.name
                          ? 'bg-pink-500/15 border-pink-500/40 text-pink-400'
                          : 'bg-slate-950 border-slate-900 hover:border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare size={13} className="text-pink-500" />
                        <p className="text-xs font-black uppercase tracking-wider leading-none truncate">
                          {sp.displayName || 'Unnamed Space'}
                        </p>
                      </div>
                      <p className="text-[7.5px] font-mono text-slate-500 truncate mt-1.5 uppercase font-bold">
                        ID: {sp.name.split('/')[1] || sp.name}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-wider space-y-2">
                  <p>No joined Google Chat spaces were found.</p>
                  <button 
                    onClick={() => fetchSpaces(token!)}
                    className="text-pink-500 hover:underline mx-auto block font-black uppercase text-[9px] tracking-wider"
                  >
                    Refresh Spaces Stream
                  </button>
                </div>
              )}

              {selectedSpace && (
                <div className="bg-slate-950/50 p-3.5 border border-slate-850 rounded-xl space-y-1.5 text-[10px]">
                  <p className="font-bold text-slate-400">Selected Space Details:</p>
                  <p className="text-slate-500 font-mono text-[8px] truncate leading-none">NAME: {selectedSpace.name}</p>
                  <p className="text-slate-500 uppercase font-black tracking-widest text-[8px] mt-1">
                    Ready to stream messages and submit checkins!
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Spokane Peer Community Side Menu */
            <div className="bg-slate-800/20 border border-slate-800 rounded-[2rem] p-5 space-y-4">
              <div className="border-b border-slate-850 pb-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Sober Area Support DMs</h4>
              </div>
              
              <div className="space-y-1.5">
                {[
                  { title: 'Spokane Fellowship Support Room', count: 18, focus: true, desc: 'Central Spokane clean space' },
                  { title: 'Sponsors & Counselors', count: 4, focus: false, desc: 'Mentor advisory desk' },
                  { title: 'Habits and Gratitude logs', count: 32, focus: false, desc: 'Daily sober lists checkin' }
                ].map((room, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 ${
                      room.focus 
                        ? 'bg-blue-600/10 border-blue-500/35 text-blue-400' 
                        : 'bg-slate-950/40 border-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-[10px] font-black uppercase tracking-wider truncate leading-none">{room.title}</p>
                      <p className="text-[9px] text-slate-500 truncate mt-1">{room.desc}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[9px] font-black bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-slate-500">
                      {room.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950/20 p-3.5 rounded-2xl border border-slate-900">
                <p className="text-[9px] text-slate-500 lowercase leading-relaxed font-semibold italic text-center">
                  Spokane Area Groups automatically route peer-to-peer discussions, providing a reliable channel loop.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* CHAT DISPLAY: Real-time Messages Feed (8cols) */}
        <div className="lg:col-span-8">
          
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] flex flex-col h-[65vh] overflow-hidden shadow-2xl relative">
            
            {/* Thread Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0f172a]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-2xl ${activeSegment === 'real' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-400'}`}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-none flex items-center gap-1.5">
                    {activeSegment === 'real' 
                      ? (selectedSpace?.displayName || 'Google Chat Workspace') 
                      : 'Spokane Fellowship Support Room'
                    }
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                    <ShieldCheck size={10} className={activeSegment === 'real' ? 'text-pink-500' : 'text-blue-500'} /> 
                    {activeSegment === 'real' ? 'Workspace Secure Stream' : 'Peer Recovery Alliance'}
                  </p>
                </div>
              </div>

              {activeSegment === 'real' && (
                <button 
                  onClick={() => selectedSpace && fetchSpaceMessages(token!, selectedSpace.name)}
                  disabled={loadingMessages || !selectedSpace}
                  className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-all text-xs font-semibold"
                >
                  <RefreshCw size={12} className={loadingMessages ? 'animate-spin' : ''} />
                </button>
              )}
            </div>

            {/* Messages Stream Wrapper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* If sending error/alert displays */}
              {sendingError && (
                <div className="bg-amber-600/10 border border-amber-500/25 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-500 leading-normal">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-[10px]">Google Channel Notice</p>
                    <p className="font-semibold text-slate-400 mt-1">{sendingError}</p>
                    <button
                      onClick={() => setActiveSegment('community')}
                      className="mt-2 text-[9px] font-black uppercase text-amber-400 hover:underline cursor-pointer tracking-wider"
                    >
                      Fallback with Spokane Peer Stream instead
                    </button>
                  </div>
                </div>
              )}

              {activeSegment === 'real' ? (
                // Google Chat spaces Messages Loop
                loadingMessages && spacesMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <span className="animate-spin inline-block w-8 h-8 border-4 border-slate-700 border-t-pink-500 rounded-full mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest">Streaming space conversations...</p>
                  </div>
                ) : spacesMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-30">
                    <MessageSquare size={36} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">Workspace Space Empty</p>
                      <p className="text-[10px] text-slate-400 mt-1">Submit your first event, progress stats update or habit shoutout below.</p>
                    </div>
                  </div>
                ) : (
                  spacesMessages.map((m, idx) => {
                    const isSystem = m.sender?.type === 'BOT';
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={m.name || idx} 
                        className="flex justify-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-xs text-pink-500 shrink-0 font-bold">
                          {isSystem ? '🤖' : '👤'}
                        </div>
                        <div className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-850 p-4 rounded-2xl text-slate-200 text-xs font-semibold max-w-[85%] space-y-1 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white">{m.sender?.displayName || 'Workspace Peer'}</span>
                            {isSystem && <span className="bg-pink-500/10 text-pink-400 text-[6.5px] px-1 py-0.5 rounded font-black font-mono">APP BOT</span>}
                            <span className="text-[7.5px] font-mono text-slate-500 font-bold">
                              {m.createTime ? new Date(m.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed break-words">{m.text}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )
              ) : (
                // Local Simulated Peer Group Stream
                localMessages.map((m) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1 }}
                    key={m.id} 
                    className="flex justify-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm shrink-0">
                      {m.avatar}
                    </div>
                    <div className="bg-slate-850/40 hover:bg-slate-850/70 border border-slate-805/80 p-4 rounded-2xl text-slate-200 text-xs font-semibold max-w-[85%] space-y-1.5 transition-all">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-200 uppercase tracking-wide text-[10px]">{m.sender}</span>
                          <span className="text-[7.5px] font-mono text-slate-500 font-bold">{m.timestamp}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[6.5px] font-black uppercase tracking-wider ${
                          m.tag === 'Milestone' ? 'bg-emerald-500/10 text-emerald-400' :
                          m.tag === 'Habit' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal pr-4">{m.message}</p>
                    </div>
                  </motion.div>
                ))
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Trigger Container */}
            <form 
              onSubmit={handleSendMessage} 
              className="p-5 bg-slate-950/95 border-t border-slate-800 flex gap-2"
            >
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  activeSegment === 'real' 
                    ? `Post update to official space ${selectedSpace?.displayName || ''}...`
                    : 'Add encouraging peer feedback...'
                }
                className="flex-grow bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-blue-500 transition-all text-white placeholder-slate-600 font-semibold"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className={`p-3.5 rounded-2xl text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                  activeSegment === 'real' 
                    ? 'bg-pink-600 hover:bg-pink-500 disabled:bg-slate-800' 
                    : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800'
                }`}
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
