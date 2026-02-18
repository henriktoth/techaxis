import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { Task, User } from '../types';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Plus, Check, Calendar, User as UserIcon, Trash2, Edit, Save } from 'lucide-react';

import { useNavigate, useBlocker } from 'react-router-dom';

const Tasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<number, boolean>>({});

    const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker?.state === "blocked") {
            const confirmLeave = window.confirm("You have unsaved changes. Do you want to leave without saving?");
            if (confirmLeave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        fetchData();
    }, []);


    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const [tasksRes, userDataRes] = await Promise.all([
                axios.get('http://localhost:8000/api/tasks', config),
                 axios.get('http://localhost:8000/api/auth/me', config)
            ]);

            setTasks(tasksRes.data);
            setCurrentUser(userDataRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
            toast.success('Task deleted successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete task');
        }
    };

    const handleSaveChanges = async () => {
        try {
            const token = localStorage.getItem('token');
            const updates = Object.entries(pendingChanges).map(async ([taskIdStr, newStatus]) => {
                const id = Number(taskIdStr);
                const task = tasks.find(t => t.id === id);
                if (!task) return;

                if (task.isCompleted !== newStatus) {
                    await axios.patch(`http://localhost:8000/api/tasks/${id}/toggle-status`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            });

            await Promise.all(updates);
            setPendingChanges({});
            fetchData();
            toast.success('Tasks updated successfully');
        } catch (err) {
            console.error('Failed to save changes:', err);
            toast.error('Failed to save changes');
        }
    };

    const toggleTaskStatus = (id: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        setPendingChanges(prev => {
            const currentPending = prev[id];
          
            const currentState = currentPending !== undefined ? currentPending : task.isCompleted;
            const newState = !currentState;

            const newChanges = { ...prev };

            if (newState === task.isCompleted) {
                delete newChanges[id];
            } else {
                newChanges[id] = newState;
            }
            return newChanges;
        });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <DashboardLayout user={currentUser} onLogout={handleLogout}>
            <div className="p-8 pt-24">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
                    {currentUser?.role === 'ADMIN' && (
                        <button
                            onClick={() => navigate('/admin/tasks/create')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Create Task
                        </button>
                    )}
                </div>

                {hasUnsavedChanges && (
                    <div className="fixed bottom-8 right-8 z-50 animate-bounce">
                        <button
                            onClick={handleSaveChanges}
                            className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 flex items-center gap-2 font-semibold transition-transform hover:scale-105"
                        >
                            <Save size={20} />
                            Save Changes ({Object.keys(pendingChanges).length})
                        </button>
                    </div>
                )}

                <div className="grid gap-4">
                    {tasks.map(task => {
                        const isCompleted = pendingChanges[task.id] !== undefined 
                            ? pendingChanges[task.id] 
                            : task.isCompleted;
                        
                        return (
                        <div key={task.id} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-opacity duration-200 ${isCompleted ? 'opacity-75' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => toggleTaskStatus(task.id)}
                                        className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            isCompleted
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300 hover:border-blue-500'
                                        }`}
                                    >
                                        {isCompleted && <Check size={14} />}
                                    </button>
                                    <div>
                                        <h3 className={`font-semibold text-lg ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                            {task.title}
                                        </h3>
                                        <p className="text-gray-600 mt-1">{task.description}</p>
                                        
                                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                                            {task.dueDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={16} />
                                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {task.assignedTo && (
                                                <div className="flex items-center gap-1">
                                                    <UserIcon size={16} />
                                                    <span>Assigned to: {task.assignedTo.name}</span>
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
                                            onClick={() => navigate(`/admin/tasks/edit/${task.id}`)}
                                            className={`text-gray-400 size-5 transition-colors ${hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500'}`}
                                            title={hasUnsavedChanges ? "Save changes before editing" : "Edit"}
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            disabled={hasUnsavedChanges}
                                            onClick={() => handleDeleteTask(task.id)}
                                            className={`text-gray-400 size-5 transition-colors ${hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'}`}
                                            title={hasUnsavedChanges ? "Save changes before deleting" : "Delete"}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                    {tasks.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            No tasks found.
                        </div>
                    )}
                </div>
            </div>
        </div>
        </DashboardLayout>
    );
};

export default Tasks;
