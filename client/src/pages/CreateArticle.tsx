import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { Article, Category, User } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ArticleForm from '../components/dashboard/ArticleForm';

const CreateArticle = () => {
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

                const [userRes, categoriesRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/auth/me', config),
                    axios.get('http://localhost:8000/api/categories', config)
                ]);

                setUser(userRes.data);
                setCategories(categoriesRes.data);

            } catch (err) {
                console.error('Error fetching data:', err);
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/admin/login');
                    } else {
                        setError('Failed to load initial data.');
                    }
                } else {
                    setError('Failed to load initial data.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

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

            await axios.post('http://localhost:8000/api/articles', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Article created successfully');
            navigate('/admin/dashboard');
        } catch (err) {
            console.error('Error creating article:', err);
            const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to create article.';
            setError(message || 'Failed to create article.');
            toast.error(message || 'Failed to create article.');
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

    return (
        <DashboardLayout user={user} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }}>
            <div className="p-8 font-sans">
                <div className="max-w-7xl mx-auto">
                    <main className="max-w-4xl mx-auto py-8">
                        <div className="mb-6 flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
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
                            slug={undefined}
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

export default CreateArticle;
