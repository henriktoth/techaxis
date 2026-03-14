import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Category, User } from "../../types";

interface NavbarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  onSearch: (query: string) => void;
  user?: User | null;
  onSignOut?: () => void;
}

const Navbar = ({ categories, selectedCategoryId, onSelectCategory, onSearch, user, onSignOut }: NavbarProps) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          <div className="flex items-center ml-auto xl:ml-4 gap-3">
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

            {user ? (
              <>
                <Link
                  to="/favorites"
                  className="relative p-2 text-slate-400 hover:text-indigo-400 transition-colors duration-200"
                  title="Favorites"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{user.name}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1F2937] border border-white/10 rounded-xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      {(user.role === 'WRITER' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                        <button
                          onClick={() => { navigate('/admin/dashboard'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-colors flex items-center gap-2 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          DASHBOARD
                        </button>
                      )}
                      <button
                        onClick={() => { navigate('/favorites'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        My Favorites
                      </button>
                      <button
                        onClick={() => { onSignOut?.(); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all duration-200 hover:shadow-[0_0_20px_-5px_theme(colors.indigo.500/0.5)]"
                >
                  Register
                </Link>
              </div>
            )}
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
