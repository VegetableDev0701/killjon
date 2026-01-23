import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../utils/axiosClient";
import type {
  Article,
  ArticlesResponse,
  CategoriesResponse,
  Category,
  LikeSuccess,
  ViewSuccess,
} from "../types/lab";
import Config from "react-native-config";

interface ArticleStats {
  id: string;
  viewCount: number;
  likeCount: number;
  hasLiked: boolean;
}

interface ArticleStatsResponse {
  success: boolean;
  stats: ArticleStats[];
}
// for dev
const BRANCH_NAME = Config.ENV === "staging" ? "staging" : "main";
const BASE_URL = "https://raw.githubusercontent.com/nodoia-app/nodo.ia-lab/";

const CATEGORIES_URL = `${BASE_URL}/${BRANCH_NAME}/nodo-lab-categories.json`;
const ARTICLES_URL = `${BASE_URL}/${BRANCH_NAME}/nodo-lab-articles.json`;

// Fetch categories from GitHub
const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(CATEGORIES_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  const data: CategoriesResponse = await response.json();
  return data.categories;
};

// Fetch article stats from backend
const fetchArticleStats = async (
  articleIds: string[]
): Promise<ArticleStats[]> => {
  try {
    const response = await axiosClient.post<ArticleStatsResponse>(
      "/api/labs/articles",
      { articleIds }
    );
    return response.data.stats || [];
  } catch (error) {
    console.warn("Failed to fetch article stats:", error);
    // Return empty array if stats fetch fails - articles will still work without stats
    return [];
  }
};

// Fetch articles from GitHub and merge with stats from backend
const fetchArticles = async (): Promise<Article[]> => {
  // First, fetch articles from GitHub
  const response = await fetch(ARTICLES_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch articles");
  }
  const data: ArticlesResponse = await response.json();
  const articles = data.articles;

  // Then fetch stats for all articles
  const articleIds = articles.map((article) => article.id);
  const stats = await fetchArticleStats(articleIds);

  // Create a map for quick lookup
  const statsMap = new Map(stats.map((stat) => [stat.id, stat]));

  // Merge articles with their stats
  const articlesWithStats = articles.map((article) => {
    const stat = statsMap.get(article.id);
    return {
      ...article,
      viewCount: stat?.viewCount ?? 0,
      likeCount: stat?.likeCount ?? 0,
      hasLiked: stat?.hasLiked ?? false,
    };
  });

  return articlesWithStats;
};

// React Query hook for categories
export const useCategories = () => {
  return useQuery({
    queryKey: ["nodo-lab-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    retry: 2,
  });
};

// React Query hook for articles
export const useArticles = () => {
  return useQuery({
    queryKey: ["nodo-lab-articles"],
    queryFn: fetchArticles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    retry: 2,
  });
};

// Like an article
const likeArticle = async (articleId: string): Promise<void> => {
  await axiosClient.post<LikeSuccess>(`/api/labs/articles/${articleId}/like`);
};

// View an article
const viewArticle = async (articleId: string): Promise<ViewSuccess> => {
  const response = await axiosClient.post<ViewSuccess>(
    `/api/labs/articles/${articleId}/view`
  );
  return response.data;
};

// React Query hook for liking an article
export const useLikeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likeArticle,
    onMutate: async (articleId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["nodo-lab-articles"] });

      // Snapshot the previous value
      const previousArticles = queryClient.getQueryData<Article[]>([
        "nodo-lab-articles",
      ]);

      // Optimistically update to the new value
      if (previousArticles) {
        queryClient.setQueryData<Article[]>(["nodo-lab-articles"], (old) => {
          if (!old) return old;
          return old.map((article) => {
            if (article.id === articleId) {
              const isCurrentlyLiked = article.hasLiked;
              return {
                ...article,
                hasLiked: !isCurrentlyLiked,
                likeCount: isCurrentlyLiked
                  ? (article.likeCount || 0) - 1
                  : (article.likeCount || 0) + 1,
              };
            }
            return article;
          });
        });
      }

      return { previousArticles };
    },
    onError: (err, articleId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousArticles) {
        queryClient.setQueryData(
          ["nodo-lab-articles"],
          context.previousArticles
        );
      }
    },
  });
};

// React Query hook for viewing an article
export const useViewArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: viewArticle,
    onSuccess: (data, articleId) => {
      // Update view count with the actual count from API response
      queryClient.setQueryData<Article[]>(["nodo-lab-articles"], (old) => {
        if (!old) return old;
        return old.map((article) => {
          if (article.id === articleId) {
            return {
              ...article,
              viewCount: data.viewCount,
            };
          }
          return article;
        });
      });
    },
  });
};
