import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserCard from '../../../components/dashboard/UserCard';
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

    const admins = users.filter(u => u.role === 'ADMIN');
    const writers = users.filter(u => u.role === 'WRITER');
    const regularUsers = users.filter(u => u.role === 'USER');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">Loading...</div>
        );
    }

    return (
        <DashboardLayout user={currentUser} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/admin/login');
        }}>
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                        <button
                            onClick={() => navigate('/admin/users/create')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <UserPlus size={20} />
                            Add User
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Admins Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Admins
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {admins.map(user => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    onEdit={(id) => navigate(`/admin/users/edit/${id}`)}
                                    onDelete={handleDeleteUser}
                                />
                            ))}
                            {admins.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No admin users found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Writers Section */}
                    <div className="space-y-4 mt-8 pt-6 border-t border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Writers
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {writers.map(user => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    onEdit={(id) => navigate(`/admin/users/edit/${id}`)}
                                    onDelete={handleDeleteUser}
                                />
                            ))}
                            {writers.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No writer users found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Regular Users Section (if any) */}
                    {regularUsers.length > 0 && (
                        <div className="space-y-4 mt-8 pt-6 border-t border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Regular Users
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {regularUsers.map(user => (
                                    <UserCard
                                        key={user.id}
                                        user={user}
                                        currentUser={currentUser}
                                        onEdit={(id) => navigate(`/admin/users/edit/${id}`)}
                                        onDelete={handleDeleteUser}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Users;
