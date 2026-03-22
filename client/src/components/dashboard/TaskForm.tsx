import type { User } from '../../types';

interface TaskFormData {
    title: string;
    description: string;
    priority: number;
    dueDate: string;
    assignedToId: number | "";
}

interface TaskFormProps {
    formData: TaskFormData;
    setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
    users: User[];
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitText: string;
}

const TaskForm = ({
    formData,
    setFormData,
    users,
    onSubmit,
    onCancel,
    submitText
}: TaskFormProps) => {
    return (
        <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    rows={3}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    >
                        <option value={0}>Low</option>
                        <option value={1}>Medium</option>
                        <option value={2}>High</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                    value={formData.assignedToId}
                    onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, assignedToId: val === "" ? "" : Number(val) });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                    <option value="">Unassigned</option>
                    {(Array.isArray(users) ? users : [])
                        .filter(user => user.role !== 'READER')
                        .map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
            </div>
            <div className="pt-5 border-t border-gray-200 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {submitText}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;
