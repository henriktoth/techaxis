import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, Trash2, MessageSquare, AlertTriangle } from 'lucide-react';
import type { User, Comment, PaginatedResult } from '../../types';
import Pagination from '../../components/shared/Pagination';

interface CommentSectionProps {
  articleId: number;
  user: User | null;
}

const CommentSection = ({ articleId, user }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<PaginatedResult<Comment>>(`http://localhost:8000/api/comments/article/${articleId}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      setComments(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  }, [articleId, currentPage]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post<Comment>(
        'http://localhost:8000/api/comments',
        { articleId, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewComment('');
      setCurrentPage(1);
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment', err);
      setSubmitError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId: number) => {
    setShowDeleteModal(commentId);
  };

  const confirmDelete = async () => {
    if (!showDeleteModal) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/comments/${showDeleteModal}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      fetchComments();
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(null);
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && comments.length === 0 && currentPage === 1) {
    return (
      <div className="mt-12 py-12 text-center text-slate-500 animate-pulse border-t border-white/5">
        Loading discussion...
      </div>
    );
  }

  return (
    <div className="mt-16 border-t border-white/10 pt-12 max-w-3xl mx-auto px-4 sm:px-6 relative">

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1f2937] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">Delete Comment?</h3>
              <p className="text-slate-400 text-sm mb-6">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <h3 className="text-2xl font-bold text-slate-200">
          Discussion
        </h3>
      </div>
      
      {user ? (
        <form onSubmit={handleSubmit} className="mb-12 relative group">
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#111827] p-6 rounded-xl border border-white/10 shadow-lg glow-border">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0 border border-indigo-500/20 font-mono">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What are your thoughts?"
                  rows={3}
                  className="w-full bg-black/20 text-slate-200 p-3 rounded-lg border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-slate-600 resize-none"
                  disabled={submitting}
                />
                
                <div className="mt-3 flex items-center justify-between">
                  {submitError && (
                    <p className="text-red-400 text-sm">{submitError}</p>
                  )}
                  <div className="flex-1" />
                  <button 
                    type="submit" 
                    disabled={submitting || !newComment.trim()}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm transition-all shadow-lg shadow-indigo-900/20"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </span>
                    ) : (
                      <>
                        <Send size={16} /> 
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-12 relative overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 to-purple-500/5" />
          <div className="relative p-8 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <MessageSquare size={24} />
            </div>
            <h4 className="text-lg font-semibold text-slate-200 mb-2">Join the conversation</h4>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Sign in to share your thoughts, ask questions, and connect with our community.
            </p>
            <a 
              href="/login" 
              className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20 text-sm"
            >
              Sign In to Comment
            </a>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-white/10 bg-white/5">
            <p className="text-slate-400 font-medium">No comments yet</p>
            <p className="text-slate-500 text-sm mt-1">Be the first to share your perspective!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = user?.id === comment.authorId;
            const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
            const canDelete = isAuthor || isAdmin;

            return (
              <div key={comment.id} className="group relative pl-4 transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/5 group-hover:bg-white/10 transition-colors rounded-full" />
                
                <div className="flex gap-4 py-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-slate-400 font-medium text-sm">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-200 text-sm">
                          {comment.author.name}
                        </span>
                        
                        {comment.author.role !== 'READER' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            comment.author.role === 'ADMIN' || comment.author.role === 'SUPERADMIN'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {comment.author.role}
                          </span>
                        )}
                        
                        <span className="text-slate-500 text-xs">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>

                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-md hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete comment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CommentSection;
