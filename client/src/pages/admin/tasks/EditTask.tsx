import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import TaskForm from '../../../components/dashboard/TaskForm';
import { ArrowLeft } from 'lucide-react';
import { isAdminRole } from '../../../utils/roles';

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

    //FETCH: Task details + user details + all users (calls: GET /api/tasks/:id, GET /api/auth/me, GET /api/users)
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

                const [usersRes, meRes, taskRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/users', config),
                    axios.get('http://localhost:8000/api/auth/me', config),
                    axios.get(`http://localhost:8000/api/tasks/${id}`, config)
                ]);

                const usersData = Array.isArray(usersRes.data)
                    ? usersRes.data
                    : (usersRes.data?.data as User[] | undefined) || [];
                setUsers(usersData);
                setCurrentUser(meRes.data);
                
                if (!isAdminRole(meRes.data.role)) {
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
                    navigate('/login');
                } else {
                    console.error(err);
                    toast.error('Failed to load data.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, id]);

    //HANDLER: Form submit (calls: PUT /api/tasks/:id)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
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
            toast.success('Task updated successfully');
            navigate('/admin/tasks');
        } catch (err) {
            console.error('Error updating task:', err);
             const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to update task.';
            toast.error(message || 'Failed to update task.');
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <DashboardLayout user={currentUser} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/login');
        }}>
            <div className="p-8 font-sans">
                 <div className="max-w-7xl mx-auto">
                    <main className="max-w-2xl mx-auto py-8">
                        <div className="flex items-center justify-between mb-6">
                             <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
                             <button
                                onClick={() => navigate('/admin/tasks')}
                                type="button"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>

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
