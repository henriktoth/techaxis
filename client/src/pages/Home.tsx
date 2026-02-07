import { useEffect, useState } from "react";
import axios from "axios";
import type { Article, Category } from "../types";

import Navbar from "../components/shared/Navbar";
import ArticleCard from "../components/home/ArticleCard";
import Footer from "../components/shared/Footer";
import PageHeader from "../components/home/PageHeader";
import HeroArticle from "../components/home/HeroArticle";
import EmptyState from "../components/shared/EmptyState";

const Home = () => {
  //States
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Effect: Fetch Categories
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

  // Effect: Fetch Articles (with optional search)
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

  //Constants
  const filteredArticles = selectedCategoryId
    ? articles.filter((article) => article.categoryId === selectedCategoryId)
    : articles;
  const heroArticle = filteredArticles.find((a) => a.isFeatured);
  const remainingArticles = filteredArticles.filter((a) => a.id !== heroArticle?.id);

  //Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120] text-indigo-500 font-mono text-xl animate-pulse">
        Loading...
      </div>
    );
  }

  //Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120] text-red-500 font-bold text-xl">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      
      <Navbar 
        categories={categories} 
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onSearch={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        
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
                  <ArticleCard key={article.id} article={article} />
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