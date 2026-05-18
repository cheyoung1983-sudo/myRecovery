
import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc, increment, setDoc } from 'firebase/firestore';
import { NeighborhoodAnnouncement, NeighborhoodPost, UserProfile } from '../types';
import { Bell, Info, AlertTriangle, MapPin, Send, Heart, UserPlus, Flag, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReportModal } from './ReportModal';

interface NeighborhoodFeedProps {
  neighborhood: string;
  userId: string;
  userProfile: UserProfile | null;
  onShowToast?: (msg: string, type: 'success' | 'alert' | 'info') => void;
}

export const NeighborhoodFeed: React.FC<NeighborhoodFeedProps> = ({ neighborhood, userId, userProfile, onShowToast }) => {
  const [announcements, setAnnouncements] = useState<NeighborhoodAnnouncement[]>([]);
  const [posts, setPosts] = useState<NeighborhoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [reportingPost, setReportingPost] = useState<NeighborhoodPost | null>(null);

  useEffect(() => {
    // Announcements (Admin)
    const qAnn = query(
      collection(db, 'neighborhoodAnnouncements'),
      where('neighborhood', '==', neighborhood),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    // User Posts (Exclude reported ones if I had a hide system, but for now just show)
    const qPost = query(
      collection(db, 'neighborhoodPosts'),
      where('neighborhood', '==', neighborhood),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    const unsubAnn = onSnapshot(qAnn, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NeighborhoodAnnouncement)));
    });

    const unsubPost = onSnapshot(qPost, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NeighborhoodPost)));
      setLoading(false);
    });

    return () => {
      unsubAnn();
      unsubPost();
    };
  }, [neighborhood]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'neighborhoodPosts'), {
        neighborhood,
        userId,
        userName: userProfile?.name || 'Someone',
        content: newPost,
        createdAt: serverTimestamp(),
        supportCount: 0,
        reportCount: 0,
        isNewcomer: (userProfile?.points || 0) < 100
      });
      setNewPost('');
      onShowToast?.("Post shared with neighbors", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'neighborhoodPosts');
    } finally {
      setPosting(false);
    }
  };

  const handleSupport = async (post: NeighborhoodPost) => {
    if (post.userId === userId) return;
    try {
      const supportRef = doc(db, 'neighborhoodPosts', post.id, 'supports', userId);
      await setDoc(supportRef, { timestamp: serverTimestamp() });
      await updateDoc(doc(db, 'neighborhoodPosts', post.id), {
        supportCount: increment(1)
      });

      // Award points to the supporter for helping
      await updateDoc(doc(db, 'users', userId), {
        points: increment(5)
      });
    } catch (err) {
      console.error("Support failed", err);
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-slate-800/50 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black text-white italic flex items-center gap-2 uppercase tracking-tight">
          <MapPin size={20} className="text-blue-500" /> {neighborhood} Hub
        </h3>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className={`p-4 rounded-2xl border ${ann.type === 'alert' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-800/30 border-slate-800'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${ann.type === 'alert' ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {ann.type === 'alert' ? <AlertTriangle size={14} /> : <Bell size={14} />}
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Creator */}
      <form onSubmit={handleCreatePost} className="relative">
        <input 
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Ask a question or offer support..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-blue-500 pr-12 transition-all"
        />
        <button 
          type="submit"
          disabled={posting || !newPost.trim()}
          className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Community Posts */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-slate-800 p-5 rounded-[2rem] space-y-3 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-white uppercase italic">{post.userName}</span>
                  {post.isNewcomer && (
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded-md flex items-center gap-1">
                      <UserPlus size={8} /> Newcomer
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest hidden sm:block">
                    {new Date(post.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => setReportingPost(post)}
                    className="p-1.5 text-slate-700 hover:text-rose-500 transition-colors rounded-lg bg-black/20 opacity-0 group-hover:opacity-100"
                  >
                    <Flag size={12} />
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed font-medium">{post.content}</p>

              <div className="flex items-center gap-3 pt-1">
                <button 
                  onClick={() => handleSupport(post)}
                  disabled={post.userId === userId}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors disabled:opacity-30"
                >
                  <Heart size={12} className={post.supportCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                  {post.supportCount} Supports
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ReportModal
        isOpen={!!reportingPost}
        onClose={() => setReportingPost(null)}
        targetId={reportingPost?.id || ''}
        targetType="post"
        targetOwnerId={reportingPost?.userId}
        onSuccess={(msg) => onShowToast?.(msg, 'success')}
      />
    </div>
  );
};

