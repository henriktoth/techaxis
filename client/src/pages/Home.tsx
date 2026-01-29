import { useEffect, useState } from "react";
import axios from "axios";
import "./Home.css";

interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  status: string;
  publishedAt: string | null;
}

interface Category {
  id: number;
  name: string;
}

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

  if (loading) return <div className="loading">Loading TechAxis...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <header className="site-header">
        <h1 className="brand-title">TechAxis</h1>
        
        <nav className="category-nav">
          <button className="category-pill active">All</button>
          {categories.map((cat) => (
            <button key={cat.id} className="category-pill">
              {cat.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="article-grid">
        {articles.map((article) => (
          <article key={article.id} className="article-card">
            <div className="card-image-container">
              {article.thumbnail ? (
                <img 
                  src={article.thumbnail} 
                  alt={article.title} 
                  className="card-img" 
                />
              ) : (
                <div className="card-placeholder">
                   <span>TechAxis</span>
                </div>
              )}
            </div>
            <div className="card-content">
              <h2 className="card-title">{article.title}</h2>
              <p className="card-summary">{article.summary}</p>
              <div className="card-footer">
                <span className="read-more">Read Article →</span>
              </div>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
};

export default Home;