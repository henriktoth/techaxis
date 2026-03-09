import type { User } from '../../types';

interface AuthorHoverCardProps {
  author: User;
}

const AuthorHoverCard = ({ author }: AuthorHoverCardProps) => {
  return (
    <div className="absolute z-100 hidden group-hover:block left-0 bottom-full mb-2 w-64 text-left">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 relative">
        
        <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
        
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              {author.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{author.name}</h4>
            <p className="text-xs text-gray-500 break-all">{author.email}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                ${author.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                  author.role === 'WRITER' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {author.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorHoverCard;
