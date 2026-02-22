import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserForm from '../../../components/dashboard/UserForm';
import { ArrowLeft } from 'lucide-react';

const EditUser = () => {
    const { id } = useParams<{ id: string }>();
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

    //FETCH: User details + user details (calls: GET /api/users/:id, GET /api/auth/me)
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin/login');
                return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                const meRes = await axios.get('http://localhost:8000/api/auth/me', config);
                setCurrentUser(meRes.data);
                if (meRes.data.role !== 'ADMIN') {
                     navigate('/admin/dashboard');
                     return;
                }

                const userRes = await axios.get(`http://localhost:8000/api/users/${id}`, config);
                setFormData({
                    name: userRes.data.name,
                    email: userRes.data.email,
                    password: '',
                    role: userRes.data.role
                });

            } catch (err) {
                 if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/admin/login');
                } else {
                    toast.error('Failed to load user data.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchData();
    }, [id, navigate]);

    //HANDLER: Form submit (calls: PUT /api/users/:id)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const payload: { name: string; email: string; role: string; password?: string } = {
                name: formData.name,
                email: formData.email,
                role: formData.role
            };
            if (formData.password) {
                payload.password = formData.password;
            }

            await axios.put(`http://localhost:8000/api/users/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('User updated successfully');
            navigate('/admin/users');
        } catch (err) {
            console.error('Error updating user:', err);
             const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to update user.';
            toast.error(message || 'Failed to update user.');
            setSaving(false);
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
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
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
                            isEditing={true}
                            saving={saving}
                            onSubmit={handleSubmit}
                            onCancel={() => navigate('/admin/users')}
                        />
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditUser;
