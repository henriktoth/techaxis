import { useEffect, useState } from "react";
import axios from "axios";
import type { Article, Category } from "../types";
import Navbar from "../components/Navbar";
import ArticleCard from "../components/ArticleCard";
import Footer from "../components/Footer";

const Home = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredArticles = selectedCategoryId
    ? articles.filter((article) => article.categoryId === selectedCategoryId)
    : articles;

    const heroArticle = filteredArticles.find((a) => a.isFeatured) || filteredArticles[0];
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
    <div className="min-h-screen flex flex-col">
      <Navbar 
        categories={categories} 
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onSearch={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        
        {/* Header Section */}
        <div className="mb-12">
           <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
             {selectedCategoryId 
               ? categories.find(c => c.id === selectedCategoryId)?.name 
               : "Latest Insights"}
           </h1>
           <p className="text-slate-400 text-lg">
             {selectedCategoryId ? `Browsing category` : "Exploring the future of technology."}
           </p>
        </div>

        {filteredArticles.length > 0 ? (
          <>

            {heroArticle && (
              <section className="mb-16 group cursor-pointer relative rounded-3xl overflow-hidden bg-[#111827] border border-white/5 shadow-2xl transition-all hover:border-indigo-500/30">
                 <div className="grid lg:grid-cols-2 gap-0">
                    <div className="relative h-64 lg:h-auto overflow-hidden">
                       <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay z-10"></div>
                       {heroArticle.thumbnail ? (
                         <img 
                           src={heroArticle.thumbnail} 
                           alt={heroArticle.title}
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                         />
                       ) : (
                         <div className="w-full h-full bg-slate-800 flex items-center justify-center px-8 sm:px-16">
                            <span className="text-slate-600 font-bold text-4xl">TechAxis</span>
                         </div>
                       )}
                    </div>
                    <div className="p-8 lg:p-12 flex flex-col justify-center relative">
                       {/* Decorative Gradient Blob */}
                       <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                       <div className="flex items-center space-x-2 text-indigo-400 font-mono text-sm tracking-wider mb-4 uppercase">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                          <span>Featured Story</span>
                       </div>

                       <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight group-hover:text-indigo-400 transition-colors">
                         {heroArticle.title}
                       </h2>
                       <p className="text-slate-400 text-lg mb-8 leading-relaxed line-clamp-3">
                         {heroArticle.summary}
                       </p>
                       
                       <div className="mt-auto">
                         <span className="inline-flex items-center text-base font-semibold text-white border-b-2 border-indigo-500 pb-1 hover:text-indigo-400 transition-colors">
                           Read Full Story
                           <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                           </svg>
                         </span>
                       </div>
                    </div>
                 </div>
              </section>
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
          <div className="flex flex-col items-center justify-center py-20 px-6 md:px-12 lg:px-24 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 w-full">
            <svg className="w-20 h-20 text-slate-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-3xl font-bold text-white mb-3">No articles found</h3>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">We couldn't find any content matching your criteria. Try adjusting your search or category.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;