import { Edit, Trash2, Shield, PenTool } from 'lucide-react';
import type { User } from '../../types';

interface UserCardProps {
    user: User;
    currentUser: User | null;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

const UserCard = ({
    user,
    currentUser,
    onEdit,
    onDelete
}: UserCardProps) => {
    
    // Only admins can edit/delete, but usually they can't delete themselves in this UI context without issues, 
    // but the backend handles permissions. 
    // Generally, in User management, Admin can do anything.
    const canManage = currentUser?.role === 'ADMIN';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 
                        user.role === 'WRITER' ? 'bg-blue-100 text-blue-600' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {user.role === 'ADMIN' ? <Shield size={20} /> : 
                         user.role === 'WRITER' ? <PenTool size={20} /> : 
                         <span className="font-bold text-sm">{user.name.charAt(0)}</span>}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                            {user.name}
                        </h3>
                        <p className="text-gray-600 mt-1">{user.email}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                                user.role === 'WRITER' ? 'bg-blue-100 text-blue-700' : 
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
                
                {canManage && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(user.id)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={() => onDelete(user.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserCard;
