import { Link } from 'react-router-dom';
import type { User } from '../../types';

interface DashboardHeaderProps {
  user: User | null;
  onLogout: () => void;
}

const DashboardHeader = ({ user, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span> ({user?.role})
        </p>
      </div>
      <div className="flex gap-3">
        {user?.role === 'ADMIN' && (
          <Link 
            to="/admin/users"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
          >
            Manage Users
          </Link>
        )}
        <Link 
          to="/"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          View Site
        </Link>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
