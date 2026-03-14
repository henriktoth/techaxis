import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, UserSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { User } from '../../types';
import { isAdminRole } from '../../utils/roles';

interface TaskFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (assignee: string) => void;
  assignees: Record<number, { name: string; email: string }>;
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

const AssigneeCombobox = ({
  assigneeFilter,
  setAssigneeFilter,
  assignees,
}: {
  assigneeFilter: string;
  setAssigneeFilter: (v: string) => void;
  assignees: Record<number, { name: string; email: string }>;
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

  const assigneeList = Object.entries(assignees).map(([id, data]) => ({ id: Number(id), ...data }));
  const filtered = query
    ? assigneeList.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : assigneeList;

  const selectedAssignee = assigneeFilter ? assignees[Number(assigneeFilter)] : null;

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">Assigned To</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full min-w-[160px] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-left hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer"
      >
        <UserSearch size={14} className="text-gray-400 shrink-0" />
        <span className={`truncate grow ${selectedAssignee ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedAssignee ? selectedAssignee.name : 'All Assignees'}
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
                placeholder="Search assignees..."
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
                onClick={() => { setAssigneeFilter(''); setQuery(''); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                  !assigneeFilter ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Assignees
              </button>
            </li>
            {filtered.map(assignee => (
              <li key={assignee.id}>
                <button
                  type="button"
                  onClick={() => { setAssigneeFilter(String(assignee.id)); setQuery(''); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                    assigneeFilter === String(assignee.id)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {assignee.name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400">No assignees found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const priorityOptions: DropdownOption[] = [
  { value: '', label: 'All Priorities' },
  { value: '0', label: 'Low' },
  { value: '1', label: 'Medium' },
  { value: '2', label: 'High' },
];

const dateOptions: DropdownOption[] = [
  { value: '', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const TaskFilters = ({
  searchQuery, setSearchQuery,
  priorityFilter, setPriorityFilter,
  dateFilter, setDateFilter,
  assigneeFilter, setAssigneeFilter,
  assignees, user,
}: TaskFiltersProps) => {

  const hasActiveFilters = priorityFilter || dateFilter || assigneeFilter;

  return (
    <div className="p-6 border-b border-gray-100 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative grow min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <FilterDropdown
          label="Priority"
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={priorityOptions}
        />

        <FilterDropdown
          label="Due Date"
          value={dateFilter}
          onChange={setDateFilter}
          options={dateOptions}
        />

        {isAdminRole(user?.role) && (
          <AssigneeCombobox
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            assignees={assignees}
          />
        )}

        {hasActiveFilters && (
          <button
            onClick={() => { setPriorityFilter(''); setDateFilter(''); setAssigneeFilter(''); }}
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

export default TaskFilters;
