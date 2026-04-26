import { FileText } from 'lucide-react';

const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 md:px-12 lg:px-24 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 w-full">
            <FileText className="w-20 h-20 text-slate-700 mb-6" strokeWidth={1} />
            <h3 className="text-3xl font-bold text-white mb-3">No articles found</h3>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">We couldn't find any content matching your criteria. Try adjusting your search or category.</p>
        </div>
    );
}

export default EmptyState;