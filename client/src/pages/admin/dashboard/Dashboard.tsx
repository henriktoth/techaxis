import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { Article, User, PaginatedResult } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import StatsOverview from '../../../components/dashboard/StatsOverview';
import ArticleFilters from '../../../components/dashboard/ArticleFilters';
import ArticleTable from '../../../components/dashboard/ArticleTable';
import { isAdminRole } from '../../../utils/roles';
import Pagination from '../../../components/shared/Pagination';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<Record<number, User>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Article | 'author'>('publishedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [taskFilter, setTaskFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, review: 0, scheduled: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [userRes, statsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/auth/me', config),
          axios.get('http://localhost:8000/api/articles/stats', config)
        ]);
        
        setUser(userRes.data);
        if (statsRes.data) {
             setStats({
                 total: statsRes.data.total || 0,
                 published: statsRes.data.published || 0,
                 draft: statsRes.data.draft || 0,
                 review: statsRes.data.review || 0,
                 scheduled: statsRes.data.scheduled || 0
             });
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 404)) {
            localStorage.removeItem('token');
            navigate('/login');
        } else {
            setError('Failed to load dashboard data.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const fetchArticles = async () => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;
        
        try {
            let url = `http://localhost:8000/api/articles/me?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
            if (searchQuery) url += `&search=${searchQuery}`;
            if (statusFilter) url += `&status=${statusFilter}`;
            if (authorFilter) url += `&authorId=${authorFilter}`;
                        
            const res = await axios.get<PaginatedResult<Article>>(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setArticles(res.data.data);
            setTotalPages(res.data.meta.totalPages);
            
            const uniqueAuthorIds = Array.from(new Set(res.data.data.map(a => a.authorId).filter((id): id is number => id !== undefined)));
            const newAuthors: Record<number, User> = {};
            await Promise.all(uniqueAuthorIds.map(async (id) => {
                if (authors[id]) return;
                try {
                    const authorRes = await axios.get(`http://localhost:8000/api/users/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    newAuthors[id] = authorRes.data;
                } catch (e) { console.error(e); }
            }));
             if (Object.keys(newAuthors).length > 0) {
                setAuthors(prev => ({ ...prev, ...newAuthors }));
            }
            
        } catch (err) {
            console.error(err);
        }
    };
    
    if (user) {
        const debounceTimer = setTimeout(() => {
            fetchArticles();
        }, 300);
        return () => clearTimeout(debounceTimer);
    }
  }, [user, currentPage, searchQuery, statusFilter, authorFilter, authors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, authorFilter]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8000/api/articles/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setArticles(articles.filter(a => a.id !== id));
        toast.success('Article deleted successfully');

      } catch (err) {
        let errorMessage = 'Failed to delete article';
        if (axios.isAxiosError(err) && err.response?.data?.message) {
             errorMessage = err.response.data.message;
        }
        toast.error(errorMessage);
        console.error(err);
    }
  };

  const handleSort = (field: keyof Article | 'author') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const filteredArticles = [...articles].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'title') return a.title.localeCompare(b.title) * modifier;
    if (sortField === 'status') return a.status.localeCompare(b.status) * modifier;
    if (sortField === 'publishedAt') {
      const dateA = new Date(a.createdAt || a.publishedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.publishedAt || 0).getTime();
      return (dateA - dateB) * modifier;
    }
    return 0;
  });

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-gray-500">Loading dashboard...</div>
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
    <DashboardLayout user={user} onLogout={handleLogout}>
      <div className="p-4 sm:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-6 sm:mb-8">
             <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
             <p className="text-sm sm:text-base text-gray-500">Overview of your articles and key statistics.</p>
          </div>
        
          <StatsOverview 
              totalArticles={stats.total} 
              publishedCount={stats.published} 
              draftCount={stats.draft}
              reviewCount={stats.review}
              scheduledCount={stats.scheduled}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 relative">
              <ArticleFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  title={isAdminRole(user?.role) ? 'All Articles' : 'My Articles'}
                  onNewArticle={() => navigate('/admin/article/create')}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  taskFilter={taskFilter}
                  setTaskFilter={setTaskFilter}
                  authorFilter={authorFilter}
                  setAuthorFilter={setAuthorFilter}
                  authors={authors}
                  user={user}
              />
              
              <ArticleTable 
                  articles={filteredArticles}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  user={user}
                  authors={authors}
                  onDelete={handleDeleteArticle}
                  searchQuery={searchQuery}
              />
              
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
