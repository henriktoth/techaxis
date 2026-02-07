import type { Category } from "../../types";

interface NavbarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  onSearch: (query: string) => void;
}

const Navbar = ({ categories, selectedCategoryId, onSelectCategory, onSearch }: NavbarProps) => {
  
  const getNavItemClass = (isActive: boolean) =>
    `relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full cursor-pointer ${
      isActive
        ? "text-white bg-indigo-600/10 text-indigo-400 shadow-[0_0_20px_-5px_theme(colors.indigo.500/0.5)] border border-indigo-500/20"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl supports-backdrop-filter:bg-[#0B1120]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div 
            className="shrink-0 cursor-pointer group" 
            onClick={() => onSelectCategory(null)}
          >
            <span className="text-2xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all duration-500">
              TechAxis<span className="text-indigo-500">.</span>
            </span>
          </div>

          <div className="hidden xl:flex items-center space-x-2">
            <button
              onClick={() => onSelectCategory(null)}
              className={getNavItemClass(selectedCategoryId === null)}
            >
              Latest
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={getNavItemClass(selectedCategoryId === cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center ml-auto xl:ml-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..."
                className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 w-32 md:w-64 transition-all"
                onChange={(e) => onSearch(e.target.value)}
              />
              <svg className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

        </div>
      </div>
      
      <div className="xl:hidden border-t border-white/5 overflow-x-auto">
        <div className="flex px-4 py-3 space-x-3 min-w-max">
            <button
              onClick={() => onSelectCategory(null)}
              className={getNavItemClass(selectedCategoryId === null)}
            >
              Latest
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={getNavItemClass(selectedCategoryId === cat.id)}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;