import { useEffect } from 'react';
import { Eye } from 'lucide-react';
import type { Article } from '../../types';
import ArticleHeader from '../article/ArticleHeader';
import ArticleImage from '../article/ArticleImage';
import ArticleContent from '../article/ArticleContent';
import Footer from '../shared/Footer';

interface ArticlePreviewModalProps {
  article: Article;
  categoryName?: string;
  onClose: () => void;
}

const bannerColors = {
  DRAFT: { bg: 'bg-yellow-500', text: 'text-yellow-950', btn: 'bg-yellow-800 text-yellow-100 hover:bg-yellow-900' },
  REVIEW: { bg: 'bg-blue-500', text: 'text-blue-950', btn: 'bg-blue-800 text-blue-100 hover:bg-blue-900' },
  REJECTED: { bg: 'bg-red-500', text: 'text-red-950', btn: 'bg-red-800 text-red-100 hover:bg-red-900' },
  SCHEDULED: { bg: 'bg-orange-500', text: 'text-orange-950', btn: 'bg-orange-800 text-orange-100 hover:bg-orange-900' },
  PUBLISHED: { bg: 'bg-green-500', text: 'text-green-950', btn: 'bg-green-800 text-green-100 hover:bg-green-900' },
} as const;

const ArticlePreviewModal = ({ article, categoryName, onClose }: ArticlePreviewModalProps) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const colors = bannerColors[article.status as keyof typeof bannerColors] ?? bannerColors.DRAFT;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-gray-100 font-sans selection:bg-indigo-500/30 overflow-y-auto">
      <div className={`sticky top-0 z-10 ${colors.bg} ${colors.text} text-center py-2 px-4 font-semibold text-sm shadow-lg flex items-center justify-center gap-3`}>
        <Eye className="w-5 h-5" />
        <span>
          Preview Mode — This is how your article will appear on the site (
          <span className="font-bold">{article.status}</span>)
        </span>
        <button
          onClick={onClose}
          className={`ml-4 px-3 py-1 rounded-md text-xs font-medium transition-colors ${colors.btn}`}
        >
          Back to Editor
        </button>
      </div>

      <main className="grow pt-8 pb-12 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ArticleHeader
          article={article}
          categoryName={categoryName}
        />
        <ArticleImage article={article} />
        <ArticleContent article={article} />
      </main>

      <Footer />
    </div>
  );
};

export default ArticlePreviewModal;
