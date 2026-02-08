import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Article, User } from '../types';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatsOverview from '../components/dashboard/StatsOverview';
import ArticleFilters from '../components/dashboard/ArticleFilters';
import ArticleTable from '../components/dashboard/ArticleTable';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<Record<number, User>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Article | 'author'>('publishedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthors = async () => {
        if (user?.role !== 'ADMIN' || articles.length === 0) return;

        const uniqueAuthorIds = Array.from(new Set(articles.map(a => a.authorId).filter((id): id is number => id !== undefined)));
        const token = localStorage.getItem('token');
        const newAuthors: Record<number, User> = {};

        await Promise.all(uniqueAuthorIds.map(async (id) => {
            if (authors[id]) return; // Already fetched
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
  }, [user, articles]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin');
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
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            navigate('/admin');
        } else {
            setError('Failed to load dashboard data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin');
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8000/api/articles/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setArticles(articles.filter(a => a.id !== id));
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to delete article';
        alert(errorMessage);
        console.error(err);
    }
  };

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

  const handleSort = (field: keyof Article | 'author') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Derived stats
  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
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
  
  const totalArticles = articles.length;
  const publishedCount = articles.filter(a => a.status === 'PUBLISHED').length;
  const draftCount = articles.filter(a => a.status === 'DRAFT').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader 
            user={user} 
            onLogout={handleLogout} 
        />
        
        <StatsOverview 
            totalArticles={totalArticles} 
            publishedCount={publishedCount} 
            draftCount={draftCount} 
        />

        {/* Articles Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
            <ArticleFilters 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                title={user?.role === 'ADMIN' ? 'All Articles' : 'My Articles'}
                onNewArticle={() => alert('Create Article feature coming soon (nav to /create-article)')}
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
  );
};

export default Dashboard;
