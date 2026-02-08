import type { Article, User } from '../../types';
import AuthorHoverCard from './AuthorHoverCard';

interface ArticleTableProps {
  articles: Article[];
  sortField: keyof Article | 'author';
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Article | 'author') => void;
  user: User | null;
  authors: Record<number, User>;
  onDelete: (id: number) => void;
  searchQuery: string;
}

const ArticleTable = ({ articles, sortField, sortDirection, onSort, user, authors, onDelete, searchQuery }: ArticleTableProps) => {
  return (
    <div className="overflow-x-auto lg:overflow-visible pb-4">
      <table className="w-full text-left text-sm text-gray-600 min-w-200">
        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('title')}>
              <div className="flex items-center gap-1">
                Title
                {sortField === 'title' && (
                  <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                )}
              </div>
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('status')}>
              <div className="flex items-center gap-1">
                Status
                {sortField === 'status' && (
                  <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                )}
              </div>
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('publishedAt')}>
              <div className="flex items-center gap-1">
                Date
                {sortField === 'publishedAt' && (
                  <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                )}
              </div>
            </th>
            {user?.role === 'ADMIN' && (
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('author')}>
                <div className="flex items-center gap-1">
                  Author
                  {sortField === 'author' && (
                    <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
            )}
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {articles.length === 0 ? (
            <tr>
              <td colSpan={user?.role === 'ADMIN' ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                {searchQuery ? 'No articles found matching your search.' : 'No articles found. Start writing!'}
              </td>
            </tr>
          ) : (
            articles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {article.title}
                  <div className="text-xs text-gray-400 font-normal mt-0.5 max-w-xs truncate">
                    /{article.slug}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      article.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {article.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(article.createdAt || article.publishedAt || Date.now()).toLocaleDateString()}
                </td>
                {user?.role === 'ADMIN' && (
                  <td className="px-6 py-4 relative group">
                    {article.authorId && authors[article.authorId] ? (
                      <>
                        <button className="text-gray-900 font-medium hover:text-blue-600 focus:outline-none cursor-pointer border-b border-dotted border-gray-400">
                          {authors[article.authorId].name} <span className="text-gray-500 font-normal text-xs">({authors[article.authorId].role})</span>
                        </button>
                        <AuthorHoverCard author={authors[article.authorId]} />
                      </>
                    ) : (
                      <span className="text-gray-400">
                        {article.authorId ? 'Loading...' : 'N/A'}
                      </span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium cursor-pointer">Edit</button>
                  <button
                    onClick={() => onDelete(article.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleTable;
