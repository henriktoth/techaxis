import type { Article } from "../types";

interface ArticleCardProps {
  article: Article;
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <article className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform duration-300 group cursor-pointer">

      <div className="h-56 w-full overflow-hidden bg-gray-100">
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-xl">
            <span>TechAxis</span>
          </div>
        )}
      </div>


      <div className="flex flex-col grow p-6">
        <h2 className="text-xl font-bold mb-3 text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
          {article.title}
        </h2>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed grow">
          {article.summary}
        </p>


        <div className="mt-auto pt-4 border-t border-gray-100">
          <span className="inline-flex items-center text-sm font-semibold text-blue-600">
            Read Article
            <svg
              className="w-4 h-4 ml-1"
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