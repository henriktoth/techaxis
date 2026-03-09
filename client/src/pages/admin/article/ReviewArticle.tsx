import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { Article, Category, User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

const ReviewArticle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [article, setArticle] = useState<Article | null>(null);
    const [author, setAuthor] = useState<User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showSchedulePanel, setShowSchedulePanel] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    //FETCH: Article details + user details + categories (calls: GET /api/articles/:id, GET /api/auth/me, GET /api/categories)
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin/login');
                return;
            }

            try {
                const config = {
                  headers: { Authorization: `Bearer ${token}` }
                };

                const userRes = await axios.get('http://localhost:8000/api/auth/me', config);
                const user = userRes.data;
                setCurrentUser(user);

                if (user.role !== 'ADMIN') {
                    setError('Access denied. Only admins can review articles.');
                    setIsLoading(false);
                    return;
                }

                const articleRes = await axios.get(`http://localhost:8000/api/articles/me/${id}`, config);
                const articleData = articleRes.data;

                if (articleData.status === 'DRAFT') {
                    setError('Cannot review articles that are still in draft.');
                    setIsLoading(false);
                    return;
                }

                if (articleData.authorId === user.id) {
                    setError('You cannot review your own articles.');
                    setIsLoading(false);
                    return;
                }

                setArticle(articleData);

                const [authorRes, categoryRes] = await Promise.all([
                    axios.get(`http://localhost:8000/api/users/${articleData.authorId}`, config),
                    axios.get(`http://localhost:8000/api/categories/${articleData.categoryId}`, config)
                ]);

                setAuthor(authorRes.data);
                setCategory(categoryRes.data);

            } catch (err) {
                console.error('Error fetching review data:', err);
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/admin/login');
                    } else if (err.response?.status === 404) {
                        setError('Article not found.');
                    } else {
                        setError('Failed to load article data.');
                    }
                } else {
                    setError('Failed to load article data.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, navigate]);

    const handleReview = async (status: 'PUBLISHED' | 'REJECTED', scheduleDate?: string) => {
        if (status === 'REJECTED' && !rejectionReason.trim()) {
            setShowRejectModal(true);
            return;
        } else if (status !== 'REJECTED' && !scheduleDate) {
            if (!window.confirm(`Are you sure you want to publish this article right now?`)) return;
        }

        setProcessing(true);
        const token = localStorage.getItem('token');
        
        try {
            const payload: { status: string; rejectionReason?: string | null; scheduledAt?: string } = { status, rejectionReason: status === 'REJECTED' ? rejectionReason : null };
            if (scheduleDate) {
                payload.scheduledAt = new Date(scheduleDate).toISOString();
            }

            await axios.patch(`http://localhost:8000/api/articles/${id}/review`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(
                scheduleDate
                    ? `Article scheduled for ${new Date(scheduleDate).toLocaleString()}`
                    : `Article ${status === 'PUBLISHED' ? 'published' : 'rejected'} successfully`
            );
            setShowRejectModal(false);
            setRejectionReason('');
            navigate('/admin/dashboard');
        } catch (err) {
            console.error('Error reviewing article:', err);
            const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to submit review.';
            toast.error(message);
            setProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <DashboardLayout user={currentUser} onLogout={() => {
                localStorage.removeItem('token');
                navigate('/admin/login');
            }}>
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="text-red-500 mb-4">{error}</div>
                    <button 
                        onClick={() => navigate('/admin/dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <>
        <DashboardLayout user={currentUser} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }}>
            <div className="p-8 font-sans pt-24">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex items-center justify-between pr-8">
                        <h1 className="text-2xl font-bold text-gray-900">Review Article</h1>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            type="button"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-8 space-y-8">
                        {/* Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500 border-b border-gray-100 pb-6">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Author:</span> 
                                <span className="bg-gray-50 px-2 py-1 rounded-md text-gray-700">{author?.name}</span>
                                <span className="text-gray-400">({author?.email})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Category:</span>
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{category?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Status:</span> 
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${article.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
                                      article.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                      article.status === 'REVIEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      article.status === 'SCHEDULED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                      'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {article.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Slug:</span>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{article.slug}</span>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{article.title}</h2>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Summary</h3>
                            <p className="text-gray-600 leading-relaxed text-lg">{article.summary}</p>
                        </div>

                        {/* Thumbnail */}
                        {article.thumbnail && (
                             <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Thumbnail</h3>
                                <img src={article.thumbnail} alt="Article Thumbnail" className="max-w-2xl w-full h-auto rounded-xl shadow-sm ring-1 ring-gray-900/5 object-cover" />
                             </div>
                        )}


                        {/* Content */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Content</h3>
                            <div className="prose prose-gray max-w-none p-8 rounded-xl bg-white ring-1 ring-gray-200 shadow-sm whitespace-pre-wrap font-sans text-base leading-relaxed">
                                {article.content}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-gray-100 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 -mx-6 -mb-6 rounded-b-xl border-x-0 space-y-4">
                            {showSchedulePanel && (
                                <div className="flex items-end gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex-1">
                                        <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1">
                                            Schedule publish date & time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="scheduledAt"
                                            value={scheduledAt}
                                            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                                            onChange={(e) => setScheduledAt(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!scheduledAt) {
                                                toast.error('Please select a date and time');
                                                return;
                                            }
                                            if (new Date(scheduledAt) <= new Date()) {
                                                toast.error('Scheduled time must be in the future');
                                                return;
                                            }
                                            handleReview('PUBLISHED', scheduledAt);
                                        }}
                                        disabled={processing || !scheduledAt}
                                        className="px-6 py-2.5 rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {processing ? 'Scheduling...' : 'Confirm Schedule'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowSchedulePanel(false); setScheduledAt(''); }}
                                        className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Processing...' : 'Reject Article'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowSchedulePanel(!showSchedulePanel)}
                                    disabled={processing || article.status === 'PUBLISHED'}
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Schedule Publish
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReview('PUBLISHED')}
                                    disabled={processing || article.status === 'PUBLISHED'}
                                    className="px-6 py-2.5 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md"
                                >
                                    {processing ? 'Processing...' : article.status === 'PUBLISHED' ? 'Already Published' : 'Publish Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>

        {/* Rejection Modal */}
        {showRejectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/50" onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Reject Article</h3>
                    <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this article. The author will be able to see this feedback.</p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        rows={4}
                        autoFocus
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!rejectionReason.trim() || processing}
                            onClick={() => handleReview('REJECTED')}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? 'Rejecting...' : 'Reject Article'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default ReviewArticle;
