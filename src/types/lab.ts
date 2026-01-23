export interface Category {
  id: string;
  name: string;
  nameEs: string;
  emoji: string;
  color: string;
}

export interface Article {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  author?: string;
  publishedAt: string;
  readTimeMinutes: number;
  content: string;
  imgsource?: string;
  viewCount?: number;
  likeCount?: number;
  hasLiked?: boolean;
}

export interface LikeSuccess {
  success: boolean;
  hasLiked: boolean;
  likeCount: number;
}

export interface ViewSuccess {
  success: boolean;
  viewCount: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface ArticlesResponse {
  articles: Article[];
}
