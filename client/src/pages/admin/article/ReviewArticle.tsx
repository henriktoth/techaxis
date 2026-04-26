import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Eye } from 'lucide-react';
import type { Article, Category, User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { isAdminRole } from '../../../utils/roles';
import { resolveMediaUrl } from '../../../utils/media';

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
    const [scheduledAt, setScheduledAt] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const config = {
                  headers: { Authorization: `Bearer ${token}` }
                };

                const userRes = await axios.get('http://localhost:8000/api/auth/me', config);
                const user = userRes.data;
                setCurrentUser(user);

                if (!isAdminRole(user.role)) {
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
                        navigate('/login');
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

    const executeReview = async (status: 'PUBLISHED' | 'REJECTED', scheduleDate?: string) => {
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
            setShowPublishModal(false);
            setShowScheduleModal(false);
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
                navigate('/login');
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

    const statusStyles: Record<Article['status'], string> = {
        PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        DRAFT: 'bg-slate-50 text-slate-700 ring-slate-200',
        REVIEW: 'bg-blue-50 text-blue-700 ring-blue-200',
        SCHEDULED: 'bg-amber-50 text-amber-700 ring-amber-200',
        REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200'
    };

    const statusStyle = statusStyles[article.status];

    return (
        <>
        <DashboardLayout user={currentUser} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/login');
        }}>
            <div className="px-6 lg:px-10 py-8 pt-24">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                                    Editorial Review
                                </p>
                                <h1 className="text-3xl font-semibold text-gray-900">Review Article</h1>
                                <p className="text-sm text-gray-500 max-w-2xl">
                                    Validate content quality, check metadata, and decide the next publishing step.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle}`}>
                                    {article.status}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/article/preview/${article.id}`)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview Article
                                </button>
                                <button
                                    onClick={() => navigate('/admin/dashboard')}
                                    type="button"
                                    className="text-sm font-medium text-gray-500 hover:text-gray-800"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 space-y-4">
                                <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">{article.title}</h2>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                        {category?.name}
                                    </span>
                                    <span className="text-gray-400">By {author?.name}</span>
                                    {article.publishedAt && (
                                        <span>
                                            Published {new Date(article.publishedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Summary</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">{article.summary}</p>
                            </div>

                            {article.thumbnail && (
                                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Thumbnail</h3>
                                    <img
                                        src={resolveMediaUrl(article.thumbnail)}
                                        alt="Article Thumbnail"
                                        className="w-full h-auto rounded-xl shadow-sm ring-1 ring-gray-900/5 object-cover"
                                    />
                                </div>
                            )}

                            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Content</h3>
                                <div className="prose prose-gray max-w-none p-6 rounded-xl bg-gray-50 ring-1 ring-gray-200 shadow-sm font-sans text-base leading-relaxed ql-snow">
                                    <div className="ql-editor" dangerouslySetInnerHTML={{ __html: article.content }} />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
                            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Article Details</h3>
                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-gray-400">Author</span>
                                        <span className="text-right text-gray-800 font-medium">
                                            {author?.name}
                                            <span className="block text-xs text-gray-400">{author?.email}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-gray-400">Category</span>
                                        <span className="text-right font-medium text-gray-800">{category?.name}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-gray-400">Slug</span>
                                        <span className="text-right font-mono text-xs bg-gray-100 px-2 py-1 rounded">{article.slug}</span>
                                    </div>
                                    {article.createdAt && (
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-gray-400">Submitted</span>
                                            <span className="text-right font-medium text-gray-800">
                                                {new Date(article.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {article.scheduledAt && (
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-gray-400">Scheduled</span>
                                            <span className="text-right font-medium text-gray-800">
                                                {new Date(article.scheduledAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {article.rejectionReason && (
                                        <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                                            {article.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Review Actions</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={processing}
                                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Processing...' : 'Reject Article'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowScheduleModal(true)}
                                    disabled={processing || article.status === 'PUBLISHED'}
                                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Schedule Publish
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPublishModal(true)}
                                    disabled={processing || article.status === 'PUBLISHED'}
                                    className="w-full px-4 py-2.5 rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md"
                                >
                                    {processing ? 'Processing...' : article.status === 'PUBLISHED' ? 'Already Published' : 'Publish Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>

        {showPublishModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/50" onClick={() => setShowPublishModal(false)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Publish Article</h3>
                    <p className="text-sm text-gray-500 mb-4">Are you sure you want to publish this article right now? It will be immediately visible to all readers.</p>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setShowPublishModal(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => executeReview('PUBLISHED')}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? 'Publishing...' : 'Publish Now'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showScheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/50" onClick={() => { setShowScheduleModal(false); setScheduledAt(''); }} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Schedule Publication</h3>
                    <p className="text-sm text-gray-500 mb-4">Select a future date and time to automatically publish this article.</p>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                        <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1">
                            Publish date & time
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
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setShowScheduleModal(false); setScheduledAt(''); }}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={processing || !scheduledAt}
                            onClick={() => {
                                if (new Date(scheduledAt) <= new Date()) {
                                    toast.error('Scheduled time must be in the future');
                                    return;
                                }
                                executeReview('PUBLISHED', scheduledAt);
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? 'Scheduling...' : 'Confirm Schedule'}
                        </button>
                    </div>
                </div>
            </div>
        )}

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
                            onClick={() => executeReview('REJECTED')}
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
