import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Article, Category, User } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';

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

                // Fetch article details (using the endpoint that returns works for admins for any article)
                // The endpoint /api/articles/me/:id works for admins to get ANY article by ID?
                // valid check: getArticleForUserById implementation in articleController.ts:
                // if (user.role === 'ADMIN') return res.status(200).json(article);
                const articleRes = await axios.get(`http://localhost:8000/api/articles/me/${id}`, config);
                const articleData = articleRes.data;
                setArticle(articleData);

                // Fetch author and category details
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

    const handleReview = async (status: 'PUBLISHED' | 'REJECTED') => {
        if (!window.confirm(`Are you sure you want to ${status === 'PUBLISHED' ? 'publish' : 'reject'} this article?`)) return;

        setProcessing(true);
        const token = localStorage.getItem('token');
        
        try {
            await axios.patch(`http://localhost:8000/api/articles/${id}/review`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/admin/dashboard');
        } catch (err) {
            console.error('Error reviewing article:', err);
            const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to submit review.';
            alert(message);
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

                    <div className="bg-white shadow rounded-lg p-6 space-y-6">
                        {/* Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 border-b pb-4">
                            <div>
                                <span className="font-semibold text-gray-700">Author:</span> {author?.name} ({author?.email})
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Category:</span> {category?.name}
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Status:</span> 
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                                      article.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                                      article.status === 'REVIEW' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                    {article.status}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Slug:</span> {article.slug}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                            <p className="text-gray-800">{article.summary}</p>
                        </div>

                        {/* Thumbnail */}
                        {article.thumbnail && (
                             <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Thumbnail</h3>
                                <img src={article.thumbnail} alt="Article Thumbnail" className="max-w-md h-auto rounded-md border" />
                             </div>
                        )}


                        {/* Content */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Content</h3>
                            <div className="prose max-w-none p-4 border rounded-md bg-gray-50 whitespace-pre-wrap font-mono text-sm">
                                {article.content}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => handleReview('REJECTED')}
                                disabled={processing}
                                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Reject Article'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleReview('PUBLISHED')}
                                disabled={processing}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Publish Article'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReviewArticle;
