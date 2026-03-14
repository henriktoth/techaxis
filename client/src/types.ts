export interface Task {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  priority: number;
  dueDate: string | null;
  assignedToId: number | null;
  assignedTo?: {
    name: string;
    email: string;
  };
  article?: {
    id: number;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'REJECTED';
  rejectionReason?: string | null;
  isFeatured: boolean;
  publishedAt: string | null;
  scheduledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  categoryId: number;
  authorId?: number;
  author?: {
    id: number;
    name: string;
  };
  task?: {
    id: number;
    title: string;
    description: string;
    priority: number;
    dueDate: string | null;
    isCompleted: boolean;
  };
}

export interface Category {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'WRITER' | 'READER' | 'SUPERADMIN';
  isDisabled?: boolean;
}

export interface Notification {
  id: number;
  type: 'TASK_ASSIGNED' | 'ARTICLE_REVIEW';
  message: string;
  relatedId: number | null;
  isRead: boolean;
  userId: number;
  createdAt: string;
}
