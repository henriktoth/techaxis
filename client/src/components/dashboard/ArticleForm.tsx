import { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import { Eye } from 'lucide-react';
import type { Article, Category, User, Task } from '../../types';
import { isAdminRole } from '../../utils/roles';
import { generateSlug } from '../../utils/slug';

interface ArticleFormProps {
  formData: {
    title: string;
    summary: string;
    content: string;
    contentDelta?: Record<string, unknown> | null;
    thumbnail: string;
    categoryId: number;
    status: Article['status'];
    isFeatured: boolean;
    taskId?: number | null;
    scheduledAt?: string;
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
  pageTitle: string;
  onPreview: () => void;
  thumbnailPreviewUrl: string | null;
  setThumbnailPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
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
  pageTitle,
  onPreview,
  thumbnailPreviewUrl,
  setThumbnailPreviewUrl,
}: ArticleFormProps) => {
  const isWriter = user?.role === 'WRITER';
  const isAdmin = isAdminRole(user?.role);
  const canEditFeatured = isAdminRole(user?.role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatedSlug = generateSlug(formData.title);

  const handleChange = (field: keyof typeof formData, value: string | number | boolean | Article['status'] | Record<string, unknown> | null) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
  };

  const inputClass = 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500';
  const labelClass = 'block text-sm font-medium text-gray-700';
  const sectionClass = 'bg-white rounded-xl shadow-sm border border-gray-100 p-6';
  const sectionTitleClass = 'text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4';
  const quillModules = {
    toolbar: isRestricted
      ? false
      : [
          [{ header: [1, 2, 3, false] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'blockquote'],
          ['clean'],
        ],
  };
  const quillFormats = [
    'header',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'align',
    'list',
    'link',
    'blockquote',
  ];

  return (
    <form onSubmit={onSubmit}>
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 -mx-8 px-8 py-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Sidebar Column - Everything Else */}
        <div className="space-y-6 lg:order-1">
          {/* Title & Slug */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Title</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className={labelClass}>
                  Article Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  disabled={isRestricted}
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={inputClass}
                  placeholder="Enter your article title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Slug (preview)
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-gray-500 text-sm font-mono">
                  {generatedSlug || slug || '...'}
                </div>
                <p className="mt-1 text-xs text-gray-400">Slug is automatically updated based on title.</p>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Summary</h2>
            <div>
              <label htmlFor="summary" className={labelClass}>
                Brief Description
              </label>
              <textarea
                id="summary"
                rows={3}
                disabled={isRestricted}
                value={formData.summary}
                onChange={(e) => handleChange('summary', e.target.value)}
                className={inputClass}
                placeholder="A short summary that appears in article listings..."
              />
            </div>
          </section>

          {/* Thumbnail */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Thumbnail</h2>

            {(thumbnailPreviewUrl || (formData.thumbnail && !removeThumbnail)) && (
              <div className="mt-2 relative inline-block">
                <img
                  src={thumbnailPreviewUrl || `http://localhost:8000${formData.thumbnail}`}
                  alt="Thumbnail preview"
                  className="h-48 w-auto rounded-lg border border-gray-200 object-cover"
                />
                {!isRestricted && (
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreviewUrl(null);
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

            {!thumbnailPreviewUrl && (removeThumbnail || !formData.thumbnail) && (
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
                    setThumbnailPreviewUrl(URL.createObjectURL(file));
                  }
                }}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            )}

            {!thumbnailPreviewUrl && formData.thumbnail && !removeThumbnail && !isRestricted && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setThumbnailFile(file);
                  setRemoveThumbnail(false);
                  if (file) {
                    setThumbnailPreviewUrl(URL.createObjectURL(file));
                  }
                }}
                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            )}
          </section>

          {/* Publishing */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Publishing</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Article['status'];
                    handleChange('status', newStatus);
                    if (newStatus !== 'PUBLISHED') {
                      setFormData((prev: typeof formData) => ({ ...prev, scheduledAt: '' }));
                    }
                  }}
                  className={inputClass}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW" disabled={(isWriter && formData.status === 'PUBLISHED') || (isAdmin && isOwnArticle)}>Review</option>
                  <option value="PUBLISHED" disabled={isWriter}>Published</option>
                  <option value="REJECTED" disabled={isWriter}>Rejected</option>
                </select>
              </div>

              {canEditFeatured && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="isFeatured"
                    type="checkbox"
                    disabled={isRestricted}
                    checked={formData.isFeatured}
                    onChange={(e) => handleChange('isFeatured', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <label htmlFor="isFeatured" className="block text-sm text-gray-900">
                    Featured Article
                  </label>
                </div>
              )}

              {isAdmin && formData.status === 'PUBLISHED' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mt-2">
                  <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule publish (optional)
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledAt"
                    value={formData.scheduledAt || ''}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, scheduledAt: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to publish immediately, or pick a future date to schedule.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Organization */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Organization</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="category" className={labelClass}>
                  Category
                </label>
                <select
                  id="category"
                  disabled={isRestricted}
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', Number(e.target.value))}
                  className={inputClass}
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
                  <label htmlFor="task" className={labelClass}>
                    Task (Optional)
                  </label>
                  <select
                    id="task"
                    value={formData.taskId || ''}
                    disabled={isRestricted || formData.status === 'PUBLISHED'}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setFormData((prev: typeof formData) => ({ ...prev, taskId: value }));
                    }}
                    className={inputClass}
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
            </div>
          </section>
        </div>

        {/* Main Column - Content Only */}
        <div className="lg:col-span-2 space-y-6 lg:order-2 h-full">
          {/* Content */}
          <section className={`${sectionClass} h-full flex flex-col`}>
            <h2 className={sectionTitleClass}>Content</h2>
            <div>
              <label htmlFor="content" className={labelClass}>
                Article Body
              </label>
              <div className="quill-editor mt-1 rounded-md border border-gray-300 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  readOnly={isRestricted}
                  onChange={(value, _delta, _source, editor) => {
                    setFormData((prev: typeof formData) => ({
                      ...prev,
                      content: value,
                      contentDelta: editor.getContents() as unknown as Record<string, unknown>,
                    }));
                  }}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write your article content..."
                />
              </div>
            </div>
          </section>
        </div>

      </div>
    </form>
  );
};

export default ArticleForm;
