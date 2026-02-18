import { Link, useLocation } from 'react-router-dom';
import type { User } from '../../types';
import { 
    LayoutDashboard, 
    Users, 
    LogOut, 
    ExternalLink,
    ClipboardList
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

const Sidebar = ({ user, onLogout }: SidebarProps) => {
  const location = useLocation();

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
        
        {user?.role === 'ADMIN' && (
            <NavItem to="/admin/users" icon={Users} title="Users" />
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-4 px-3 w-full">
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
        
        <button
            onClick={onLogout}
            title="Logout"
            className="flex items-center justify-center p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors mb-4 group relative"
        >
            <LogOut className="h-6 w-6" />
            <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                Logout
            </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
