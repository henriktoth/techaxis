import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { Article, Category, User, Task } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import ArticleForm from '../../../components/dashboard/ArticleForm';
import ArticlePreviewModal from '../../../components/dashboard/ArticlePreviewModal';
import { isAdminRole } from '../../../utils/roles';
import { generateSlug } from '../../../utils/slug';

interface CreateArticleFormData {
    title: string;
    summary: string;
    content: string;
    contentDelta?: Record<string, unknown> | null;
    thumbnail: string;
    categoryId: number;
    status: Article['status'];
    isFeatured: boolean;
    taskId?: number | null;
    scheduledAt?: string;
}

const CreateArticle = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const taskIdParam = searchParams.get('taskId');

    const [formData, setFormData] = useState<CreateArticleFormData>({
        title: '',
        summary: '',
        content: '',
        contentDelta: null,
        thumbnail: '',
        categoryId: 0,
        status: 'DRAFT',
        isFeatured: false,
        taskId: taskIdParam ? Number(taskIdParam) : null,
        scheduledAt: ''
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
    const [removeThumbnail, setRemoveThumbnail] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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

                const [userRes, categoriesRes, tasksRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/auth/me', config),
                    axios.get('http://localhost:8000/api/categories', config),
                    axios.get('http://localhost:8000/api/tasks', config)
                ]);

                setUser(userRes.data);
                setCategories(categoriesRes.data);

                const tasks = Array.isArray(tasksRes.data)
                    ? (tasksRes.data as Task[])
                    : (tasksRes.data?.data as Task[] | undefined) || [];
                const filteredTasks = tasks.filter(t => (!t.article && !t.isCompleted) || t.id === Number(taskIdParam));
                setAvailableTasks(filteredTasks);

            } catch (err) {
                console.error('Error fetching data:', err);
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/login');
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
    }, [navigate, taskIdParam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const token = localStorage.getItem('token');
        if (!token) {
            setSaving(false);
            navigate('/login');
            return;
        }

        try {
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('summary', formData.summary);
            payload.append('content', formData.content);
            if (formData.contentDelta) {
                payload.append('contentDelta', JSON.stringify(formData.contentDelta));
            }
            payload.append('categoryId', String(formData.categoryId));
            payload.append('status', formData.status);
            if (isAdminRole(user?.role)) {
                payload.append('isFeatured', String(formData.isFeatured));
            }
            if (formData.taskId) {
                payload.append('taskId', String(formData.taskId));
            }
            if (thumbnailFile) {
                payload.append('thumbnail', thumbnailFile);
            }
            if (formData.scheduledAt) {
                payload.append('scheduledAt', new Date(formData.scheduledAt).toISOString());
            }

            await axios.post('http://localhost:8000/api/articles', payload, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Article created successfully');
            if(formData.taskId) {
                navigate('/admin/tasks');
            } else {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            console.error('Error creating article:', err);
            const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to create article.';
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
            navigate('/login');
        }}>
            <div className="p-8 font-sans">
                <div className="max-w-7xl mx-auto">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <ArticleForm
                        formData={formData}
                        setFormData={setFormData}
                        thumbnailFile={thumbnailFile}
                        setThumbnailFile={setThumbnailFile}
                        removeThumbnail={removeThumbnail}
                        setRemoveThumbnail={setRemoveThumbnail}
                        categories={categories}
                        tasks={availableTasks}
                        user={user}
                        slug={undefined}
                        saving={saving}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/admin/dashboard')}
                        isOwnArticle={true}
                        pageTitle="Create New Article"
                        onPreview={() => setShowPreview(true)}
                        thumbnailPreviewUrl={thumbnailPreviewUrl}
                        setThumbnailPreviewUrl={setThumbnailPreviewUrl}
                    />
                </div>
            </div>

            {showPreview && (
                <ArticlePreviewModal
                    article={{
                        id: 0,
                        slug: generateSlug(formData.title),
                        title: formData.title || 'Untitled Article',
                        summary: formData.summary,
                        content: formData.content,
                        contentDelta: formData.contentDelta,
                        thumbnail: thumbnailPreviewUrl
                            || (formData.thumbnail && !removeThumbnail ? formData.thumbnail : null),
                        status: formData.status,
                        isFeatured: formData.isFeatured,
                        publishedAt: null,
                        categoryId: formData.categoryId,
                        author: user ? { id: user.id, name: user.name } : undefined,
                    }}
                    categoryName={categories.find(c => c.id === formData.categoryId)?.name}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </DashboardLayout>
    );
};

export default CreateArticle;
