import { useEffect, useState } from "react";
import axios from "axios";
import type { Article, Category } from "../types";
import CategoryNav from "../components/Navbar";
import ArticleCard from "../components/ArticleCard";

const Home = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          axios.get<Article[]>("http://localhost:8000/api/articles"),
          axios.get<Category[]>("http://localhost:8000/api/categories"),
        ]);

        setArticles(articlesRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg">
        Loading TechAxis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 font-sans text-gray-900">

      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-8 text-slate-900">
          TechAxis
        </h1>
        
        <CategoryNav categories={categories} />
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (

          <ArticleCard key={article.id} article={article} />
        ))}
      </main>
    </div>
  );
};

export default Home;