interface ArticleFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  title: string;
  onNewArticle: () => void;
}

const ArticleFilters = ({ searchQuery, setSearchQuery, title, onNewArticle }: ArticleFiltersProps) => {
  return (
    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h2 className="text-xl font-bold text-gray-900">
        {title}
      </h2>
      <div className="flex gap-4 w-full sm:w-auto">
        <div className="relative grow sm:grow-0">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
          onClick={onNewArticle}
        >
          + New Article
        </button>
      </div>
    </div>
  );
};

export default ArticleFilters;
