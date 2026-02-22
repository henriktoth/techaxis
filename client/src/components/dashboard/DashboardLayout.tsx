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

      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 ml-20 transition-all duration-300 relative">
        
        <div>
            {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
