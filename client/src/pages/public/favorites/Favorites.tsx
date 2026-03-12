import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Article, Category, User } from "../../../types";

import Navbar from "../../../components/shared/Navbar";
import ArticleCard from "../../../components/home/ArticleCard";
import Footer from "../../../components/shared/Footer";
import EmptyState from "../../../components/shared/EmptyState";

const Favorites = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [userRes, favoritesRes, categoriesRes] = await Promise.all([
          axios.get<User>("http://localhost:8000/api/auth/me", { headers }),
          axios.get<Article[]>("http://localhost:8000/api/favorites", { headers }),
          axios.get<Category[]>("http://localhost:8000/api/categories"),
        ]);

        setUser(userRes.data);
        setArticles(favoritesRes.data);
        setFavoriteIds(favoritesRes.data.map((a) => a.id));
        setCategories(categoriesRes.data);
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  const handleToggleFavorite = async (articleId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (favoriteIds.includes(articleId)) {
        await axios.delete(`http://localhost:8000/api/favorites/${articleId}`, { headers });
        setFavoriteIds((prev) => prev.filter((id) => id !== articleId));
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        await axios.post(`http://localhost:8000/api/favorites/${articleId}`, {}, { headers });
        setFavoriteIds((prev) => [...prev, articleId]);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-gray-100 font-sans selection:bg-indigo-500/30">
      <Navbar
        categories={categories}
        selectedCategoryId={null}
        onSelectCategory={() => navigate("/")}
        onSearch={() => navigate("/")}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 xl:pt-28 grow">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="bg-linear-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              My Favorites
            </span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg max-w-2xl">
            Articles you've saved for later reading.
          </p>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isFavorited={favoriteIds.includes(article.id)}
                onToggleFavorite={handleToggleFavorite}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
