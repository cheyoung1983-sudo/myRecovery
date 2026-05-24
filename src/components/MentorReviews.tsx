import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { MentorReview } from '../types';
import { Star, Send, Trash2, User, Award } from 'lucide-react';

interface MentorReviewsProps {
  mentorId: string;
}

export const MentorReviews: React.FC<MentorReviewsProps> = ({ mentorId }) => {
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mentorId) return;

    const q = query(
      collection(db, `sponsors/${mentorId}/reviews`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MentorReview[];
      setReviews(revs);
      setLoading(false);
    }, (error) => {
      // Handle the case where the parent document might not exist yet or permissions are tight
      console.error("Mentor reviews error:", error);
      handleFirestoreError(error, OperationType.GET, `sponsors/${mentorId}/reviews`);
    });

    return () => unsubscribe();
  }, [mentorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim()) return;

    try {
      await addDoc(collection(db, `sponsors/${mentorId}/reviews`), {
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
      await deleteDoc(doc(db, `sponsors/${mentorId}/reviews`, reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <div className="space-y-6" id="mentor-reviews-view">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Award className="text-blue-500" size={16} />
          Mentor Feedback.
        </h3>
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
          {reviews.length} total
        </div>
      </div>

      {auth.currentUser ? (
        (auth.currentUser.emailVerified || true) ? (
          <form onSubmit={handleSubmit} className="bg-slate-900/30 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform active:scale-110"
                >
                  <Star 
                    size={18} 
                    className={star <= rating ? "text-amber-400" : "text-slate-700"}
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
              <span className="text-[10px] text-slate-500 font-black ml-2 uppercase tracking-widest">Rate Mentor</span>
            </div>
            
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tell others about your experience with this mentor..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-medium text-white focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="absolute bottom-3 right-3 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
              Email verification required to submit reviews.
            </p>
          </div>
        )
      ) : null}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <div className="flex shrink-0">
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
                
                {auth.currentUser?.uid === review.userId && (
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="p-1 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-slate-400 text-[11px] leading-tight font-medium italic">"{review.comment}"</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{review.userName}</span>
                {review.timestamp && (
                  <span className="text-[9px] font-bold text-slate-700">
                    {new Date(review.timestamp?.seconds * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && reviews.length === 0 && (
          <div className="text-center py-8 bg-slate-900/10 rounded-2xl border border-slate-800/40">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">No mentor reviews yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
