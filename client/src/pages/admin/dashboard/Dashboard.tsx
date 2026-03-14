import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { Article, User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import StatsOverview from '../../../components/dashboard/StatsOverview';
import ArticleFilters from '../../../components/dashboard/ArticleFilters';
import ArticleTable from '../../../components/dashboard/ArticleTable';
import { isAdminRole } from '../../../utils/roles';

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
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //FETCH: Author details for articles (calls: GET /api/users/:id)
  useEffect(() => {
    const fetchAuthors = async () => {
        if (!isAdminRole(user?.role) || articles.length === 0) return;

        const uniqueAuthorIds = Array.from(new Set(articles.map(a => a.authorId).filter((id): id is number => id !== undefined)));
        const token = localStorage.getItem('token');
        const newAuthors: Record<number, User> = {};

        await Promise.all(uniqueAuthorIds.map(async (id) => {
            if (authors[id]) return;
            try {
                const res = await axios.get(`http://localhost:8000/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                newAuthors[id] = res.data;
            } catch (error) {
                console.error(`Failed to fetch user ${id}`, error);
            }
        }));

        if (Object.keys(newAuthors).length > 0) {
            setAuthors(prev => ({ ...prev, ...newAuthors }));
        }
    };

    fetchAuthors();
  }, [user, articles, authors]);

  //FETCH: Dashboard data (calls: GET /api/auth/me, GET /api/articles/me)
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

        const [userRes, articlesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/auth/me', config),
          axios.get('http://localhost:8000/api/articles/me', config)
        ]);

        setUser(userRes.data);
        setArticles(articlesRes.data);
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

  //HANDLER: Logout (deletes token, redirects to login)
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  //HANDLER: Delete article (calls: DELETE /api/articles/:id)
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

  //FUNCTION: Get sorted and filtered articles based on search query, filters, sort field, and sort direction
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter && article.status !== statusFilter) return false;

    if (dateFilter) {
      const articleDate = new Date(article.createdAt || article.publishedAt || 0);
      const now = new Date();
      if (dateFilter === 'today') {
        if (articleDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (articleDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        if (articleDate.getMonth() !== now.getMonth() || articleDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === 'year') {
        if (articleDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    if (taskFilter === 'with' && !article.task) return false;
    if (taskFilter === 'without' && article.task) return false;

    if (authorFilter && article.authorId !== Number(authorFilter)) return false;

    return true;
  }).sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'title') {
      return a.title.localeCompare(b.title) * modifier;
    }
    if (sortField === 'status') {
      return a.status.localeCompare(b.status) * modifier;
    }
    if (sortField === 'publishedAt') {
      const dateA = new Date(a.createdAt || a.publishedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.publishedAt || 0).getTime();
      return (dateA - dateB) * modifier;
    }
    if (sortField === 'author') {
       const authorA = (a.authorId && authors[a.authorId]?.name) || '';
       const authorB = (b.authorId && authors[b.authorId]?.name) || '';
       return authorA.localeCompare(authorB) * modifier;
    }
    return 0;
  });
  
  // CONSTANTS: total articles, published count, draft count, review count, scheduled count
  const totalArticles = articles.length;
  const publishedCount = articles.filter(a => a.status === 'PUBLISHED').length;
  const draftCount = articles.filter(a => a.status === 'DRAFT').length;
  const reviewCount = articles.filter(a => a.status === 'REVIEW').length;
  const scheduledCount = articles.filter(a => a.status === 'SCHEDULED').length;

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
              totalArticles={totalArticles} 
              publishedCount={publishedCount} 
              draftCount={draftCount}
              reviewCount={reviewCount}
              scheduledCount={scheduledCount}
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
