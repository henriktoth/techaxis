import { Link } from 'react-router-dom';
import { BadgeCheck, CircleX, Eye, Pencil, Trash2 } from 'lucide-react';
import type { Article, User } from '../../types';
import AuthorHoverCard from './AuthorHoverCard';
import TaskHoverCard from './TaskHoverCard';
import { isAdminRole } from '../../utils/roles';

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

const TaskBadge = ({ article }: { article: Article }) => {
  if (!article.task) return <span className="text-gray-400">-</span>;

  return (
    <div className="relative group cursor-help inline-block">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
        Task #{article.task.id}
      </span>
      <TaskHoverCard task={article.task} />
    </div>
  );
};

const ArticleTable = ({ articles, sortField, sortDirection, onSort, user, authors, onDelete, searchQuery }: ArticleTableProps) => {

    const canEdit = (article: Article) => {
        if (!user) return false;
        if (isAdminRole(user.role)) {
            if (article.authorId !== user.id && article.status === 'DRAFT') return false;
            return true;
        }
        return article.authorId === user.id && article.status !== 'PUBLISHED' && article.status !== 'SCHEDULED';
    }

    const canDelete = (article: Article) => {
        if (!user) return false;
        if (isAdminRole(user.role)) return true;
        return article.authorId === user.id && article.status !== 'PUBLISHED' && article.status !== 'SCHEDULED';
    }

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

            <th className="px-6 py-4">
              <div className="flex items-center gap-1">
                Task
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

            {isAdminRole(user?.role) && (
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('author')}>
                <div className="flex items-center gap-1">
                  Author
                  {sortField === 'author' && (
                    <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                  )}
                </div>
              </th>
            )}

            <th className="px-6 py-4 text-left" colSpan={isAdminRole(user?.role) ? 4 : 3}>Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {articles.length === 0 ? (
            <tr>
              <td colSpan={isAdminRole(user?.role) ? 9 : 7} className="px-6 py-8 text-center text-gray-500">
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
                  <div className={`relative inline-block ${article.status === 'REJECTED' && article.rejectionReason ? 'group/status cursor-help' : ''}`}>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        article.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        article.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        article.status === 'REVIEW' ? 'bg-blue-100 text-blue-800' :
                        article.status === 'SCHEDULED' ? 'bg-orange-100 text-orange-800' :
                        article.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {article.status}
                    </span>
                    {article.status === 'REJECTED' && article.rejectionReason && (
                      <div className="absolute z-50 invisible group-hover/status:visible left-0 bottom-full mb-3 w-72 text-left opacity-0 group-hover/status:opacity-100 transition-all duration-200">
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 relative">
                          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                                <CircleX size={16} />
                              </div>
                              <h4 className="text-sm font-bold text-gray-900">Rejection Reason</h4>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{article.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {article.status === 'SCHEDULED' && article.scheduledAt && (
                    <div className="text-xs text-orange-600 mt-0.5">
                      {new Date(article.scheduledAt).toLocaleString()}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  <TaskBadge article={article} />
                </td>

                <td className="px-6 py-4">
                  {new Date(article.createdAt || article.publishedAt || Date.now()).toLocaleDateString()}
                </td>

                {isAdminRole(user?.role) && (
                  <td className="px-6 py-4 relative group">
                    {article.authorId && authors[article.authorId] ? (
                      <>
                        <button className="text-left focus:outline-none cursor-pointer group-hover:bg-gray-50 rounded p-1 -ml-1 transition-colors">
                          <div className="text-gray-900 font-medium hover:text-blue-600">
                            {authors[article.authorId].name}
                          </div>
                          <div className="text-gray-500 font-normal text-xs">
                            {authors[article.authorId].role}
                          </div>
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
                
                <td className="px-2 py-4 text-center w-20">
                  {article.status === 'PUBLISHED' ? (
                    <Link
                      to={`/article/${article.slug}`}
                      title="Read Article"
                      className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors inline-block"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/admin/article/preview/${article.id}`}
                      title="Preview Article"
                      className="p-2 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 transition-colors inline-block"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  )}
                </td>

                {isAdminRole(user?.role) && (
                  <td className="px-2 py-4 text-center w-20">
                    {article.status === 'DRAFT' || article.authorId === user?.id ? (
                      <span
                        title={article.authorId === user?.id ? "Cannot review your own articles" : "Cannot review draft articles"}
                        className="p-2 rounded-md inline-block bg-gray-50 text-gray-300 cursor-not-allowed"
                      >
                        <BadgeCheck className="w-5 h-5" />
                      </span>
                    ) : (
                    <Link
                      to={`/admin/article/review/${article.id}`}
                      title={article.status === 'PUBLISHED' ? "Re-review Article" : "Review Article"}
                      className={`p-2 rounded-md transition-colors inline-block cursor-pointer ${
                        article.status === 'PUBLISHED' 
                          ? 'bg-purple-50 text-purple-300 hover:bg-purple-100 hover:text-purple-600' 
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      }`}
                    >
                      <BadgeCheck className="w-5 h-5" />
                    </Link>
                    )}
                  </td>
                )}

                <td className="px-2 py-4 text-center w-20">
                  <Link
                    to={`/admin/article/edit/${article.id}`}
                    type="button"
                    title="Edit Article"
                    className={`p-2 rounded-md transition-colors inline-block ${
                      canEdit(article)
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                </td>

                <td className="px-2 py-4 text-center w-20">
                  <button
                    onClick={() => onDelete(article.id)}
                    disabled={!canDelete(article)}
                    title="Delete Article"
                    className={`p-2 rounded-md transition-colors ${
                      canDelete(article)
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
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
