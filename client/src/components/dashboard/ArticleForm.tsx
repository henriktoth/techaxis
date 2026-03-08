import { useRef, useState } from 'react';
import type { Article, Category, User, Task } from '../../types';

interface ArticleFormProps {
  formData: {
    title: string;
    summary: string;
    content: string;
    thumbnail: string;
    categoryId: number;
    status: Article['status'];
    isFeatured: boolean;
    taskId?: number | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  thumbnailFile: File | null;
  setThumbnailFile: React.Dispatch<React.SetStateAction<File | null>>;
  removeThumbnail: boolean;
  setRemoveThumbnail: React.Dispatch<React.SetStateAction<boolean>>;
  categories: Category[];
  tasks?: Task[];
  user: User | null;
  slug?: string;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isRestricted?: boolean;
  isOwnArticle?: boolean;
}

const ArticleForm = ({
  formData,
  setFormData,
  thumbnailFile,
  setThumbnailFile,
  removeThumbnail,
  setRemoveThumbnail,
  categories,
  tasks,
  user,
  slug,
  saving,
  onSubmit,
  onCancel,
  isRestricted = false,
  isOwnArticle = false,
}: ArticleFormProps) => {
  const isWriter = user?.role === 'WRITER';
  const isAdmin = user?.role === 'ADMIN';
  const canEditFeatured = user?.role === 'ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generatedSlug = formData.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleChange = (field: keyof typeof formData, value: string | number | boolean | Article['status']) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          required
          disabled={isRestricted}
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500">
          Slug (preview)
        </label>
        <div className="mt-1 p-2 bg-gray-50 rounded text-gray-500 text-sm">
          {generatedSlug || slug || '...'}
        </div>
        <p className="mt-1 text-xs text-gray-400">Slug is automatically updated based on title.</p>
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
          Summary
        </label>
        <textarea
          id="summary"
          rows={3}
          disabled={isRestricted}
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          disabled={isRestricted}
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value={0} disabled>Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {tasks && (
        <div>
            <label htmlFor="task" className="block text-sm font-medium text-gray-700">
                Task (Optional)
            </label>
            <select
                id="task"
                value={formData.taskId || ''}
                disabled={isRestricted || formData.status === 'PUBLISHED'}
                onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setFormData(prev => ({ ...prev, taskId: value }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
            >
                <option value="">No task selected</option>
                {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                        {task.title}
                    </option>
                ))}
            </select>
             <p className="mt-1 text-xs text-gray-500">
                Associating this article with a task will mark the task as completed when the article is published.
            </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Thumbnail
        </label>

        {/* Show current/preview thumbnail */}
        {(previewUrl || (formData.thumbnail && !removeThumbnail)) && (
          <div className="mt-2 relative inline-block">
            <img
              src={previewUrl || `http://localhost:8000${formData.thumbnail}`}
              alt="Thumbnail preview"
              className="h-32 w-auto rounded-md border border-gray-300 object-cover"
            />
            {!isRestricted && (
              <button
                type="button"
                onClick={() => {
                  setThumbnailFile(null);
                  setPreviewUrl(null);
                  setRemoveThumbnail(true);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* File input shown when no thumbnail or after removal */}
        {!previewUrl && (removeThumbnail || !formData.thumbnail) && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isRestricted}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setThumbnailFile(file);
              setRemoveThumbnail(false);
              if (file) {
                setPreviewUrl(URL.createObjectURL(file));
              }
            }}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
        )}

        {/* Replace button when existing thumbnail is shown */}
        {!previewUrl && formData.thumbnail && !removeThumbnail && !isRestricted && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setThumbnailFile(file);
              setRemoveThumbnail(false);
              if (file) {
                setPreviewUrl(URL.createObjectURL(file));
              }
            }}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        )}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          id="content"
          rows={15}
          required
          disabled={isRestricted}
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border font-mono disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as Article['status'])}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          >
            <option value="DRAFT">Draft</option>
            <option value="REVIEW" disabled={(isWriter && formData.status === 'PUBLISHED') || (isAdmin && isOwnArticle)}>Review</option>
            <option value="PUBLISHED" disabled={isWriter}>Published</option>
            <option value="REJECTED" disabled={isWriter}>Rejected</option>
          </select>
        </div>

        {canEditFeatured && (
          <div className="flex items-center h-full pt-6">
            <input
              id="isFeatured"
              type="checkbox"
              disabled={isRestricted}
              checked={formData.isFeatured}
              onChange={(e) => handleChange('isFeatured', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-500"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
              Featured Article
            </label>
          </div>
        )}
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
          disabled={saving}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default ArticleForm;
