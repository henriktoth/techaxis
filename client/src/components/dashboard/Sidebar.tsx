import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { User } from '../../types';
import { 
    LayoutDashboard, 
    Users, 
    LogOut, 
    ExternalLink,
    ClipboardList,
    User as UserIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

const Sidebar = ({ user, onLogout }: SidebarProps) => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setShowUserMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const NavItem = ({ to, icon: Icon, title, exact = false }: { to: string; icon: LucideIcon; title: string; exact?: boolean }) => {
    const active = exact ? location.pathname === to : isActive(to);
    return (
        <Link
            to={to}
            title={title}
            className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative ${
                active 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <Icon className={`h-6 w-6 ${active ? 'text-white' : 'text-current'}`} />
            
            <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {title}
            </span>
        </Link>
    );
  };

  return (
    <div className="w-20 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col items-center py-6 z-50">
      
      <nav className="flex-1 flex flex-col gap-4 w-full px-3">
        <NavItem to="/admin/dashboard" icon={LayoutDashboard} title="Articles" exact={true} />
        <NavItem to="/admin/tasks" icon={ClipboardList} title="Tasks" />
        
        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
            <NavItem to="/admin/users" icon={Users} title="Users" />
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-4 px-3 w-full pb-4 items-center">
        <NotificationBell />
        <a 
            href="/" 
            target="_blank" 
            rel="noreferrer"
            title="View Website"
            className="flex items-center justify-center p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors group relative"
        >
            <ExternalLink className="h-6 w-6" />
             <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                View Website
            </span>
        </a>
        
        <div className="relative" ref={userMenuRef}>
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full hover:ring-2 hover:ring-blue-300 transition-all font-bold text-sm shadow-sm"
                title="User Menu"
            >
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
            </button>

            {showUserMenu && (
                <div 
                    className="absolute left-full bottom-0 ml-6 w-64 bg-white rounded-lg shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                    
                >
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="mt-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded capitalize inline-block">
                            {user?.role?.toLowerCase()}
                        </span>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors rounded-b-lg"
                    >
                        <LogOut size={16} />
                        Log out
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
