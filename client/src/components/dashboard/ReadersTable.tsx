import type { Reader } from '../../types';
import { Ban, CheckCircle, Trash2 } from 'lucide-react';

interface ReadersTableProps {
  readers: Reader[];
  sortField: 'name' | 'email' | 'favorites';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'email' | 'favorites') => void;
  onDelete: (id: number) => void;
  onToggleDisabled: (id: number) => void;
  searchQuery: string;
}

const ReadersTable = ({ readers, sortField, sortDirection, onSort, onDelete, onToggleDisabled, searchQuery }: ReadersTableProps) => {
  return (
    <div className="overflow-x-auto lg:overflow-visible pb-4">
      <table className="w-full text-left text-sm text-gray-600 min-w-200">
        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('name')}>
              <div className="flex items-center gap-1">
                Name
                {sortField === 'name' && (
                  <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                )}
              </div>
            </th>

            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('email')}>
              <div className="flex items-center gap-1">
                Email
                {sortField === 'email' && (
                  <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                )}
              </div>
            </th>

            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort('favorites')}>
              <div className="flex items-center gap-1">
                Favourites
                {sortField === 'favorites' && (
                  <span className="text-gray-400">{sortDirection === 'asc' ? '↓' : '↑'}</span>
                )}
              </div>
            </th>

            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {readers.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                {searchQuery ? 'No readers found matching your search.' : 'No readers found.'}
              </td>
            </tr>
          ) : (
            readers.map((reader) => (
              <tr key={reader.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {reader.name}
                    {reader.isDisabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        DISABLED
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {reader.email}
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {reader._count.favorites}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onToggleDisabled(reader.id)}
                      title={reader.isDisabled ? 'Enable Account' : 'Disable Account'}
                      className={`p-2 rounded-md transition-colors cursor-pointer ${
                        reader.isDisabled
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      }`}
                    >
                      {reader.isDisabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                    </button>

                    <button
                      onClick={() => onDelete(reader.id)}
                      title="Delete Account"
                      className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReadersTable;
