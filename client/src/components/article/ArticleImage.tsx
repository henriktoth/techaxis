import type { Article } from "../../types";
import { resolveMediaUrl } from "../../utils/media";

interface ArticleImageProps {
  article: Article;
}

const ArticleImage = ({ article }: ArticleImageProps) => {
  return (
    <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-[#111827]">
      {article.thumbnail ? (
        <img
          src={resolveMediaUrl(article.thumbnail)}
          alt={article.title}
          className="w-full h-auto object-cover max-h-150"
        />
      ) : (
        <div className="w-full h-64 sm:h-96 flex items-center justify-center bg-[#1F2937]">
          <span className="text-4xl font-bold text-slate-600">TechAxis</span>
        </div>
      )}
    </div>
  );
};

export default ArticleImage;
