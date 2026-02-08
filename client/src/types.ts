export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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
