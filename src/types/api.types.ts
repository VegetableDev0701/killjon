export interface SearchResult {
  id: number;
  title?: string;
  price: string | number;
  price_value: number;
  location: string;
  images_url?: string;
  image?: string;
  description_text?: string;

  // Property specific
  property_type?: string;
  bedroom?: string | null;
  bedrooms?: string | null;
  bathroom?: string | null;
  bathrooms?: string | null;
  area?: string | null;
  parking?: string | null;

  // Vehicle specific
  brand?: string | null;
  model?: string | null;
  year?: string | null;
  transmission?: string | null;
  fuel?: string | null;
  traction?: string | null;
  condition?: string | null;
  color?: string | null;

  // Product specific
  category?: string | null;
  brand_name?: string | null;
  discount?: string | null;

  // Web search specific
  url?: string;
}

// Common Types
type ProductType = 1 | 2; // 1 = listing, 2 = scraped

export interface Product {
  id: string;
  type: ProductType;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Filters {
  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  engine_size: number | null;
  color: string | null;
  condition: string | null;
  body_type: string | null;
  doors: number | null;
  seats: number | null;
  engine: string | null;
  budget: number | null;
  budget_currency: string | null;
  location: string | null;
  features: string[];
}

// Type: database_search
interface DatabaseSearchResult {
  type: "database_search";
  searchId: string;
  productResults: Product[];
  pagination: Pagination;
  category: string;
  confidence: number;
  filters: Filters;
}

// Type: web_search
interface WebSource {
  title: string;
  url: string;
  description: string;
  favicon: string;
  source: string;
}

interface WebSearchResult {
  type: "web_search";
  queryId: string;
  message: string;
  sources: WebSource[];
  confidence: number;
  searchEngine: string;
}

// Type: ai_chat
interface AIChatResult {
  type: "ai_chat";
  message: string;
  confidence: number;
  model: string;
}

// Union Type
export type SearchResponse =
  | DatabaseSearchResult
  | WebSearchResult
  | AIChatResult;
