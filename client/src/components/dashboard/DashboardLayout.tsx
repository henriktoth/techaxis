import type { User } from '../../types';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const DashboardLayout = ({ children, user, onLogout }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - fixed width */}
      <Sidebar user={user} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="flex-1 ml-20 transition-all duration-300 relative">
        
        {/* User Profile - Floating Top Right */}
        {user && (
            <div className="absolute top-10 right-8 z-10 flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize leading-tight">{user.role.toLowerCase()}</p>
                </div>
                <div className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold shadow-sm text-sm border-2 border-white">
                    {user.name.charAt(0).toUpperCase()}
                </div>
            </div>
        )}

        {/* Page Content */}
        <div>
            {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
