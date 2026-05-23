import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  MessageCircle, 
  Send 
} from 'lucide-react';
import { ChatSession, Message } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

export const ChatView = ({ session, messages, currentUser, onBack, onSendMessage, onTyping }: { 
  session: ChatSession, 
  messages: Message[], 
  currentUser: FirebaseUser | null,
  onBack: () => void,
  onSendMessage: (text: string) => void,
  onTyping: (isTyping: boolean) => void
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] flex flex-col h-[70vh] overflow-hidden shadow-2xl relative">
       <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0f172a]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><ArrowLeft size={20}/></button>
            <div>
              <h3 className="font-bold text-white leading-none mb-1">
                {currentUser?.uid === session.userId ? session.mentorName : session.userName}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-blue-500" /> Peer Support Connection
              </p>
            </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-30">
               <MessageCircle size={48} />
               <p className="text-sm font-medium">Say hi to start your support journey.</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isOwn = m.senderId === currentUser?.uid;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={m.id || idx} 
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${isOwn ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                    {m.text}
                    {m.timestamp && (
                      <p className={`text-[8px] mt-1 font-bold ${isOwn ? 'text-blue-200' : 'text-slate-500'}`}>
                        {(m.timestamp as any)?.toDate?.() ? (m.timestamp as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
       </div>

       <form onSubmit={handleSend} className="p-6 bg-[#0f172a]/95 border-t border-slate-800 flex gap-2">
          <input 
            type="text" 
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping(true);
            }}
            onBlur={() => onTyping(false)}
            placeholder="Write a message..."
            className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
          />
          <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg active:scale-95">
            <Send size={20} />
          </button>
       </form>
    </div>
  );
};
