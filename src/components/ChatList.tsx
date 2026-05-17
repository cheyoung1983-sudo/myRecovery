import React from 'react';
import { motion } from 'motion/react';
import { ChatSession, Sponsor } from '../types';
import { MessageSquare, ChevronRight, User, Clock } from 'lucide-react';
import { NativeAd } from './NativeAd';

interface ChatListProps {
  chats: (ChatSession & { sponsor?: Sponsor, userName?: string, mentorName?: string })[];
  onSelectChat: (chatId: string) => void;
  currentUserId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, onSelectChat, currentUserId }) => {
  return (
    <div className="space-y-6" id="chat-list-view">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase italic">Your Messages.</h2>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Direct support conversations</p>
      </div>

      {chats.length === 0 ? (
        <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2.5rem] py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
            <MessageSquare size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold uppercase tracking-widest text-sm">No conversations yet.</h3>
            <p className="text-slate-500 text-xs font-medium">Connect with mentors to start a support chat.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => {
            const partnerName = chat.userId === currentUserId ? (chat.mentorName || 'Mentor') : (chat.userName || 'Client');
            
            // Check for unread
            const myLastRead = chat.lastRead?.[currentUserId || ''];
            const lastMsg = chat.lastMessageAt;
            const isUnread = lastMsg && (!myLastRead || (lastMsg.seconds > myLastRead.seconds));

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-6 rounded-[2rem] border transition-all group flex items-center justify-between ${
                  isUnread 
                    ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/20' 
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl uppercase italic relative ${
                    isUnread ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-500'
                  }`}>
                    {partnerName[0]}
                    {isUnread && (
                       <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-[#0f172a] animate-bounce" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                      {partnerName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <Clock size={12} />
                      {chat.lastMessageAt ? new Date(chat.lastMessageAt?.seconds * 1000).toLocaleDateString() : 'New chat'}
                      {isUnread && <span className="text-blue-500 ml-2">New Message</span>}
                    </div>
                  </div>
                </div>
                <div className={`p-3 rounded-xl transition-all ${isUnread ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-600 group-hover:bg-slate-700'}`}>
                  <ChevronRight size={20} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <NativeAd />
    </div>
  );
};
