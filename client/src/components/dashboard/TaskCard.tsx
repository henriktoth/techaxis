import { Check, Calendar, User as UserIcon, Edit, Trash2, PenTool } from 'lucide-react';
import type { Task, User } from '../../types';

interface TaskCardProps {
    task: Task;
    currentUser: User | null;
    isCompleted: boolean;
    hasUnsavedChanges: boolean;
    onToggleStatus: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onTake: (id: number) => void;
    onDrop: (id: number) => void;
    onWriteArticle: (id: number) => void;
}

const TaskCard = ({
    task,
    currentUser,
    isCompleted,
    hasUnsavedChanges,
    onToggleStatus,
    onEdit,
    onDelete,
    onTake,
    onDrop,
    onWriteArticle
}: TaskCardProps) => {
    const canToggle = currentUser?.role === 'ADMIN' || (currentUser?.role === 'WRITER' && task.assignedToId === currentUser?.id && !task.isCompleted);

    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-opacity duration-200 ${isCompleted ? 'opacity-75' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => canToggle && onToggleStatus(task.id)}
                        disabled={!canToggle}
                        className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : canToggle 
                                    ? 'border-gray-300 hover:border-blue-500 cursor-pointer'
                                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                        }`}
                        title={!canToggle ? "You can only complete tasks assigned to you" : "Toggle status"}
                    >
                        {isCompleted && <Check size={14} />}
                    </button>
                    <div>
                        <h3 className={`font-semibold text-lg ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{task.description}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                            {task.dueDate ? (
                                <div className={`flex items-center gap-1 ${
                                    !isCompleted && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) 
                                    ? 'text-red-600 font-medium' 
                                    : ''
                                }`}>
                                    <Calendar size={16} />
                                    <span>
                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                        {!isCompleted && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                                            <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Overdue</span>
                                        )}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Calendar size={16} />
                                    <span>No Due Date</span>
                                </div>
                            )}
                            {task.assignedTo ? (
                                <div className="flex items-center gap-1">
                                    <UserIcon size={16} />
                                    <span>Assigned to: {task.assignedTo.name}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-gray-400">
                                    <UserIcon size={16} />
                                    <span>Unassigned</span>
                                </div>
                            )}
                            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                                task.priority === 2 ? 'bg-red-100 text-red-700' :
                                task.priority === 1 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                                {task.priority === 2 ? 'High Priority' : task.priority === 1 ? 'Medium Priority' : 'Low Priority'}
                            </div>
                        </div>
                    </div>
                </div>
                {currentUser?.role === 'ADMIN' && (
                    <div className="flex flex-col gap-2">
                        <button
                            disabled={hasUnsavedChanges}
                            onClick={() => onEdit(task.id)}
                            className={`text-gray-400 size-5 transition-colors ${hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500'}`}
                            title={hasUnsavedChanges ? "Save changes before editing" : "Edit"}
                        >
                            <Edit size={20} />
                        </button>
                        <button
                            disabled={hasUnsavedChanges}
                            onClick={() => onDelete(task.id)}
                            className={`text-gray-400 size-5 transition-colors ${hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'}`}
                            title={hasUnsavedChanges ? "Save changes before deleting" : "Delete"}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}
                {currentUser?.role === 'WRITER' && !task.assignedToId && (
                    <div className="flex flex-col justify-center h-full">
                        <button
                            onClick={() => onTake(task.id)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors whitespace-nowrap shadow-sm"
                        >
                            Take Task
                        </button>
                    </div>
                )}
                {currentUser?.role === 'WRITER' && task.assignedToId === currentUser.id && (
                     <div className="flex flex-col justify-center gap-2 h-full">
                         {!isCompleted && !task.article && (
                            <button
                                onClick={() => onWriteArticle(task.id)}
                                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 flex items-center gap-2 justify-center"
                                title="Write article for this task"
                            >
                                <PenTool size={16} />
                                Write Article
                            </button>
                         )}
                         {task.article && (
                            <div className="px-4 py-2 rounded-lg font-medium text-sm text-green-600 bg-green-50 border border-green-200 flex items-center gap-2 justify-center whitespace-nowrap">
                                <Check size={16} />
                                Article Created
                            </div>
                         )}
                         <button
                             onClick={() => onDrop(task.id)}
                             disabled={isCompleted}
                             className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap border ${
                                isCompleted 
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                    : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                             }`}
                             title={isCompleted ? "You cannot drop a completed task" : "Drop Task"}
                         >
                             Drop Task
                         </button>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default TaskCard;
