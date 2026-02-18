import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserTable from '../../../components/dashboard/UserTable';
import { UserPlus } from 'lucide-react';

const Users = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    //FETCH: User details + all users (calls: GET /api/auth/me, GET /api/users)
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
                setCurrentUser(userRes.data);

                if (userRes.data.role !== 'ADMIN') {
                     navigate('/admin/dashboard');
                     return;
                }

                const usersRes = await axios.get('http://localhost:8000/api/users', config);
                setUsers(usersRes.data);

            } catch (err) {
                console.error('Error fetching data:', err);
                if (axios.isAxiosError(err)) {
                     if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/admin/login');
                    } else if (err.response?.status === 403) {
                         navigate('/admin/dashboard');
                    } else {
                        setError('Failed to load users.');
                    }
                } else {
                    setError('Failed to load users.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    //HANDLER: Delete user (calls: DELETE /api/users/:id)
    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u.id !== id));
            toast.success('User deleted successfully');
        } catch (err) {
            console.error('Error deleting user:', err);
            toast.error('Failed to delete user.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    return (
        <DashboardLayout user={currentUser} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }}>
            <div className="p-8 font-sans">
                 <div className="max-w-7xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                            <button
                                onClick={() => navigate('/admin/users/create')}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
                            </button>
                        </div>
                        
                        <UserTable 
                            users={users} 
                            onEdit={(id) => navigate(`/admin/users/edit/${id}`)} 
                            onDelete={handleDeleteUser} 
                        />
                    </div>
                 </div>
            </div>
        </DashboardLayout>
    );
};

export default Users;
