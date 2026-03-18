import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User, PaginatedResult } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import UserCard from '../../../components/dashboard/UserCard';
import Pagination from '../../../components/shared/Pagination';
import { UserPlus, AlertTriangle, Ban, CheckCircle, Search, X, ChevronDown } from 'lucide-react';
import { isAdminRole } from '../../../utils/roles';

interface DropdownOption {
    value: string;
    label: string;
}

const FilterDropdown = ({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: DropdownOption[];
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(option => option.value === value) ?? options[0];

    return (
        <div ref={ref} className="relative min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-left hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer"
            >
                <span className={`truncate grow ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                    {selected?.label}
                </span>
                <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-20 mt-1.5 w-full min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {options.map(option => (
                            <li key={option.value}>
                                <button
                                    type="button"
                                    onClick={() => { onChange(option.value); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                                        value === option.value
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const roleOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPERADMIN', label: 'Superadmin' },
    { value: 'WRITER', label: 'Writer' },
];

const statusOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DISABLED', label: 'Disabled' },
];

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
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 12;

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
                
                // Fetch current user only if needed or optimized
                if (!currentUser) {
                    const userRes = await axios.get('http://localhost:8000/api/auth/me', config);
                    setCurrentUser(userRes.data);

                    if (!isAdminRole(userRes.data.role)) {
                        navigate('/admin/dashboard');
                        return;
                    }
                }

                // Use the new excludeRole parameter to get actual staff members for pagination
                let url = `http://localhost:8000/api/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}&excludeRole=READER`;
                if (searchQuery) url += `&search=${searchQuery}`;
                if (roleFilter !== 'ALL') url += `&role=${roleFilter}`;
                if (statusFilter !== 'ALL') url += `&isDisabled=${statusFilter === 'DISABLED'}`;

                const usersRes = await axios.get<PaginatedResult<User>>(url, config);
                setUsers(usersRes.data.data);
                setTotalPages(usersRes.data.meta.totalPages ?? 1);

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
        
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 300);

        return () => clearTimeout(timeoutId);

    }, [navigate, currentPage, searchQuery, roleFilter, statusFilter]); // Re-fetch on query change

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
            // Re-fetch to update list properly with pagination
            // For simple UI update:
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

    const handleEditUser = (id: number) => {
        navigate(`/admin/users/edit/${id}`);
    };

    if (isLoading && users.length === 0) {
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
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                            <p className="text-gray-500 mt-1">Manage administrators and writers</p>
                        </div>
                        
                        <button
                            onClick={() => navigate('/admin/users/create')}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors font-medium shadow-sm shadow-indigo-200"
                        >
                            <UserPlus size={18} />
                            Add New User
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                        <div className="p-6 border-b border-gray-100 space-y-4">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="relative grow min-w-[200px]">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <FilterDropdown
                                    label="Role"
                                    value={roleFilter}
                                    onChange={(value) => {
                                        setRoleFilter(value);
                                        setCurrentPage(1);
                                    }}
                                    options={roleOptions}
                                />

                                <FilterDropdown
                                    label="Status"
                                    value={statusFilter}
                                    onChange={(value) => {
                                        setStatusFilter(value);
                                        setCurrentPage(1);
                                    }}
                                    options={statusOptions}
                                />

                                {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setRoleFilter('ALL');
                                            setStatusFilter('ALL');
                                            setCurrentPage(1);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer self-end"
                                    >
                                        <X size={14} />
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {users.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                            </div>
                        ) : (
                            users.map(user => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    onEdit={handleEditUser}
                                    onDelete={handleDeleteUser}
                                    onToggleDisabled={handleToggleDisabled}
                                />
                            ))
                        )}
                    </div>
                    
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />

                </div>
            </div>

            {/* Delete Modal */}
             {deleteModal.open && deleteModal.user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !processing && setDeleteModal({ open: false, user: null })} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 scale-100 animate-in fade-in zoom-in duration-200">
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
                                You are about to permanently delete <span className="font-semibold">{deleteModal.user.name}</span>.
                                All their articles will be transferred to a Superadmin account.
                                This action <span className="font-semibold">cannot be undone</span>.
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
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 scale-100 animate-in fade-in zoom-in duration-200">
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
                                    {toggleModal.user.name}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {toggleModal.user.isDisabled
                                ? 'This will re-enable the account. The user will be able to log in again.'
                                : 'This will disable the account. The user will not be able to log in, but their data will be preserved.'
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
