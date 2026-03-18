import type { Article } from "../../types";

interface ArticleContentProps {
  article: Article;
}

const ArticleContent = ({ article }: ArticleContentProps) => {
  return (
    <article className="prose prose-invert prose-lg max-w-none text-slate-300 ql-snow">
      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
};

export default ArticleContent;
