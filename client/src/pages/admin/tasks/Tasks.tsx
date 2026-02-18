import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import type { Task, User } from '../../../types';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import TaskCard from '../../../components/dashboard/TaskCard';
import { Plus, Save } from 'lucide-react';

import { useNavigate, useBlocker } from 'react-router-dom';

const Tasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<number, boolean>>({});

    const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

    //BLOCKER: Warn about unsaved changes when navigating away
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
    );

    //EFFECT: Show confirmation dialog if there are unsaved changes when trying to navigate away
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

    //EFFECT: Warn about unsaved changes when trying to close the tab or refresh the page
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

    //EFFECT: Calls fetchData on component mount
    useEffect(() => {
        fetchData();
    }, []);

    //FETCH: Tasks + user details (calls: GET /api/tasks, GET /api/auth/me)
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
            toast.error('Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    };

    //HANDLER: Logout (deletes token, redirects to login)
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    //HANDLER: Delete task (calls: DELETE /api/tasks/:id)
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

    //HANDLER: Save changes (calls: PATCH /api/tasks/:id/toggle-status for each changed task)
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

    //HANDLER: Toggle task completion status (updates pendingChanges state)
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

    //HANDLER: Take task (calls: POST /api/tasks/:id/take)
    const handleTakeTask = async (id: number) => {
        if (!confirm('Are you sure you want to take this task?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8000/api/tasks/${id}/take`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchData();
            toast.success('You have successfully took the task');
        } catch (err) {
            console.error(err);
            let message = 'Failed to take task';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            }
            toast.error(message);
        }
    };

    //HANDLER: Drop task (calls: POST /api/tasks/:id/drop)
    const handleDropTask = async (id: number) => {
        if (!confirm('Are you sure you want to drop this task?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8000/api/tasks/${id}/drop`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchData();
            toast.success('You have successfully dropped the task');
        } catch (err) {
            console.error(err);
            let message = 'Failed to drop task';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            }
            toast.error(message);
        }
    };

    //CONSTANTS: Separate tasks into "My Tasks" and "Unassigned Tasks"
    const myTasks = tasks.filter(task => {
        return !!task.assignedToId;
    });
    const unassignedTasks = tasks.filter(task => !task.assignedToId);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

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

                {/* My Tasks Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {currentUser?.role === 'ADMIN' ? 'All Assigned Tasks' : 'My Tasks'}
                    </h2>
                    <div className="grid gap-4">
                        {myTasks.map(task => {
                            const isCompleted = pendingChanges[task.id] !== undefined 
                                ? pendingChanges[task.id] 
                                : task.isCompleted;
                            
                            return (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    currentUser={currentUser}
                                    isCompleted={isCompleted}
                                    hasUnsavedChanges={hasUnsavedChanges}
                                    onToggleStatus={toggleTaskStatus}
                                    onEdit={() => navigate(`/admin/tasks/edit/${task.id}`)}
                                    onDelete={handleDeleteTask}
                                    onTake={handleTakeTask}
                                    onDrop={handleDropTask}
                                />
                            );
                        })}
                        {myTasks.length === 0 && (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                No tasks found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Unassigned Tasks Section */}
                {(currentUser?.role === 'WRITER' || currentUser?.role === 'ADMIN') && (
                    <div className="space-y-4 mt-8 pt-6 border-t border-gray-200">

                        <h2 className="text-xl font-semibold text-gray-800">
                            {currentUser?.role === 'ADMIN' ? 'Unassigned Tasks' : 'Available Tasks'}
                        </h2>
                        <div className="grid gap-4">
                            {unassignedTasks.map(task => {
                                const isCompleted = pendingChanges[task.id] !== undefined 
                                    ? pendingChanges[task.id] 
                                    : task.isCompleted;
                                
                                return (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        currentUser={currentUser}
                                        isCompleted={isCompleted}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                        onToggleStatus={toggleTaskStatus}
                                        onEdit={() => navigate(`/admin/tasks/edit/${task.id}`)}
                                        onDelete={handleDeleteTask}
                                        onTake={handleTakeTask}
                                        onDrop={handleDropTask}
                                    />
                                );
                            })}
                            {unassignedTasks.length === 0 && (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No available tasks.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </DashboardLayout>
    );
};

export default Tasks;
