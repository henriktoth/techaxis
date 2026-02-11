import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { User } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UserForm from '../components/dashboard/UserForm';
import { ArrowLeft } from 'lucide-react';

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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/admin/login');
                return;
            }

            try {
                const res = await axios.get('http://localhost:8000/api/auth/me', {
                     headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUser(res.data);
                 if (res.data.role !== 'ADMIN') {
                     navigate('/admin/dashboard');
                }
            } catch (err) {
                 if (axios.isAxiosError(err) && err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/admin/login');
                } else {
                    navigate('/admin/dashboard');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.post('http://localhost:8000/api/users', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/admin/users');
        } catch (err) {
            console.error('Error creating user:', err);
             const message = axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to create user.';
            setError(message || 'Failed to create user.');
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
                         <button 
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Users
                        </button>

                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h1>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}

                        <UserForm 
                            formData={formData}
                            setFormData={setFormData}
                            isEditing={false}
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

export default CreateUser;
