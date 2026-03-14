import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserForm from '../../../components/dashboard/UserForm';
import { ArrowLeft } from 'lucide-react';
import { isAdminRole } from '../../../utils/roles';

const CreateUser = () => {
    const navigate = useNavigate();
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'WRITER' as User['role']
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    //FETCH: User details (calls: GET /api/auth/me)
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await axios.get('http://localhost:8000/api/auth/me', {
                     headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUser(res.data);
                 if (!isAdminRole(res.data.role)) {
                     navigate('/admin/dashboard');
                }
            } catch (err) {
                 if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    navigate('/admin/dashboard');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    //HANDLER: Form submit (calls: POST /api/users)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.post('http://localhost:8000/api/users', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('User created successfully');
            navigate('/admin/users');
        } catch (err) {
            console.error('Error creating user:', err);
             const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to create user.';
            toast.error(message || 'Failed to create user.');
            setSaving(false);
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
                            <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
                            <button
                                onClick={() => navigate('/admin/users')}
                                type="button"
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>

                        <UserForm
                            formData={formData}
                            setFormData={setFormData}
                            isEditing={false}
                            saving={saving}
                            onSubmit={handleSubmit}
                            onCancel={() => navigate('/admin/users')}
                            currentUserRole={currentUser?.role}
                        />
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CreateUser;
