import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import type { Article, Category, User } from "../../../types";

import Navbar from "../../../components/shared/Navbar";
import Footer from "../../../components/shared/Footer";
import ArticleHeader from "../../../components/article/ArticleHeader";
import ArticleImage from "../../../components/article/ArticleImage";
import ArticleContent from "../../../components/article/ArticleContent";

const ArticleDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FETCH: Reader auth state
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get<User>("http://localhost:8000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch {
        localStorage.removeItem("token");
      }
    };
    fetchUser();
  }, []);

  //FETCH: Article + Categories (calls: GET /api/articles/:slug, GET /api/categories)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articleRes, categoriesRes] = await Promise.all([
          axios.get<Article>(`http://localhost:8000/api/articles/${slug}`),
          axios.get<Category[]>("http://localhost:8000/api/categories"),
        ]);

        setArticle(articleRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load article.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  // FETCH: Check if article is favorited
  useEffect(() => {
    if (!article || !user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const checkFav = async () => {
      try {
        const res = await axios.get<{ isFavorited: boolean }>(
          `http://localhost:8000/api/favorites/${article.id}/check`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFavorited(res.data.isFavorited);
      } catch {
        // ignore
      }
    };
    checkFav();
  }, [article, user]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsFavorited(false);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!article) return;

    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (isFavorited) {
        await axios.delete(`http://localhost:8000/api/favorites/${article.id}`, { headers });
        setIsFavorited(false);
      } else {
        await axios.post(`http://localhost:8000/api/favorites/${article.id}`, {}, { headers });
        setIsFavorited(true);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120] text-indigo-500 font-mono text-xl animate-pulse">
        Loading...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120] text-red-500 font-bold text-xl">
        {error || "Article not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-gray-100 font-sans selection:bg-indigo-500/30">
      <Navbar
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={() => navigate('/')}
        onSearch={() => navigate('/')}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="grow pt-40 xl:pt-28 pb-12 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <ArticleHeader
            article={article}
            categoryName={categories.find(c => c.id === article.categoryId)?.name}
        />

        <ArticleImage article={article} />

        <div className="flex justify-center my-6">
          <button
            onClick={handleToggleFavorite}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border ${
              isFavorited
                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                : user
                  ? "bg-white/5 border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            <svg
              className={`w-5 h-5 transition-colors duration-200 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              fill={isFavorited ? "currentColor" : "none"}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isFavorited ? "Saved to Favorites" : user ? "Add to Favorites" : "Sign in to Save"}
          </button>
        </div>

        <ArticleContent article={article} />

      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetails;
