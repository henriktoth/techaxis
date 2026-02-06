import type { Article } from "../types";

interface ArticleCardProps {
  article: Article;
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <article className="group relative flex flex-col bg-[#111827] border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-500/20 h-full">
      
      {/* Image Container */}
      <div className="relative h-52 w-full overflow-hidden">
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent z-10 opacity-60" />
        
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1F2937] text-slate-600 font-bold text-xl">
            <span>TechAxis</span>
          </div>
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
              {new Date(article.publishedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
           </span>
           
           <span className="inline-flex items-center text-sm font-semibold text-indigo-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Read
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;