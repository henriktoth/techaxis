import { Link } from 'react-router-dom';
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
            <th className="px-6 py-4 text-left" colSpan={3}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {articles.length === 0 ? (
            <tr>
              <td colSpan={user?.role === 'ADMIN' ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
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
                
                {/* Read Action */}
                <td className="px-2 py-4 text-center w-20">
                  {article.status === 'PUBLISHED' ? (
                    <Link
                      to={`/article/${article.slug}`}
                      title="Read Article"
                      className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors inline-block"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="p-2 bg-gray-50 text-gray-300 rounded-md inline-block select-none cursor-not-allowed">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                  )}
                </td>

                {/* Edit Action */}
                <td className="px-2 py-4 text-center w-20">
                  <Link
                    to={`/admin/article/edit/${article.id}`}
                    type="button"
                    title="Edit Article"
                    className={`p-2 rounded-md transition-colors inline-block ${
                      (user?.role === 'ADMIN' || article.status !== 'PUBLISHED')
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </Link>
                </td>

                {/* Delete Action */}
                <td className="px-2 py-4 text-center w-20">
                  <button
                    onClick={() => onDelete(article.id)}
                    disabled={!(user?.role === 'ADMIN' || article.status !== 'PUBLISHED')}
                    title="Delete Article"
                    className={`p-2 rounded-md transition-colors ${
                      (user?.role === 'ADMIN' || article.status !== 'PUBLISHED')
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
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
