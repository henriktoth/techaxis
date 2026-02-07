const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 md:px-12 lg:px-24 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 w-full">
            <svg className="w-20 h-20 text-slate-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-3xl font-bold text-white mb-3">No articles found</h3>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">We couldn't find any content matching your criteria. Try adjusting your search or category.</p>
        </div>
    );
}

export default EmptyState;