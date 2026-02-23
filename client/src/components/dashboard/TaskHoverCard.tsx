import { Calendar, ClipboardList } from 'lucide-react';

interface TaskHoverCardProps {
  task: {
    id: number;
    title: string;
    description: string;
    priority: number;
    dueDate: string | null;
    isCompleted: boolean;
  };
}

const TaskHoverCard = ({ task }: TaskHoverCardProps) => {
  return (
    <div className="absolute z-50 invisible group-hover:visible left-0 bottom-full mb-8 w-72 text-left opacity-0 group-hover:opacity-100 transition-all duration-200">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 relative">
        
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={`mt-1 p-2 rounded-lg shrink-0 ${
              task.isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <ClipboardList size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{task.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
                  ${
                    task.priority === 2 ? 'bg-red-100 text-red-700' :
                    task.priority === 1 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                  {task.priority === 2 ? 'High' : task.priority === 1 ? 'Medium' : 'Low'}
                </span>
                {task.isCompleted && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-green-100 text-green-700">
                    Done
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
            {task.description}
          </p>

          {task.dueDate && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
              <Calendar size={14} />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskHoverCard;
