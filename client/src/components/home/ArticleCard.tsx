import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import type { Article } from "../../types";
import { resolveMediaUrl } from "../../utils/media";

interface ArticleCardProps {
  article: Article;
  isFavorited?: boolean;
  onToggleFavorite?: (articleId: number) => void;
  isLoggedIn?: boolean;
}

const ArticleCard = ({ article, isFavorited, onToggleFavorite, isLoggedIn }: ArticleCardProps) => {
  const navigate = useNavigate();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    onToggleFavorite?.(article.id);
  };

  return (
    <article className="group relative flex flex-col bg-[#111827] border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-500/20 h-full cursor-pointer">
      <Link to={`/article/${article.slug}`} className="absolute inset-0 z-30" />

      <div className="relative h-52 w-full overflow-hidden">
       <div className="absolute inset-0 bg-linear-to-t from-[#111827] via-transparent to-transparent z-10 opacity-60" />

        {article.thumbnail ? (
          <img
            src={resolveMediaUrl(article.thumbnail)}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1F2937] text-slate-600 font-bold text-xl">
            <span>TechAxis</span>
          </div>
        )}

        {isLoggedIn !== undefined && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 z-40 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-all duration-200 group/fav"
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${
                isFavorited
                  ? "text-red-500 fill-current"
                  : "text-white/70 group-hover/fav:text-red-400"
              }`}
            />
          </button>
        )}
      </div>

      <div className="flex flex-col grow p-6 pt-2 z-20">
        <h2 className="text-xl font-bold mb-3 text-white leading-tight group-hover:text-indigo-400 transition-colors">
          {article.title}
        </h2>
        <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed grow">
          {article.summary}
        </p>


        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
           <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
           </span>

           <span className="inline-flex items-center text-sm font-semibold text-indigo-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Read
            <ArrowRight className="w-4 h-4 ml-2" />
          </span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
