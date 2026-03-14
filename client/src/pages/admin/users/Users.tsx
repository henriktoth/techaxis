import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserCard from '../../../components/dashboard/UserCard';
import { UserPlus, AlertTriangle, Ban, CheckCircle, Search } from 'lucide-react';
import { isAdminRole } from '../../../utils/roles';

const Users = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const [toggleModal, setToggleModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    //FETCH: User details + all users (calls: GET /api/auth/me, GET /api/users)
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

                const userRes = await axios.get('http://localhost:8000/api/auth/me', config);
                setCurrentUser(userRes.data);

                if (!isAdminRole(userRes.data.role)) {
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
                        navigate('/login');
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
    const handleDeleteUser = (id: number) => {
        const user = users.find(u => u.id === id) || null;
        setDeleteModal({ open: true, user });
    };

    const confirmDeleteUser = async () => {
        if (!deleteModal.user) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/users/${deleteModal.user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u.id !== deleteModal.user!.id));
            toast.success('User deleted and articles transferred successfully');
        } catch (err) {
            console.error('Error deleting user:', err);
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to delete user.');
            }
        } finally {
            setProcessing(false);
            setDeleteModal({ open: false, user: null });
        }
    };

    //HANDLER: Toggle user disabled status (calls: PATCH /api/users/:id/toggle-disabled)
    const handleToggleDisabled = (id: number) => {
        const user = users.find(u => u.id === id) || null;
        setToggleModal({ open: true, user });
    };

    const confirmToggleDisabled = async () => {
        if (!toggleModal.user) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`http://localhost:8000/api/users/${toggleModal.user.id}/toggle-disabled`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.map(u => u.id === toggleModal.user!.id ? res.data : u));
            toast.success(`User account ${res.data.isDisabled ? 'disabled' : 'enabled'} successfully`);
        } catch (err) {
            console.error('Error toggling user status:', err);
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to update user status.');
            }
        } finally {
            setProcessing(false);
            setToggleModal({ open: false, user: null });
        }
    };

    const filteredUsers = users.filter(u =>
        u.role !== 'READER' && u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const superadmins = filteredUsers.filter(u => u.role === 'SUPERADMIN');
    const admins = filteredUsers.filter(u => u.role === 'ADMIN');
    const writers = filteredUsers.filter(u => u.role === 'WRITER');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">Loading...</div>
        );
    }

    return (
        <DashboardLayout user={currentUser} onLogout={() => {
            localStorage.removeItem('token');
            navigate('/login');
        }}>
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                />
                            </div>
                            <button
                                onClick={() => navigate('/admin/users/create')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <UserPlus size={20} />
                                Add User
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Super Admins Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Super Admins
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {superadmins.map(user => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    onEdit={(id) => navigate(`/admin/users/edit/${id}`)}
                                    onDelete={handleDeleteUser}
                                    onToggleDisabled={handleToggleDisabled}
                                />
                            ))}
                            {superadmins.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No super admin users found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admins Section */}
                    <div className="space-y-4 mt-8 pt-6 border-t border-gray-200">
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
                                    onToggleDisabled={handleToggleDisabled}
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
                                    onToggleDisabled={handleToggleDisabled}
                                />
                            ))}
                            {writers.length === 0 && (
                                <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No writer users found.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Delete User Modal */}
            {deleteModal.open && deleteModal.user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !processing && setDeleteModal({ open: false, user: null })} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                                <p className="text-sm text-gray-500">This action is permanent</p>
                            </div>
                        </div>
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                You are about to permanently delete <span className="font-semibold">{deleteModal.user.name}</span> ({deleteModal.user.email}).
                                This action <span className="font-semibold">cannot be undone</span>.
                            </p>
                            <p className="text-sm text-red-700 mt-2">
                                All articles by this user will be transferred to your account.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => setDeleteModal({ open: false, user: null })}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={confirmDeleteUser}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {processing ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Disable Modal */}
            {toggleModal.open && toggleModal.user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !processing && setToggleModal({ open: false, user: null })} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                toggleModal.user.isDisabled ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                                {toggleModal.user.isDisabled
                                    ? <CheckCircle className="text-green-600" size={24} />
                                    : <Ban className="text-orange-600" size={24} />
                                }
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {toggleModal.user.isDisabled ? 'Enable' : 'Disable'} Account
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {toggleModal.user.name} ({toggleModal.user.email})
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {toggleModal.user.isDisabled
                                ? 'This will re-enable the account. The user will be able to log in again and all their data remains intact.'
                                : 'This will disable the account. The user will not be able to log in, but all their data (articles, tasks) will be preserved. You can re-enable the account at any time.'
                            }
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => setToggleModal({ open: false, user: null })}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={confirmToggleDisabled}
                                className={`px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                    toggleModal.user.isDisabled
                                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-600'
                                        : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-600'
                                }`}
                            >
                                {processing
                                    ? (toggleModal.user.isDisabled ? 'Enabling...' : 'Disabling...')
                                    : (toggleModal.user.isDisabled ? 'Enable Account' : 'Disable Account')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Users;
