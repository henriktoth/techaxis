interface StatsOverviewProps {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
}

const StatsOverview = ({ totalArticles, publishedCount, draftCount }: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Articles</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{totalArticles}</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Published</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{publishedCount}</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Drafts</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{draftCount}</p>
      </div>
    </div>
  );
};

export default StatsOverview;
