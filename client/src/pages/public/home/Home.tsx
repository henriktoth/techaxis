import { useEffect, useState } from "react";
import axios from "axios";
import type { Article, Category, User } from "../../../types";

import Navbar from "../../../components/shared/Navbar";
import ArticleCard from "../../../components/home/ArticleCard";
import Footer from "../../../components/shared/Footer";
import PageHeader from "../../../components/home/PageHeader";
import HeroArticle from "../../../components/home/HeroArticle";
import EmptyState from "../../../components/shared/EmptyState";

const Home = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FETCH: Reader auth state
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [userRes, favIdsRes] = await Promise.all([
          axios.get<User>("http://localhost:8000/api/auth/me", { headers }),
          axios.get<number[]>("http://localhost:8000/api/favorites/ids", { headers }),
        ]);
        setUser(userRes.data);
        setFavoriteIds(favIdsRes.data);
      } catch {
        localStorage.removeItem("token");
      }
    };
    fetchUser();
  }, []);

  // FETCH: Categories (calls: GET /api/categories)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRes = await axios.get<Category[]>("http://localhost:8000/api/categories");
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load content.");
      }
    };
    fetchCategories();
  }, []);

  //FETCH: Articles (with search query) (calls: GET /api/articles?search=)
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const url = searchQuery
          ? `http://localhost:8000/api/articles?search=${searchQuery}`
          : "http://localhost:8000/api/articles";

        const articlesRes = await axios.get<Article[]>(url);
        setArticles(articlesRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load articles.");
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchArticles();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    setFavoriteIds([]);
  };

  const handleToggleFavorite = async (articleId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (favoriteIds.includes(articleId)) {
        await axios.delete(`http://localhost:8000/api/favorites/${articleId}`, { headers });
        setFavoriteIds((prev) => prev.filter((id) => id !== articleId));
      } else {
        await axios.post(`http://localhost:8000/api/favorites/${articleId}`, {}, { headers });
        setFavoriteIds((prev) => [...prev, articleId]);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // CONSTANTS: filtered articles, hero article, remaining articles
  const filteredArticles = selectedCategoryId
    ? articles.filter((article) => article.categoryId === selectedCategoryId)
    : articles;
  const heroArticle = filteredArticles.find((a) => a.isFeatured);
  const remainingArticles = filteredArticles.filter((a) => a.id !== heroArticle?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120] text-indigo-500 font-mono text-xl animate-pulse">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120] text-red-500 font-bold text-xl">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-gray-100 font-sans selection:bg-indigo-500/30">

      <Navbar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onSearch={setSearchQuery}
        user={user}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 xl:pt-28">

        <PageHeader
          selectedCategoryId={selectedCategoryId}
          categories={categories}
        />

        {filteredArticles.length > 0 ? (
          <>

            {heroArticle && (
              <HeroArticle article={heroArticle} />
            )}

            {remainingArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {remainingArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isFavorited={favoriteIds.includes(article.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isLoggedIn={!!user}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
