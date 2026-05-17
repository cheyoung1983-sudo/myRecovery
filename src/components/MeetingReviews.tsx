import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Review } from '../types';
import { Star, Send, Trash2, User, MessageSquare } from 'lucide-react';

interface MeetingReviewsProps {
  meetingId: string;
}

export const MeetingReviews: React.FC<MeetingReviewsProps> = ({ meetingId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meetingId) return;

    const q = query(
      collection(db, `meetings/${meetingId}/reviews`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(revs);
      setLoading(false);
    }, (error) => {
      console.error("Meeting reviews error:", error);
      handleFirestoreError(error, OperationType.GET, `meetings/${meetingId}/reviews`);
    });

    return () => unsubscribe();
  }, [meetingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim()) return;

    try {
      await addDoc(collection(db, `meetings/${meetingId}/reviews`), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous User',
        rating,
        comment: newComment.trim(),
        timestamp: serverTimestamp()
      });
      setNewComment('');
      setRating(5);
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteDoc(doc(db, `meetings/${meetingId}/reviews`, reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <div className="space-y-6" id="meeting-reviews-view">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-2">
          <MessageSquare className="text-blue-500" size={20} />
          Reviews & Feedback.
        </h3>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {reviews.length} reviews
        </div>
      </div>

      {auth.currentUser && auth.currentUser.emailVerified ? (
        <form onSubmit={handleSubmit} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform active:scale-110"
              >
                <Star 
                  size={20} 
                  className={star <= rating ? "text-amber-400" : "text-slate-700"}
                  fill={star <= rating ? "currentColor" : "none"}
                />
              </button>
            ))}
            <span className="text-xs text-slate-500 font-bold ml-2 uppercase">Rate this meeting</span>
          </div>
          
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="How was the meeting? (format, vibe, attendance...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="absolute bottom-3 right-3 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      ) : auth.currentUser && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
            Email verification required to submit reviews.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800/20 border border-slate-800 p-6 rounded-3xl relative group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">{review.userName}</div>
                    <div className="flex mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={10} 
                          className={s <= review.rating ? "text-amber-400" : "text-slate-700"}
                          fill={s <= review.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {auth.currentUser?.uid === review.userId && (
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{review.comment}</p>
              {review.timestamp && (
                <div className="mt-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {new Date(review.timestamp?.seconds * 1000).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && reviews.length === 0 && (
          <div className="text-center py-12 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-slate-800">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">No reviews yet.</p>
            <p className="text-slate-600 text-xs mt-1">Be the first to share your experience.</p>
          </div>
        )}
      </div>
    </div>
  );
};
