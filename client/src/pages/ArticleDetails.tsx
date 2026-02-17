import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import type { Article, Category } from "../types";

import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import ArticleHeader from "../components/article/ArticleHeader";
import ArticleImage from "../components/article/ArticleImage";
import ArticleContent from "../components/article/ArticleContent";

const ArticleDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      />

      <main className="grow pt-40 xl:pt-28 pb-12 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ArticleHeader 
            article={article} 
            categoryName={categories.find(c => c.id === article.categoryId)?.name} 
        />

        <ArticleImage article={article} />

        <ArticleContent article={article} />

      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetails;
