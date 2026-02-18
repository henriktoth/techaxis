import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { User, Task } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import TaskForm from '../components/dashboard/TaskForm';
import { ArrowLeft } from 'lucide-react';

const EditTask = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 0,
        dueDate: '',
        assignedToId: "" as number | ""
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

                const [usersRes, meRes, taskRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/users', config),
                    axios.get('http://localhost:8000/api/auth/me', config),
                    axios.get(`http://localhost:8000/api/tasks/${id}`, config)
                ]);

                setUsers(usersRes.data);
                setCurrentUser(meRes.data);
                
                if (meRes.data.role !== 'ADMIN') {
                     navigate('/admin/dashboard');
                     return;
                }

                const task = taskRes.data;
                setFormData({
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                    assignedToId: task.assignedToId || ""
                });

            } catch (err) {
                 if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/admin/login');
                } else {
                    console.error(err);
                    setError('Failed to load data.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.put(`http://localhost:8000/api/tasks/${id}`, {
                ...formData,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                assignedToId: formData.assignedToId ? Number(formData.assignedToId) : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/admin/tasks');
        } catch (err) {
            console.error('Error updating task:', err);
             const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to update task.';
            setError(message || 'Failed to update task.');
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <DashboardLayout user={currentUser} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }}>
            <div className="p-8 font-sans">
                 <div className="max-w-7xl mx-auto">
                    <main className="max-w-2xl mx-auto py-8">
                         <button 
                            onClick={() => navigate('/admin/tasks')}
                            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Tasks
                        </button>

                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Task</h1>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}

                        <TaskForm
                            formData={formData}
                            setFormData={setFormData}
                            users={users}
                            onSubmit={handleSubmit}
                            onCancel={() => navigate('/admin/tasks')}
                            submitText="Save Changes"
                        />
                    </main>
                 </div>
            </div>
        </DashboardLayout>
    );
};

export default EditTask;
