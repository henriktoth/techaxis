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
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'REJECTED';
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  categoryId: number;
  authorId?: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'WRITER' | 'USER';
}
