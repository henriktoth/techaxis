export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  status: string;
  isFeatured: boolean;
  publishedAt: string | null;
  categoryId: number;
}

export interface Category {
  id: number;
  name: string;
}