import { Link } from "react-router-dom";
import type { Article } from "../../types";

interface HeroArticleProps {
  article: Article;
}

const HeroArticle = ({ article }: HeroArticleProps) => {
  return (
    <section className="mb-16 group cursor-pointer relative rounded-3xl overflow-hidden bg-[#111827] border border-white/5 shadow-2xl transition-all hover:border-indigo-500/30">

      <Link
        to={`/article/${article.slug}`}
        className="absolute inset-0 z-20"
      />

      <div className="grid lg:grid-cols-2 gap-0">

        <div className="relative h-64 lg:h-auto overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay z-10"></div>
          {article.thumbnail ? (
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center px-8 sm:px-16">
              <span className="text-slate-600 font-bold text-4xl">
                TechAxis
              </span>
            </div>
          )}
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center relative">

          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center space-x-2 text-indigo-400 font-mono text-sm tracking-wider mb-4 uppercase">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Featured Story</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight group-hover:text-indigo-400 transition-colors">
            {article.title}
          </h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed line-clamp-3">
            {article.summary}
          </p>

          <div className="mt-auto">
            <span className="inline-flex items-center text-base font-semibold text-white border-b-2 border-indigo-500 pb-1 hover:text-indigo-400 transition-colors">
              Read Full Story
              <svg
                className="w-5 h-5 ml-2"
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
      </div>
    </section>
  );
};

export default HeroArticle;
