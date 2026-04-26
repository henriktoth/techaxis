import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Heart, LayoutGrid, LogOut, Search, User as UserIcon } from "lucide-react";
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
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const desktopCategoryMenuRef = useRef<HTMLDivElement>(null);
  const mobileCategoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      const clickedOutsideDesktop = desktopCategoryMenuRef.current
        && !desktopCategoryMenuRef.current.contains(e.target as Node);
      const clickedOutsideMobile = mobileCategoryMenuRef.current
        && !mobileCategoryMenuRef.current.contains(e.target as Node);
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setShowCategoryMenu(false);
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

  const limitedCategories = categories;
  const showCategoryDropdown = limitedCategories.length > 5;
  const visibleCategories = showCategoryDropdown ? [] : limitedCategories;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl supports-backdrop-filter:bg-[#0B1120]/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-20">
          <div
            className="shrink-0 cursor-pointer group"
            onClick={() => onSelectCategory(null)}
          >
            <span className="text-2xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all duration-500">
              TechAxis<span className="text-indigo-500">.</span>
            </span>
          </div>

          <div className="hidden xl:flex items-center space-x-2 xl:ml-8 xl:mr-3">
            <button
              onClick={() => onSelectCategory(null)}
              className={getNavItemClass(selectedCategoryId === null)}
            >
              Latest
            </button>

            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={getNavItemClass(selectedCategoryId === cat.id)}
              >
                {cat.name}
              </button>
            ))}

            {showCategoryDropdown && (
              <div className="relative" ref={desktopCategoryMenuRef}>
                <button
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className={getNavItemClass(limitedCategories.some((cat) => cat.id === selectedCategoryId))}
                >
                  Categories
                  <ChevronDown
                    className={`ml-2 inline-block h-4 w-4 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showCategoryMenu && (
                  <div className="absolute left-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-xl bg-[#0F172A] border border-white/10 shadow-xl z-50">
                    <div className="py-2">
                      {limitedCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onSelectCategory(cat.id);
                            setShowCategoryMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedCategoryId === cat.id
                              ? 'text-indigo-300 bg-white/5'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center ml-auto xl:ml-6 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 w-32 md:w-64 transition-all"
                onChange={(e) => onSearch(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" strokeWidth={2} />
            </div>

            {user ? (
              <>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#1F2937] border border-white/10 rounded-xl shadow-xl py-2 z-80">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      {(user.role === 'WRITER' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                        <button
                          onClick={() => { navigate('/admin/dashboard'); setShowUserMenu(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-colors flex items-center gap-2 font-medium"
                        >
                          <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                          DASHBOARD
                        </button>
                      )}
                      <button
                        onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4" strokeWidth={2} />
                        Profile
                      </button>
                      <button
                        onClick={() => { navigate('/favorites'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <Heart className="w-4 h-4" strokeWidth={2} />
                        My Favorites
                      </button>
                      <button
                        onClick={() => { onSignOut?.(); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={2} />
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
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all duration-200 hover:shadow-[0_0_20px_-5px_--theme(--color-indigo-500/0.5)]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="xl:hidden border-t border-white/5 relative z-60">
        <div className="px-4 py-3 overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <div className="flex w-max space-x-3 pr-4">
            <button
              onClick={() => onSelectCategory(null)}
              className={getNavItemClass(selectedCategoryId === null)}
            >
              Latest
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={getNavItemClass(selectedCategoryId === cat.id)}
              >
                {cat.name}
              </button>
            ))}

            {showCategoryDropdown && (
              <div className="relative" ref={mobileCategoryMenuRef}>
                <button
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className={getNavItemClass(limitedCategories.some((cat) => cat.id === selectedCategoryId))}
                >
                  Categories
                  <ChevronDown
                    className={`ml-2 inline-block h-4 w-4 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showCategoryMenu && (
                  <div className="fixed left-4 right-4 top-34 max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain rounded-xl bg-[#0F172A] border border-white/10 shadow-xl z-70">
                    <div className="py-2">
                      {limitedCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onSelectCategory(cat.id);
                            setShowCategoryMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedCategoryId === cat.id
                              ? 'text-indigo-300 bg-white/5'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
