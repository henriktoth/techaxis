import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, UserSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { User } from '../../types';
import { isAdminRole } from '../../utils/roles';

interface ArticleFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  title: string;
  onNewArticle: () => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  taskFilter: string;
  setTaskFilter: (task: string) => void;
  authorFilter: string;
  setAuthorFilter: (author: string) => void;
  authors: Record<number, User>;
  user: User | null;
}

interface DropdownOption {
  value: string;
  label: string;
}

const FilterDropdown = ({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  icon?: LucideIcon;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full min-w-[160px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-left hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer"
      >
        {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
        <span className={`truncate grow ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {selected?.label || options[0]?.label}
        </span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {options.map(option => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => { onChange(option.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                    value === option.value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AuthorCombobox = ({
  authorFilter,
  setAuthorFilter,
  authors,
}: {
  authorFilter: string;
  setAuthorFilter: (v: string) => void;
  authors: Record<number, User>;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const authorList = Object.values(authors);
  const filtered = query
    ? authorList.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : authorList;

  const selectedAuthor = authorFilter ? authors[Number(authorFilter)] : null;

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">Author</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full min-w-[160px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-left hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer"
      >
        <UserSearch size={14} className="text-gray-400 shrink-0" />
        <span className={`truncate grow ${selectedAuthor ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedAuthor ? selectedAuthor.name : 'All Authors'}
        </span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search authors..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => { setAuthorFilter(''); setQuery(''); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                  !authorFilter ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Authors
              </button>
            </li>
            {filtered.map(author => (
              <li key={author.id}>
                <button
                  type="button"
                  onClick={() => { setAuthorFilter(String(author.id)); setQuery(''); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                    authorFilter === String(author.id)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {author.name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">No authors found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const statusOptions: DropdownOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'In Review' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'REJECTED', label: 'Rejected' },
];

const dateOptions: DropdownOption[] = [
  { value: '', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const taskOptions: DropdownOption[] = [
  { value: '', label: 'All Tasks' },
  { value: 'with', label: 'With Task' },
  { value: 'without', label: 'Without Task' },
];

const ArticleFilters = ({
  searchQuery, setSearchQuery, title, onNewArticle,
  statusFilter, setStatusFilter,
  dateFilter, setDateFilter,
  taskFilter, setTaskFilter,
  authorFilter, setAuthorFilter,
  authors, user,
}: ArticleFiltersProps) => {

  const hasActiveFilters = statusFilter || dateFilter || taskFilter || authorFilter;

  return (
    <div className="p-6 border-b border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
          onClick={onNewArticle}
        >
          + New Article
        </button>
      </div>

      <hr className="border-gray-100" />

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative grow min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />

        <FilterDropdown
          label="Date"
          value={dateFilter}
          onChange={setDateFilter}
          options={dateOptions}
        />

        <FilterDropdown
          label="Task"
          value={taskFilter}
          onChange={setTaskFilter}
          options={taskOptions}
        />

        {isAdminRole(user?.role) && (
          <AuthorCombobox
            authorFilter={authorFilter}
            setAuthorFilter={setAuthorFilter}
            authors={authors}
          />
        )}

        {hasActiveFilters && (
          <button
            onClick={() => { setStatusFilter(''); setDateFilter(''); setTaskFilter(''); setAuthorFilter(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer self-end"
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ArticleFilters;
