import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { User, Reader, PaginatedResult } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import ReadersTable from '../../../components/dashboard/ReadersTable';
import Pagination from '../../../components/shared/Pagination';
import { AlertTriangle, Ban, CheckCircle, Search } from 'lucide-react';
import { isAdminRole } from '../../../utils/roles';

const Readers = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [readers, setReaders] = useState<Reader[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [deleteModal, setDeleteModal] = useState<{ open: boolean; reader: Reader | null }>({ open: false, reader: null });
    const [toggleModal, setToggleModal] = useState<{ open: boolean; reader: Reader | null }>({ open: false, reader: null });
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [sortField, setSortField] = useState<'name' | 'email' | 'favorites'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

                if (!currentUser) {
                    const userRes = await axios.get('http://localhost:8000/api/auth/me', config);
                    setCurrentUser(userRes.data);

                    if (!isAdminRole(userRes.data.role)) {
                        navigate('/admin/dashboard');
                        return;
                    }
                }

                let url = `http://localhost:8000/api/users/readers?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
                if (searchQuery) {
                    url += `&search=${searchQuery}`;
                }

                const readersRes = await axios.get<PaginatedResult<Reader>>(url, config);
                setReaders(readersRes.data.data);
                setTotalPages(readersRes.data.meta.totalPages);

            } catch (err) {
                console.error('Error fetching data:', err);
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/login');
                    } else if (err.response?.status === 403) {
                        navigate('/admin/dashboard');
                    } else {
                        setError('Failed to load readers.');
                    }
                } else {
                    setError('Failed to load readers.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchData();
        }, 300);

        return () => clearTimeout(timeoutId);

    }, [navigate, currentPage, searchQuery, currentUser]);

    const handleDeleteReader = (id: number) => {
        const reader = readers.find(r => r.id === id) || null;
        setDeleteModal({ open: true, reader });
    };

    const confirmDeleteReader = async () => {
        if (!deleteModal.reader) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/users/${deleteModal.reader.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReaders(readers.filter(r => r.id !== deleteModal.reader!.id));
            toast.success('Reader account deleted successfully');
        } catch (err) {
            console.error('Error deleting reader:', err);
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to delete reader.');
            }
        } finally {
            setProcessing(false);
            setDeleteModal({ open: false, reader: null });
        }
    };

    const handleToggleDisabled = (id: number) => {
        const reader = readers.find(r => r.id === id) || null;
        setToggleModal({ open: true, reader });
    };

    const confirmToggleDisabled = async () => {
        if (!toggleModal.reader) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`http://localhost:8000/api/users/${toggleModal.reader.id}/toggle-disabled`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReaders(readers.map(r => r.id === toggleModal.reader!.id ? { ...r, ...res.data } : r));
            toast.success(`Reader account ${res.data.isDisabled ? 'disabled' : 'enabled'} successfully`);
        } catch (err) {
            console.error('Error toggling reader status:', err);
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to update reader status.');
            }
        } finally {
            setProcessing(false);
            setToggleModal({ open: false, reader: null });
        }
    };

    const handleSort = (field: 'name' | 'email' | 'favorites') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedReaders = [...readers].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'email') cmp = a.email.localeCompare(b.email);
        else if (sortField === 'favorites') cmp = a._count.favorites - b._count.favorites;
        return sortDirection === 'asc' ? cmp : -cmp;
    });

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
                        <h1 className="text-3xl font-bold text-gray-900">Readers</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search readers..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <ReadersTable
                            readers={sortedReaders}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            onDelete={handleDeleteReader}
                            onToggleDisabled={handleToggleDisabled}
                            searchQuery={searchQuery}
                        />
                    </div>
                
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {deleteModal.open && deleteModal.reader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !processing && setDeleteModal({ open: false, reader: null })} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete Reader</h3>
                                <p className="text-sm text-gray-500">This action is permanent</p>
                            </div>
                        </div>
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                You are about to permanently delete <span className="font-semibold">{deleteModal.reader.name}</span> ({deleteModal.reader.email}).
                                This action <span className="font-semibold">cannot be undone</span>.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => setDeleteModal({ open: false, reader: null })}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={confirmDeleteReader}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {processing ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toggleModal.open && toggleModal.reader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => !processing && setToggleModal({ open: false, reader: null })} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                toggleModal.reader.isDisabled ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                                {toggleModal.reader.isDisabled
                                    ? <CheckCircle className="text-green-600" size={24} />
                                    : <Ban className="text-orange-600" size={24} />
                                }
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {toggleModal.reader.isDisabled ? 'Enable' : 'Disable'} Account
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {toggleModal.reader.name} ({toggleModal.reader.email})
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {toggleModal.reader.isDisabled
                                ? 'This will re-enable the account. The reader will be able to log in again and all their data remains intact.'
                                : 'This will disable the account. The reader will not be able to log in, but all their data (favourites) will be preserved. You can re-enable the account at any time.'
                            }
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => setToggleModal({ open: false, reader: null })}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={confirmToggleDisabled}
                                className={`px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                    toggleModal.reader.isDisabled
                                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-600'
                                        : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-600'
                                }`}
                            >
                                {processing
                                    ? (toggleModal.reader.isDisabled ? 'Enabling...' : 'Disabling...')
                                    : (toggleModal.reader.isDisabled ? 'Enable Account' : 'Disable Account')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Readers;
