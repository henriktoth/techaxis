import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Article, Category, User } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ArticleForm from '../components/dashboard/ArticleForm';

const EditArticle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        thumbnail: '',
        categoryId: 0,
        status: 'DRAFT' as Article['status'],
        isFeatured: false
    });
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [originalArticle, setOriginalArticle] = useState<Article | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
                const currentUser = userRes.data;
                setUser(currentUser);

                const [categoriesRes, articleRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/categories', config),
                    axios.get(`http://localhost:8000/api/articles/me/${id}`, config)
                ]);

                setCategories(categoriesRes.data);
                
                const article = articleRes.data;
                setOriginalArticle(article);
                
                setFormData({
                    title: article.title,
                    summary: article.summary || '',
                    content: article.content,
                    thumbnail: article.thumbnail || '',
                    categoryId: article.categoryId,
                    status: article.status,
                    isFeatured: article.isFeatured
                });

            } catch (err) {
                console.error('Error fetching data:', err);
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/admin/login');
                    } else if (err.response?.status === 403) {
                        setError('You do not have permission to edit this article.');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/admin/login');
            return;
        }

        try {
            const payload = {
                title: formData.title,
                summary: formData.summary,
                content: formData.content,
                thumbnail: formData.thumbnail || null,
                categoryId: Number(formData.categoryId),
                status: formData.status,
                ...(user?.role === 'ADMIN' && { isFeatured: formData.isFeatured }),
            };

            await axios.put(`http://localhost:8000/api/articles/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            navigate('/admin/dashboard');
        } catch (err) {
            console.error('Error updating article:', err);
            const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to update article.';
            setError(message || 'Failed to update article.');
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (error && !originalArticle) {
        return (
            <DashboardLayout user={user} onLogout={() => {
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
        <DashboardLayout user={user} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }}>
            <div className="p-8 font-sans">
                <div className="max-w-7xl mx-auto">
                    <main className="max-w-4xl mx-auto py-8">
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                type="button"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}

                        <ArticleForm 
                            formData={formData}
                            setFormData={setFormData}
                            categories={categories}
                            user={user}
                            slug={originalArticle?.slug}
                            saving={saving}
                            onSubmit={handleSubmit}
                            onCancel={() => navigate('/admin/dashboard')}
                        />
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditArticle;
