import type { Article} from "../../types";

interface ArticleHeaderProps {
  article: Article;
  categoryName?: string;
}

const ArticleHeader = ({ article, categoryName }: ArticleHeaderProps) => {
  return (
    <header className="mb-10 text-center">
      <div className="inline-flex items-center justify-center space-x-2 text-indigo-400 font-mono text-sm tracking-widest uppercase mb-6">
        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
        <span>{categoryName || "TechAxis"}</span>
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
        {article.title}
      </h1>

      <div className="flex items-center justify-center space-x-4 text-slate-400 text-sm">
        {article.author && (
          <>
            <span className="font-medium text-slate-300">{article.author.name}</span>
            <span className="text-slate-600">•</span>
          </>
        )}
        <span>
          {new Date(article.publishedAt || Date.now()).toLocaleDateString(
            undefined,
            { year: "numeric", month: "long", day: "numeric" }
          )}
        </span>
      </div>
    </header>
  );
};

export default ArticleHeader;
