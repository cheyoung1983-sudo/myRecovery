import React from 'react';
import { motion } from 'motion/react';
import { ChatSession, Sponsor } from '../types';
import { MessageSquare, ChevronRight, User, Clock } from 'lucide-react';

interface ChatListProps {
  chats: (ChatSession & { sponsor?: Sponsor })[];
  onSelectChat: (chatId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, onSelectChat }) => {
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
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="w-full text-left bg-slate-800/40 border border-slate-800 p-6 rounded-[2rem] hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 font-bold text-xl uppercase italic">
                  {chat.sponsor?.name[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{chat.sponsor?.name || 'Unknown Mentor'}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <Clock size={12} />
                    {chat.lastMessageAt ? new Date(chat.lastMessageAt?.seconds * 1000).toLocaleDateString() : 'New chat'}
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-600">
                <ChevronRight size={20} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
