import type { Category } from "../types";

interface NavbarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

const Navbar = ({ categories, selectedCategoryId, onSelectCategory }: NavbarProps) => {
  
  const getNavItemClass = (isActive: boolean) =>
    `relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full ${
      isActive
        ? "text-white bg-indigo-600/10 text-indigo-400 shadow-[0_0_20px_-5px_theme(colors.indigo.500/0.5)] border border-indigo-500/20"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0B1120]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer group" 
            onClick={() => onSelectCategory(null)}
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all duration-500">
              TechAxis<span className="text-indigo-500">.</span>
            </span>
          </div>

          {/* Categories */}
          <div className="hidden md:flex items-center space-x-2">
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

           {/* Mobile Menu Button (Simplified for now, could be expanded) */}
           <div className="md:hidden">
              <div className="h-6 w-6 text-slate-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
           </div>
        </div>
      </div>
      
      {/* Mobile Category Bar (Horizontal Scroll) */}
      <div className="md:hidden border-t border-white/5 overflow-x-auto">
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