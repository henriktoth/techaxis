import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import type { Article, Category } from "../../../types";

import Footer from "../../../components/shared/Footer";
import ArticleHeader from "../../../components/article/ArticleHeader";
import ArticleImage from "../../../components/article/ArticleImage";
import ArticleContent from "../../../components/article/ArticleContent";

const PreviewArticle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [articleRes, categoriesRes] = await Promise.all([
          axios.get<Article>(
            `http://localhost:8000/api/articles/me/${id}`,
            config
          ),
          axios.get<Category[]>("http://localhost:8000/api/categories"),
        ]);

        setArticle(articleRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error(err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          } else if (err.response?.status === 404) {
            setError("Article not found.");
          } else {
            setError("Failed to load article.");
          }
        } else {
          setError("Failed to load article.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120] text-indigo-500 font-mono text-xl animate-pulse">
        Loading preview...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B1120] gap-4">
        <div className="text-red-500 font-bold text-xl">
          {error || "Article not found"}
        </div>
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const bannerColors = {
    DRAFT: { bg: 'bg-yellow-500', text: 'text-yellow-950', btn: 'bg-yellow-800 text-yellow-100 hover:bg-yellow-900' },
    REVIEW: { bg: 'bg-blue-500', text: 'text-blue-950', btn: 'bg-blue-800 text-blue-100 hover:bg-blue-900' },
    REJECTED: { bg: 'bg-red-500', text: 'text-red-950', btn: 'bg-red-800 text-red-100 hover:bg-red-900' },
    SCHEDULED: { bg: 'bg-orange-500', text: 'text-orange-950', btn: 'bg-orange-800 text-orange-100 hover:bg-orange-900' },
  } as const;

  const colors = bannerColors[article.status as keyof typeof bannerColors] ?? bannerColors.DRAFT;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-gray-100 font-sans selection:bg-indigo-500/30">
      {/* Preview Banner */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${colors.bg} ${colors.text} text-center py-2 px-4 font-semibold text-sm shadow-lg flex items-center justify-center gap-3`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>
          Preview Mode — This article is not published yet (
          <span className="font-bold">{article.status}</span>)
        </span>
        <button
          onClick={() => navigate("/admin/dashboard")}
          className={`ml-4 px-3 py-1 rounded-md text-xs font-medium transition-colors ${colors.btn}`}
        >
          Back to Dashboard
        </button>
      </div>

      <main className="grow pt-20 pb-12 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ArticleHeader
          article={article}
          categoryName={
            categories.find((c) => c.id === article.categoryId)?.name
          }
        />

        <ArticleImage article={article} />

        <ArticleContent article={article} />
      </main>

      <Footer />
    </div>
  );
};

export default PreviewArticle;
