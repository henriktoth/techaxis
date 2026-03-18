import { Edit, Trash2, Shield, PenTool, Ban, CheckCircle } from 'lucide-react';
import type { User } from '../../types';
import { isAdminRole, isSuperAdmin } from '../../utils/roles';

interface UserCardProps {
    user: User;
    currentUser: User | null;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onToggleDisabled?: (id: number) => void;
}

const UserCard = ({
    user,
    currentUser,
    onEdit,
    onDelete,
    onToggleDisabled,
}: UserCardProps) => {

    
    const canManage = isAdminRole(currentUser?.role);

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
            user.isDisabled ? 'border-red-300 bg-red-50/30 opacity-75' : 'border-gray-200'
        }`}>
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        user.isDisabled ? 'bg-red-100 text-red-600' :
                        user.role === 'SUPERADMIN' ? 'bg-amber-100 text-amber-600' :
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
                        user.role === 'WRITER' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {user.isDisabled ? <Ban size={20} /> :
                         user.role === 'SUPERADMIN' ? <Shield size={20} /> :
                         user.role === 'ADMIN' ? <Shield size={20} /> :
                         user.role === 'WRITER' ? <PenTool size={20} /> :
                         <span className="font-bold text-sm">{user.name.charAt(0)}</span>}
                    </div>
                    <div className="min-w-0 pr-2">
                        <h3 className="font-semibold text-lg text-gray-900 flex flex-wrap items-center gap-2">
                            <span>{user.name}</span>
                            {user.id === currentUser?.id && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 shrink-0">
                                    You
                                </span>
                            )}
                        </h3>
                        <p className="text-gray-600 mt-1 break-words">{user.email}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                user.role === 'SUPERADMIN' ? 'bg-amber-100 text-amber-700' :
                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'WRITER' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {user.role}
                            </span>
                            {user.isDisabled && (
                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                                    DISABLED
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                {canManage && (
                    <div className="flex gap-2">
                        {onToggleDisabled && (
                            isSuperAdmin(currentUser?.role) ? user.role !== 'SUPERADMIN' : !isAdminRole(user.role)
                        ) && (
                            <button
                                onClick={() => onToggleDisabled(user.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                    user.isDisabled
                                        ? 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                                        : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                                }`}
                                title={user.isDisabled ? 'Enable Account' : 'Disable Account'}
                            >
                                {user.isDisabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                            </button>
                        )}
                        {(user.id === currentUser?.id || (isSuperAdmin(currentUser?.role) ? user.role !== 'SUPERADMIN' : !isAdminRole(user.role))) && (
                            <button
                                onClick={() => onEdit(user.id)}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit User"
                            >
                                <Edit size={18} />
                            </button>
                        )}
                        {(isSuperAdmin(currentUser?.role) ? user.role !== 'SUPERADMIN' : !isAdminRole(user.role)) && (
                            <button
                                onClick={() => onDelete(user.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserCard;
