interface StatsOverviewProps {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  reviewCount: number;
}

const StatsOverview = ({ totalArticles, publishedCount, draftCount, reviewCount }: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider">Total</h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{totalArticles}</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-200">
        <h3 className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider">Published</h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{publishedCount}</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-200">
        <h3 className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider">In Review</h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{reviewCount}</p>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-200">
        <h3 className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider">Drafts</h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{draftCount}</p>
      </div>
    </div>
  );
};


export default StatsOverview;
