export interface SearchResult {
  id: number;
  title?: string;
  price: string | number;
  price_value: number;
  location: string;
  images_url?: string;
  image?: string;
  description_text?: string;
  property_type?: string;
  bedroom?: string | null;
  bedrooms?: string | null;
  bathroom?: string | null;
  bathrooms?: string | null;
  area?: string | null;
  parking?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: string | null;
  transmission?: string | null;
  fuel?: string | null;
  traction?: string | null;
  condition?: string | null;
  color?: string | null;
  category?: string | null;
  brand_name?: string | null;
  discount?: string | null;
  detail_url?: string;
}

export interface SearchResponse {
  success: boolean;
  query?: {
    original: string;
    normalized: string;
    language: string;
    confidence: number;
  };
  result: {
    type: "database" | "web-search";
    category: string;
    content: string;
    items?: SearchResult[];
    count?: number;
    summary?: {
      total?: number;
      total_results?: number;
      property_types?: string[];
      vehicle_types?: string[];
      product_categories?: string[];
      models?: string[];
      years?: { min: number; max: number };
      colors?: string[];
      categories?: string[];
      brands?: string[];
      conditions?: string[];
      locations: string[];
      price_range: {
        min: number;
        max: number;
      };
    };
    highlights?: SearchResult[];
    sources?: {
      title: string;
      url: string;
      snippet?: string;
    }[];
    engine?: string;
    suggestions?: string;
  };
  metadata?: {
    display_format: "cards" | "grid" | "list" | "text";
    category?: string;
    sql_query?: string;
  };
}

export interface BackendMessage {
  id: string;
  conversationId: string;
  sender: string; // 'user' | 'assistant'
  createdAt: string;
  updatedAt: string;
  content: {
    message?: string;
    hids?: string[];
  };
}

export type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
  isTyping?: boolean;
  searchResponse?: SearchResponse;
  category?: string;
  source?: "database" | "web";
  searchResults?: { id: string }[];
};
