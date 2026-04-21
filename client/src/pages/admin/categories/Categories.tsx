import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Tag } from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import type { Category, User } from '../../../types';
import { isSuperAdmin } from '../../../utils/roles';

const Categories = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const userRes = await axios.get<User>('http://localhost:8000/api/auth/me', config);
        setCurrentUser(userRes.data);

        if (!isSuperAdmin(userRes.data.role)) {
          navigate('/admin/dashboard');
          return;
        }

        const categoriesRes = await axios.get<Category[]>('http://localhost:8000/api/categories', config);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Error loading categories:', err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Failed to load categories.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      toast.error('Category name is required.');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post<Category>(
        'http://localhost:8000/api/categories',
        { name },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCategories((prev) => [...prev, res.data]);
      setNewCategory('');
      toast.success('Category created successfully.');
    } catch (err) {
      console.error('Error creating category:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to create category.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteModal({ open: true, category });
  };

  const confirmDeleteCategory = async () => {
    if (!deleteModal.category) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/categories/${deleteModal.category.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories((prev) => prev.filter((c) => c.id !== deleteModal.category!.id));
      toast.success('Category deleted successfully.');
    } catch (err) {
      console.error('Error deleting category:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to delete category.');
      }
    } finally {
      setProcessing(false);
      setDeleteModal({ open: false, category: null });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
        <button onClick={handleLogout} className="ml-4 text-blue-500 underline cursor-pointer">Logout</button>
      </div>
    );
  }

  return (
    <DashboardLayout user={currentUser} onLogout={handleLogout}>
      <div className="p-4 sm:p-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Manager</h1>
            <p className="text-sm text-gray-500">Add or remove article categories. Superadmin only.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add new category</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Data Science"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                <Plus size={16} />
                Add category
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Existing categories</h2>

            {sortedCategories.length === 0 ? (
              <div className="text-sm text-gray-500">No categories found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedCategories.map((category) => {
                  const isDefault = category.id === 5 || category.name.toLowerCase() === 'other';
                  return (
                    <div key={category.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600">
                          <Tag size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">ID #{category.id}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={processing || isDefault}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-100 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
                        title={isDefault ? 'Default category cannot be deleted' : 'Delete category'}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteModal.open && deleteModal.category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete category</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete "{deleteModal.category.name}"? Articles under this category will be moved to the default category.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, category: null })}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                disabled={processing}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Categories;
