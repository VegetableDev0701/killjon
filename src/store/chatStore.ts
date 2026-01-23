import { create } from "zustand";
import { ApiService, ClickProductRequest } from "../services/apiService";
import { trackSearchPerformed } from "../services/firebaseAnalyticsService";
import { useAuthStore } from "../store/authStore";

// Response Types
export type MarketplaceSearchResponse = {
  type: "search";
  category: "vehicles" | "products" | "real_estate";
  searchSessionId: string;
  results: Array<{
    id: string;
    title: string;
    brand: string;
    model: string;
    year: string;
    price: number;
    price_value: number;
    images_url: string;
    detail_url: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    area_unit: string;
    location: string;
    category: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  confidence: number;
  language: string;
  sqlQuery?: string;
  hasMore: boolean;
};

export type DatabaseSearchResponse = {
  type: "database_search";
  searchId: string;
  productResults: Array<{ id: string; type: 1 | 2 }>; // Updated to match API response: 1 = listing, 2 = scraped
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  category: "vehicles" | "products" | "real_estate";
  confidence: number;
  filters: {
    brand?: string | null;
    color?: string | null;
    year?: string | null;
    min_price?: string | null;
    max_price?: string | null;
    model?: string | null;
    location?: string | null;
    category?: string | null;
    product_type?: string | null;
    availability?: string | null;
    property_type?: string | null;
    bedrooms?: string | null;
    bathrooms?: string | null;
    city?: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    condition?: string | null;
  };
};

export type AIAnswerResponse = {
  type: "ai_answer";
  answer: string;
  confidence: number;
  language: string;
};

export type WebsearchResponse = {
  type: "websearch";
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  confidence: number;
  language: string;
};

export type ChatResponse =
  | MarketplaceSearchResponse
  | DatabaseSearchResponse
  | AiChatResponse
  | WebSearchResponse
  | AIAnswerResponse;

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: "user" | "assistant";
  createdAt: string;
  updatedAt: string;
  content: {
    type: "user_message" | "database_search" | "ai_chat" | "web_search";
    text?: string;
    products?: Array<{ id: string; type: 1 | 2 }>; // New format: 1 = listing, 2 = scraped
    filters?: {
      city?: string | null;
      year?: string | null;
      brand?: string | null;
      color?: string | null;
      model?: string | null;
      bedrooms?: string | null;
      category?: string | null;
      location?: string | null;
      bathrooms?: string | null;
      condition?: string | null;
      fuel_type?: string | null;
      max_price?: string | null;
      min_price?: string | null;
      availability?: string | null;
      product_type?: string | null;
      transmission?: string | null;
      property_type?: string | null;
    };
    category?: string;
    searchId?: string;
    confidence?: number;
    model?: string;
    message?: string;
    queryId?: string;
    pointer?: boolean;
    sources?: Array<{
      title: string;
      url: string;
      snippet?: string;
      description?: string;
      favicon?: string;
      source?: string;
    }>;
    searchEngine?: string;
    isOptimistic?: boolean; // Flag to identify optimistic/dummy messages
  };
};

export type Chat = {
  id: string;
  userId: string;
  title: string;
  is_favorite: boolean;
  createdAt: string;
  updatedAt: string;
  Messages: ChatMessage[];
};

// API Response Types
interface ApiMessage {
  id: string;
  conversationId: string;
  sender: "user" | "assistant" | "ai";
  timestamp: string | null;
  content?: string;
  messageType:
    | "search"
    | "websearch"
    | "ai_answer"
    | "user_message"
    | "database_search"
    | "ai_chat"
    | "web_search";
  messageContent?: {
    type:
      | "search"
      | "websearch"
      | "ai_answer"
      | "user_message"
      | "database_search"
      | "ai_chat"
      | "web_search";
    text?:
      | string
      | {
          text?: string;
          type?: string;
          listingIds?: string[];
          hids?: string[];
          filters?: any;
          category?: string;
          searchId?: string;
          confidence?: number;
          message?: string;
          sources?: Array<{
            title: string;
            url: string;
            snippet: string;
          }>;
          searchEngine?: string;
          queryId?: string;
          model?: string;
        };
    answer?: string;
    search_results?: Array<{
      id: string;
      title?: string;
      brand?: string;
      model?: string;
      year?: string;
      price?: number;
      price_value?: number;
      images_url?: string;
      detail_url?: string;
      property_type?: string;
      bedrooms?: number;
      bathrooms?: number;
      area?: number;
      area_unit?: string;
      location?: string;
      category?: string;
    }>;
    websearch_results?: {
      answer: string;
      sources: Array<{
        title: string;
        url: string;
        snippet: string;
      }>;
    };
    products?: Array<{ id: string; type: 1 | 2 }>; // New format: 1 = listing, 2 = scraped
    filters?: any;
    category?: string;
    searchId?: string;
    confidence?: number;
    message?: string;
    pointer?: boolean;
    sources?: Array<{
      title: string;
      url: string;
      snippet?: string;
      description?: string;
      favicon?: string;
      source?: string;
    }>;
    searchEngine?: string;
    queryId?: string;
    model?: string;
  };
}

interface ApiChat {
  id: string;
  userId?: string;
  title: string;
  Messages?: ApiMessage[];
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  is_favorite?: boolean;
}

// Transform functions
const transformApiMessage = (apiMessage: ApiMessage): ChatMessage => {
  // Handle messageContent field (for database_search, web_search, etc.)
  if (apiMessage.messageContent) {
    let textContent: string | undefined;

    // For ai_chat messages, check multiple possible fields for the message content
    if (apiMessage.messageContent.type === "ai_chat") {
      textContent =
        apiMessage.messageContent.message ||
        apiMessage.messageContent.answer ||
        (typeof apiMessage.messageContent.text === "string"
          ? apiMessage.messageContent.text
          : undefined) ||
        (typeof apiMessage.messageContent.text === "object" &&
        apiMessage.messageContent.text?.text
          ? apiMessage.messageContent.text.text
          : undefined);
    } else {
      // For other message types, use the existing logic
      if (typeof apiMessage.messageContent.text === "string") {
        textContent = apiMessage.messageContent.text;
      } else if (
        typeof apiMessage.messageContent.text === "object" &&
        apiMessage.messageContent.text?.text
      ) {
        textContent = apiMessage.messageContent.text.text;
      }
    }

    // Map API message types to chat message types
    let messageType:
      | "user_message"
      | "database_search"
      | "ai_chat"
      | "web_search";
    switch (apiMessage.messageContent.type) {
      case "database_search":
        messageType = "database_search";
        break;
      case "web_search":
        messageType = "web_search";
        break;
      case "user_message":
        messageType = "user_message";
        break;
      default:
        messageType = "ai_chat";
        break;
    }

    return {
      id: apiMessage.id,
      conversationId: apiMessage.conversationId,
      sender: apiMessage.sender === "assistant" ? "assistant" : "user",
      createdAt:
        (apiMessage as any).createdAt ||
        apiMessage.timestamp ||
        new Date().toISOString(),
      updatedAt:
        (apiMessage as any).updatedAt ||
        apiMessage.timestamp ||
        new Date().toISOString(),
      content: {
        type: messageType,
        text: textContent,
        products: apiMessage.messageContent.products,
        filters: apiMessage.messageContent.filters,
        category: apiMessage.messageContent.category,
        searchId: apiMessage.messageContent.searchId,
        confidence: apiMessage.messageContent.confidence,
        model: apiMessage.messageContent.model,
        message: apiMessage.messageContent.message,
        queryId: apiMessage.messageContent.queryId,
        sources: apiMessage.messageContent.sources,
        searchEngine: apiMessage.messageContent.searchEngine,
        pointer: apiMessage.messageContent.pointer,
      },
    };
  }

  // Handle legacy content field
  return {
    id: apiMessage.id,
    conversationId: apiMessage.conversationId,
    sender: apiMessage.sender === "assistant" ? "assistant" : "user",
    createdAt:
      (apiMessage as any).createdAt ||
      apiMessage.timestamp ||
      new Date().toISOString(),
    updatedAt:
      (apiMessage as any).updatedAt ||
      apiMessage.timestamp ||
      new Date().toISOString(),
    content:
      typeof apiMessage.content === "object" && apiMessage.content !== null
        ? apiMessage.content
        : typeof apiMessage.content === "string"
          ? { type: "user_message", text: apiMessage.content }
          : { type: "user_message", text: "" },
  };
};

const transformApiChat = (chat: ApiChat): Chat => ({
  id: chat.id,
  userId: chat.userId || "",
  title: chat.title,
  is_favorite: chat.is_favorite || false,
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
  Messages: (chat.Messages || []).map(transformApiMessage),
});

// Logging utility
const logStoreAction = (_: string, __?: any) => {};

// Favorites Types
export type FavoriteItem = {
  id: string;
  category: "vehicles" | "products" | "real_estate";
  type: 1 | 2;
};

// Add pagination types
export type SearchPaginationState = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasMore: boolean;
};

export type LastSearchData = {
  message: string;
  chatId: string;
  category: string;
  searchSessionId: string;
  pagination: SearchPaginationState;
  allResults: string[]; // Store all result IDs
};

export type AiChatResponse = {
  type: "ai_chat";
  message: string;
  confidence: number;
  model: string;
};

export type WebSearchResponse = {
  type: "web_search";
  queryId: string;
  message: string;
  sources: Array<{
    title: string;
    url: string;
    description: string;
    favicon: string;
    source: string;
  }>;
  confidence: number;
  searchEngine: string;
};

interface ChatState {
  // State
  currentChat: Chat | null;
  chats: Chat[];
  isLoading: boolean;
  isLoadingChats: boolean;
  isLoadingCurrentChat: boolean;
  error: string | null;
  lastAction: string | null;
  lastActionTimestamp: string | null;
  selectedChatId: string | null;
  isDrawerOpen: boolean;

  // New favorites state
  favorites: FavoriteItem[];
  isLoadingFavorites: boolean;

  // New pagination state
  lastSearchData: LastSearchData | null;
  isLoadingMoreResults: boolean;

  // Chat pagination state
  chatPagination: {
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  };
  isLoadingMoreChats: boolean;

  // Actions
  setCurrentChat: (chat: Chat | null) => void;
  setChats: (chats: Chat[]) => void;
  addMessage: (message: ChatMessage) => void;
  createChat: (title: string) => Promise<void>;
  createChatWithMessage: (message: string) => Promise<void>; // NEW: Combined function
  fetchChat: (id: string) => Promise<void>;
  fetchChats: (shouldAppend?: boolean) => Promise<void>;
  sendMessage: (content: string, websearch?: boolean) => Promise<void>;
  toggleFavorite: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  setSelectedChatId: (chatId: string | null) => void;
  setDrawerOpen: (isOpen: boolean) => void;
  selectAndFetchChat: (chatId: string) => Promise<boolean>;

  // New favorites actions
  toggleItemFavorite: (
    id: string,
    category: "vehicles" | "products" | "real_estate",
    type: 1 | 2
  ) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  isItemFavorited: (id: string) => boolean;

  // New pagination actions
  setLastSearchData: (searchData: LastSearchData) => void;
  clearLastSearchData: () => void;

  // Chat pagination actions
  loadMoreChats: () => Promise<void>;

  // Handler functions for response types
  handleDatabaseSearchResponse: (
    searchResponse: DatabaseSearchResponse,
    userMessage: string
  ) => void;

  handleAiChatResponse: (
    aiResponse: AiChatResponse,
    userMessage: string
  ) => void;

  handleWebSearchResponse: (webResponse: WebSearchResponse) => void;

  // Build conversation context for API calls
  buildConversationContext: () => Array<{
    role: "user" | "assistant";
    content: string;
  }>;

  // log analytics
  trackProductClick: (params: ClickProductRequest) => Promise<void>;

  // Reset store (for logout)
  resetStore: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentChat: null,
  chats: [],
  isLoading: false,
  isLoadingChats: false,
  isLoadingCurrentChat: false,
  error: null,
  lastAction: null,
  lastActionTimestamp: null,
  selectedChatId: null,
  isDrawerOpen: false,

  // New favorites initial state
  favorites: [],
  isLoadingFavorites: false,

  // New pagination initial state
  lastSearchData: null,
  isLoadingMoreResults: false,

  // Chat pagination initial state
  chatPagination: {
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
  },
  isLoadingMoreChats: false,

  // Actions
  setCurrentChat: (chat) => {
    set({
      currentChat: chat,
      lastAction: "setCurrentChat",
      lastActionTimestamp: new Date().toISOString(),
    });
  },

  setChats: (chats) => {
    logStoreAction("setChats", { count: chats.length });
    set({
      chats,
      lastAction: "setChats",
      lastActionTimestamp: new Date().toISOString(),
    });
  },

  addMessage: (message) => {
    const { currentChat } = get();
    if (!currentChat) return;

    set({
      currentChat: {
        ...currentChat,
        Messages: [...currentChat.Messages, message],
        updatedAt: new Date().toISOString(),
      },
      lastAction: "addMessage",
      lastActionTimestamp: new Date().toISOString(),
    });
  },

  trackProductClick: async (params: ClickProductRequest) => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) return;

    logStoreAction("trackProductClick", params);
    try {
      await ApiService.analytics.clickProduct(params);
    } catch (error) {
      console.warn("Product click tracking failed:", error);
    }
  },

  createChat: async (title) => {
    // Check authentication status first

    logStoreAction("createChat:start", { title });
    set({
      isLoading: true,
      error: null,
      lastAction: "createChat:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    const { isLoggedIn } = useAuthStore.getState();

    if (!isLoggedIn) {
      // Create a temporary chat for unauthenticated users
      const tempChatId = `temp_${Date.now()}`;
      const tempChat = {
        id: tempChatId,
        userId: "temp_user",
        title: title || "Temporary Chat",
        is_favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        Messages: [],
      };
      set((state) => ({
        chats: [tempChat, ...state.chats],
        currentChat: tempChat,
        lastAction: "createChat:temp",
        lastActionTimestamp: new Date().toISOString(),
      }));
      set({ isLoading: false });
      return;
    }

    try {
      const apiChat = await ApiService.conversations.create(title);
      logStoreAction("createChat:apiSuccess", { chatId: apiChat.id });

      const chat = transformApiChat(apiChat);
      set((state) => ({
        chats: [chat, ...state.chats],
        currentChat: chat,
        lastAction: "createChat:success",
        lastActionTimestamp: new Date().toISOString(),
      }));
    } catch (error) {
      set({
        error: "Failed to create chat",
        lastAction: "createChat:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createChatWithMessage: async (message) => {
    // Check authentication status first
    const { isLoggedIn } = useAuthStore.getState();

    if (!isLoggedIn) {
      const tempChatId = `temp_${Date.now()}`;
      const tempChat: Chat = {
        id: tempChatId,
        userId: "temp_user",
        title: "Temporary Chat",
        is_favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        Messages: [],
      };

      set({
        currentChat: tempChat,
        lastAction: "createChatWithMessage:tempChatCreated",
        lastActionTimestamp: new Date().toISOString(),
      });

      await get().sendMessage(message);
      return;
    }

    logStoreAction("createChatWithMessage:start", {
      messageLength: message.length,
    });

    // Generate title from message
    const title = generateChatTitle(message);

    // Create optimistic chat and message immediately
    const optimisticChatId = `temp_chat_${Date.now()}`;
    const optimisticMessageId = `temp_msg_${Date.now()}`;

    const optimisticMessage: ChatMessage = {
      id: optimisticMessageId,
      conversationId: optimisticChatId,
      sender: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        type: "user_message",
        text: message,
      },
    };

    const optimisticAiMessage: ChatMessage = {
      id: `temp_ai_${Date.now()}`,
      conversationId: optimisticChatId,
      sender: "assistant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        type: "ai_chat",
        text: "", // Empty text for placeholder
        isOptimistic: true, // Flag to identify as dummy message
      },
    };

    const optimisticChat: Chat = {
      id: optimisticChatId,
      userId: "temp_user",
      title: title,
      is_favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      Messages: [optimisticMessage, optimisticAiMessage],
    };

    // Show optimistic data immediately
    set((state) => ({
      chats: [optimisticChat, ...state.chats],
      currentChat: optimisticChat,
      isLoading: true,
      error: null,
      lastAction: "createChatWithMessage:optimistic",
      lastActionTimestamp: new Date().toISOString(),
    }));

    try {
      // Create chat with proper title
      const apiChat = await ApiService.conversations.create(title);
      logStoreAction("createChatWithMessage:chatCreated", {
        chatId: apiChat.id,
      });

      const realChat = transformApiChat(apiChat);

      // Add the user message and optimistic AI message to the real chat
      const realUserMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: realChat.id,
        sender: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          type: "user_message",
          text: message,
        },
      };

      const realOptimisticAiMessage: ChatMessage = {
        id: `temp_ai_${Date.now()}`,
        conversationId: realChat.id,
        sender: "assistant",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          type: "ai_chat",
          text: "", // Empty text for placeholder
          isOptimistic: true, // Flag to identify as dummy message
        },
      };

      const chatWithUserMessage = {
        ...realChat,
        Messages: [realUserMessage, realOptimisticAiMessage],
      };

      // Replace optimistic chat with real chat
      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === optimisticChatId ? chatWithUserMessage : chat
        ),
        currentChat: chatWithUserMessage,
        lastAction: "createChatWithMessage:chatCreated",
        lastActionTimestamp: new Date().toISOString(),
      }));

      // Track search performed event
      const { userProfile } = useAuthStore.getState();
      if (userProfile?.id) {
        trackSearchPerformed(userProfile.id, message);
      }

      // Send message to API with conversation context and chatId
      const searchResponse = await ApiService.search.unified({
        message: message,
        chatId: realChat.id,
        page: 1,
        limit: 3,
      });

      // Handle database_search response by adding it as a new message
      if (searchResponse && searchResponse.type === "database_search") {
        get().handleDatabaseSearchResponse(searchResponse, message);
      } else if (searchResponse && searchResponse.type === "ai_chat") {
        get().handleAiChatResponse(searchResponse, message);
      } else if (searchResponse && searchResponse.type === "web_search") {
        get().handleWebSearchResponse(searchResponse);
      } else {
        // For other response types, fetch the updated conversation
        const updatedApiChat = await ApiService.conversations.getById(
          realChat.id
        );
        const updatedChat = transformApiChat(updatedApiChat);

        set({
          currentChat: updatedChat,
          lastAction: "createChatWithMessage:success",
          lastActionTimestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      logStoreAction("createChatWithMessage:error", { error });

      // On error, remove the optimistic chat and show error
      set((state) => ({
        chats: state.chats.filter((chat) => chat.id !== optimisticChatId),
        currentChat: null,
        error: "Failed to create chat with message",
        lastAction: "createChatWithMessage:error",
        lastActionTimestamp: new Date().toISOString(),
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChat: async (id) => {
    // Check authentication status first
    const { isLoggedIn } = useAuthStore.getState();

    if (!isLoggedIn) {
      set({
        error: "Please log in to view chats",
        lastAction: "fetchChat:unauthorized",
        lastActionTimestamp: new Date().toISOString(),
      });
      return;
    }

    logStoreAction("fetchChat:start", { chatId: id });
    set({
      isLoading: true,
      error: null,
      lastAction: "fetchChat:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      const apiChat = await ApiService.conversations.getById(id);
      logStoreAction("fetchChat:apiSuccess", {
        chatId: id,
        messageCount: apiChat.Messages?.length,
      });

      const chat = transformApiChat(apiChat);
      set({
        currentChat: chat,
        lastAction: "fetchChat:success",
        lastActionTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      logStoreAction("fetchChat:error", { chatId: id, error });
      set({
        error: "Failed to fetch chat",
        lastAction: "fetchChat:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChats: async (shouldAppend = false) => {
    // Check authentication status first
    const { isLoggedIn } = useAuthStore.getState();

    if (!isLoggedIn) {
      // Clear any existing data for unauthenticated users
      await clearAllLocalData();
      set({
        error: "Please log in to view chats",
        lastAction: "fetchChats:unauthorized",
        lastActionTimestamp: new Date().toISOString(),
      });
      return;
    }

    const { chats } = get();

    // If we already have chats and should append, don't show loading
    if (shouldAppend && chats.length > 0) {
      // Fetch in background without showing loading
      try {
        const response = await ApiService.conversations.getAll();
        const { conversations: apiChats, pagination } = response;
        const newChats = apiChats.map(transformApiChat);
        const existingIds = new Set(chats.map((chat) => chat.id));
        const uniqueNewChats = newChats.filter(
          (chat) => !existingIds.has(chat.id)
        );

        if (uniqueNewChats.length > 0) {
          set((state) => ({
            chats: [...state.chats, ...uniqueNewChats],
            chatPagination: pagination,
            lastAction: "fetchChats:success",
            lastActionTimestamp: new Date().toISOString(),
          }));
        }
      } catch (error) {}
      return;
    }

    // For initial load or explicit refresh, show loading
    logStoreAction("fetchChats:start", { shouldAppend });
    set({
      isLoadingChats: true,
      error: null,
      lastAction: "fetchChats:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      const response = await ApiService.conversations.getAll();
      const { conversations: apiChats, pagination } = response;

      // Update pagination state
      set({
        chatPagination: pagination,
        lastAction: "fetchChats:paginationUpdated",
        lastActionTimestamp: new Date().toISOString(),
      });

      // Process chats directly (simplified for now)
      if (apiChats && apiChats.length > 0) {
        const processedChats = apiChats.map(transformApiChat);

        set({
          chats: processedChats,
          isLoadingChats: false,
          lastAction: "fetchChats:success",
          lastActionTimestamp: new Date().toISOString(),
        });
      } else {
        set({
          chats: [],
          isLoadingChats: false,
          lastAction: "fetchChats:noChats",
          lastActionTimestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logStoreAction("fetchChats:error", { error });
      set({
        error: "Failed to fetch chats",
        lastAction: "fetchChats:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoadingChats: false });
    }
  },

  sendMessage: async (content) => {
    // Use a single declaration for currentChat
    const { currentChat } = get();

    // If authenticated, only allow sending a message if a chat exists
    if (!currentChat) {
      set({
        error: "No chat selected. Please start a new chat from the header.",
        lastAction: "sendMessage:noCurrentChat",
        lastActionTimestamp: new Date().toISOString(),
      });
      return;
    }

    // If not authenticated, allow temporary chat for search only
    const { isLoggedIn } = useAuthStore.getState();

    if (!isLoggedIn) {
      // For unauthenticated users, use existing temporary chat or create one
      let tempChat: Chat;
      if (!currentChat || !currentChat.id.startsWith("temp_")) {
        const tempChatId = `temp_${Date.now()}`;
        tempChat = {
          id: tempChatId,
          userId: "temp_user",
          title: "Temporary Chat",
          is_favorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          Messages: [],
        };
        set({ currentChat: tempChat });
      } else {
        tempChat = currentChat;
      }

      logStoreAction("sendMessage:start", {
        chatId: tempChat.id,
        contentLength: content.length,
        authenticated: false,
      });
      set({
        isLoading: true,
        error: null,
        lastAction: "sendMessage:start",
        lastActionTimestamp: new Date().toISOString(),
      });

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: tempChat.id,
        sender: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          type: "user_message",
          text: content,
        },
      };
      get().addMessage(userMessage);

      try {
        // Track search performed event for unauthenticated users (using temp ID)
        trackSearchPerformed("guest", content);

        // Send message to API with conversation context (no chatId for unauthenticated)
        const searchResponse = await ApiService.search.unified({
          message: content,
          chatId: currentChat.id,
          page: 1,
          limit: 3,
        });

        // Handle database_search response by adding it as a new message
        if (searchResponse && searchResponse.type === "database_search") {
          get().handleDatabaseSearchResponse(searchResponse, content);
        } else if (searchResponse && searchResponse.type === "ai_chat") {
          get().handleAiChatResponse(searchResponse, content);
        } else if (searchResponse && searchResponse.type === "web_search") {
          get().handleWebSearchResponse(searchResponse);
        }

        set({
          lastAction: "sendMessage:success",
          lastActionTimestamp: new Date().toISOString(),
        });
      } catch (error) {
        logStoreAction("sendMessage:error", { chatId: tempChat.id, error });
        set({
          error: "Failed to send message",
          lastAction: "sendMessage:error",
          lastActionTimestamp: new Date().toISOString(),
        });
      } finally {
        set({ isLoading: false });
      }
      return;
    }

    // For authenticated users, proceed with normal chat creation and persistence
    const chatToUse = currentChat;

    set({
      isLoading: true,
      error: null,
      lastAction: "sendMessage:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    // Add both messages at once
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId: chatToUse.id,
      sender: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        type: "user_message",
        text: content,
      },
    };

    const optimisticAiMessage: ChatMessage = {
      id: `temp_ai_${Date.now()}`,
      conversationId: chatToUse.id,
      sender: "assistant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        type: "ai_chat",
        text: "", // Empty text for placeholder
        isOptimistic: true, // Flag to identify as dummy message
      },
    };

    // Add both messages in one operation
    if (currentChat) {
      set({
        currentChat: {
          ...currentChat,
          Messages: [...currentChat.Messages, userMessage, optimisticAiMessage],
          updatedAt: new Date().toISOString(),
        },
        lastAction: "addMessage",
        lastActionTimestamp: new Date().toISOString(),
      });
    }

    try {
      // Track search performed event
      const { userProfile } = useAuthStore.getState();
      if (userProfile?.id) {
        trackSearchPerformed(userProfile.id, content);
      }

      // Send message to API with conversation context and chatId
      const searchResponse = await ApiService.search.unified({
        message: content,
        chatId: chatToUse.id,
        page: 1,
        limit: 3,
      });

      // Handle database_search response by adding it as a new message
      if (searchResponse && searchResponse.type === "database_search") {
        get().handleDatabaseSearchResponse(searchResponse, content);
      } else if (searchResponse && searchResponse.type === "ai_chat") {
        get().handleAiChatResponse(searchResponse, content);
      } else if (searchResponse && searchResponse.type === "web_search") {
        get().handleWebSearchResponse(searchResponse);
      } else {
        // For other response types, fetch the updated conversation
        const apiChat = await ApiService.conversations.getById(chatToUse.id);
        const updatedChat = transformApiChat(apiChat);

        set({
          currentChat: updatedChat,
          lastAction: "sendMessage:success",
          lastActionTimestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logStoreAction("sendMessage:error", { chatId: chatToUse.id, error });
      set({
        error: "Failed to send message",
        lastAction: "sendMessage:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (chatId) => {
    logStoreAction("toggleFavorite:start", { chatId });
    set({
      isLoading: true,
      error: null,
      lastAction: "toggleFavorite:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      const apiChat = await ApiService.conversations.toggleFavorite(chatId);
      logStoreAction("toggleFavorite:apiSuccess", {
        chatId,
        isFavorite: apiChat.isFavorite,
        is_favorite: (apiChat as any).is_favorite,
      });

      const updatedChat = transformApiChat(apiChat);
      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? updatedChat : chat
        ),
        currentChat:
          state.currentChat?.id === chatId ? updatedChat : state.currentChat,
        lastAction: "toggleFavorite:success",
        lastActionTimestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logStoreAction("toggleFavorite:error", { chatId, error });
      set({
        error: "Failed to toggle favorite",
        lastAction: "toggleFavorite:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteChat: async (chatId) => {
    logStoreAction("deleteChat:start", { chatId });
    set({
      isLoading: true,
      error: null,
      lastAction: "deleteChat:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      await ApiService.conversations.delete(chatId);
      logStoreAction("deleteChat:apiSuccess", { chatId });

      set((state) => ({
        chats: state.chats.filter((chat) => chat.id !== chatId),
        currentChat:
          state.currentChat?.id === chatId ? null : state.currentChat,
        lastAction: "deleteChat:success",
        lastActionTimestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logStoreAction("deleteChat:error", { chatId, error });
      set({
        error: "Failed to delete chat",
        lastAction: "deleteChat:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateChatTitle: async (chatId, title) => {
    set({
      isLoading: true,
      error: null,
      lastAction: "updateChatTitle:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      const apiChat = await ApiService.conversations.updateTitle(chatId, title);

      const updatedChat = transformApiChat(apiChat);
      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? updatedChat : chat
        ),
        currentChat: state.currentChat,
        lastAction: "updateChatTitle:success",
        lastActionTimestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logStoreAction("updateChatTitle:error", { chatId, error });
      set({
        error: "Failed to update chat title",
        lastAction: "updateChatTitle:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedChatId: (chatId) => {
    logStoreAction("setSelectedChatId", { chatId });
    set({
      selectedChatId: chatId,
      lastAction: "setSelectedChatId",
      lastActionTimestamp: new Date().toISOString(),
    });
  },

  setDrawerOpen: (isOpen) => {
    logStoreAction("setDrawerOpen", { isOpen });
    set({
      isDrawerOpen: isOpen,
      lastAction: "setDrawerOpen",
      lastActionTimestamp: new Date().toISOString(),
    });

    // If drawer is opened, fetch conversations in background
    if (isOpen) {
      get().fetchChats(true);
    }
  },

  selectAndFetchChat: async (chatId): Promise<boolean> => {
    const { currentChat, isLoadingCurrentChat } = get();

    // If we already have the chat loaded and it's the current one, don't reload
    if (currentChat?.id === chatId && !isLoadingCurrentChat) {
      set({ selectedChatId: chatId });
      return false;
    }

    logStoreAction("selectAndFetchChat:start", { chatId });
    set({
      selectedChatId: chatId,
      isLoadingCurrentChat: true,
      error: null,
      lastAction: "selectAndFetchChat:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      const apiChat = await ApiService.conversations.getById(chatId);
      logStoreAction("selectAndFetchChat:apiSuccess", {
        chatId,
        messageCount: apiChat.Messages?.length,
      });

      const chat = transformApiChat(apiChat);
      set({
        currentChat: chat,
        lastAction: "selectAndFetchChat:success",
        lastActionTimestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      logStoreAction("selectAndFetchChat:error", { chatId, error });
      set({
        error: "Failed to fetch chat",
        lastAction: "selectAndFetchChat:error",
        lastActionTimestamp: new Date().toISOString(),
      });
      return false;
    } finally {
      set({ isLoadingCurrentChat: false });
    }
  },

  // New favorites functions
  toggleItemFavorite: async (id, category, type) => {
    logStoreAction("toggleItemFavorite:start", { id, category, type });
    set({
      isLoading: true,
      error: null,
      lastAction: "toggleItemFavorite:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      const response = await ApiService.favorites.toggle({
        id,
        category,
        type,
      });
      logStoreAction("toggleItemFavorite:apiSuccess", { id, category, type });

      set({
        favorites: response.favorites,
        lastAction: "fetchFavorites:success",
        lastActionTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      logStoreAction("toggleItemFavorite:error", { id, category, type, error });
      set({
        error: "Failed to toggle favorite",
        lastAction: "toggleItemFavorite:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFavorites: async () => {
    logStoreAction("fetchFavorites:start");
    set({
      isLoadingFavorites: true,
      error: null,
      lastAction: "fetchFavorites:start",
      lastActionTimestamp: new Date().toISOString(),
    });

    try {
      const response = await ApiService.favorites.getAll();
      logStoreAction("fetchFavorites:apiSuccess", {
        count: response.favorites.length,
      });

      set({
        favorites: response.favorites,
        lastAction: "fetchFavorites:success",
        lastActionTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      logStoreAction("fetchFavorites:error", { error });
      set({
        error: "Failed to fetch favorites",
        lastAction: "fetchFavorites:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoadingFavorites: false });
    }
  },

  isItemFavorited: (id) => {
    return get().favorites.some((fav) => fav.id === id);
  },

  // New pagination functions
  setLastSearchData: (searchData) => {
    logStoreAction("setLastSearchData", { searchData });
    set({
      lastSearchData: searchData,
      lastAction: "setLastSearchData",
      lastActionTimestamp: new Date().toISOString(),
    });
  },

  clearLastSearchData: () => {
    logStoreAction("clearLastSearchData");
    set({
      lastSearchData: null,
      lastAction: "clearLastSearchData",
      lastActionTimestamp: new Date().toISOString(),
    });
  },

  // Handler functions for response types (used by createChatWithMessage)
  handleDatabaseSearchResponse: async (
    searchResponse: DatabaseSearchResponse,
    userMessage: string
  ) => {
    const { currentChat } = get();
    if (!currentChat) return;

    // Create assistant message from search response
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      conversationId: currentChat.id,
      sender: "assistant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        type: "database_search",
        products: searchResponse.productResults || [],
        category: searchResponse.category,
        searchId: searchResponse.searchId,
        confidence: searchResponse.confidence,
        filters: searchResponse.filters || {},
      },
    };

    // Remove optimistic message and add real response
    const updatedMessages = currentChat.Messages.filter(
      (msg) => !(msg.id.startsWith("temp_ai_") && msg.content.isOptimistic)
    );

    set({
      currentChat: {
        ...currentChat,
        Messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date().toISOString(),
      },
      lastAction: "handleDatabaseSearchResponse:success",
      lastActionTimestamp: new Date().toISOString(),
    });

    // Only store pagination data for authenticated users (not temporary chats)
    const { isLoggedIn } = useAuthStore.getState();
    if (isLoggedIn && !currentChat.id.startsWith("temp_")) {
      // Store last search data for pagination
      const lastSearchData: LastSearchData = {
        message: userMessage,
        chatId: currentChat.id,
        category: searchResponse.category,
        searchSessionId: searchResponse.searchId,
        pagination: {
          currentPage: searchResponse.pagination?.currentPage || 1,
          totalPages: searchResponse.pagination?.totalPages || 1,
          totalItems: searchResponse.pagination?.totalItems || 0,
          itemsPerPage: searchResponse.pagination?.itemsPerPage || 20,
          hasMore: searchResponse.pagination?.hasNextPage || false,
        },
        allResults: searchResponse.productResults?.map((p: any) => p.id) || [],
      };
      get().setLastSearchData(lastSearchData);
    }

    logStoreAction("handleDatabaseSearchResponse:success", {
      category: searchResponse.category,
      productsCount: searchResponse.productResults?.length,
      totalPages: searchResponse.pagination?.totalPages,
      authenticated: isLoggedIn,
    });
  },

  handleAiChatResponse: (aiResponse: AiChatResponse) => {
    const { currentChat } = get();
    if (!currentChat) return;

    // Create assistant message from AI response
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      conversationId: currentChat.id,
      sender: "assistant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        type: "ai_chat",
        text: aiResponse.message,
        confidence: aiResponse.confidence,
        model: aiResponse.model,
        pointer: true,
      },
    };

    // Remove optimistic message and add real response
    const updatedMessages = currentChat.Messages.filter(
      (msg) => !(msg.id.startsWith("temp_ai_") && msg.content.isOptimistic)
    );

    set({
      currentChat: {
        ...currentChat,
        Messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date().toISOString(),
      },
      lastAction: "addMessage",
      lastActionTimestamp: new Date().toISOString(),
    });

    logStoreAction("handleAiChatResponse:success", {
      messageLength: aiResponse.message.length,
      confidence: aiResponse.confidence,
      model: aiResponse.model,
    });
  },

  handleWebSearchResponse: (webResponse: WebSearchResponse) => {
    const { currentChat } = get();
    if (!currentChat) return;

    // Create assistant message from web search response
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      conversationId: currentChat.id,
      sender: "assistant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        type: "web_search",
        text: webResponse.message,
        queryId: webResponse.queryId,
        confidence: webResponse.confidence,
        searchEngine: webResponse.searchEngine,
        pointer: true,
        sources: webResponse.sources.map((source: any) => ({
          title: source.title,
          url: source.url,
          snippet: source.description,
          description: source.description,
          favicon: source.favicon,
          source: source.source,
        })),
      },
    };

    // Remove optimistic message and add real response
    const updatedMessages = currentChat.Messages.filter(
      (msg) => !(msg.id.startsWith("temp_ai_") && msg.content.isOptimistic)
    );

    set({
      currentChat: {
        ...currentChat,
        Messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date().toISOString(),
      },
      lastAction: "addMessage",
      lastActionTimestamp: new Date().toISOString(),
    });

    logStoreAction("handleWebSearchResponse:success", {
      messageLength: webResponse.message.length,
      sourcesCount: webResponse.sources.length,
      confidence: webResponse.confidence,
      searchEngine: webResponse.searchEngine,
    });
  },

  // Build conversation context for API calls
  buildConversationContext: () => {
    const { currentChat } = get();
    if (!currentChat) {
      return [];
    }

    const conversationContext: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];

    for (const message of currentChat.Messages) {
      if (message.sender === "user") {
        const content = message.content.text || "";
        conversationContext.push({ role: "user", content });
      } else if (message.sender === "assistant") {
        const content = message.content.text || message.content.message || "";
        conversationContext.push({ role: "assistant", content });
      }
    }

    return conversationContext;
  },

  // Load more chats for pagination
  loadMoreChats: async () => {
    const { chatPagination, isLoadingMoreChats, chats } = get();

    if (isLoadingMoreChats || !chatPagination.hasMore) {
      return;
    }

    logStoreAction("loadMoreChats:start", {
      currentPage: chatPagination.currentPage,
      hasMore: chatPagination.hasMore,
    });

    set({ isLoadingMoreChats: true });

    try {
      const nextPage = chatPagination.currentPage + 1;
      const response = await ApiService.conversations.getAll(
        false,
        nextPage,
        20
      );
      const { conversations: newApiChats, pagination } = response;

      const newChats = newApiChats.map(transformApiChat);
      const existingIds = new Set(chats.map((chat) => chat.id));
      const uniqueNewChats = newChats.filter(
        (chat) => !existingIds.has(chat.id)
      );

      if (uniqueNewChats.length > 0) {
        set((state) => ({
          chats: [...state.chats, ...uniqueNewChats],
          chatPagination: pagination,
          lastAction: "loadMoreChats:success",
          lastActionTimestamp: new Date().toISOString(),
        }));
      } else {
        // Update pagination even if no new chats
        set({
          chatPagination: pagination,
          lastAction: "loadMoreChats:noNewChats",
          lastActionTimestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logStoreAction("loadMoreChats:error", { error });
      set({
        error: "Failed to load more chats",
        lastAction: "loadMoreChats:error",
        lastActionTimestamp: new Date().toISOString(),
      });
    } finally {
      set({ isLoadingMoreChats: false });
    }
  },

  // Reset store (for logout)
  resetStore: () => {
    logStoreAction("resetStore");
    set({
      currentChat: null,
      chats: [],
      isLoading: false,
      isLoadingChats: false,
      isLoadingCurrentChat: false,
      error: null,
      lastAction: null,
      lastActionTimestamp: null,
      selectedChatId: null,
      isDrawerOpen: false,
      favorites: [],
      isLoadingFavorites: false,
      lastSearchData: null,
      isLoadingMoreResults: false,
      chatPagination: {
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
      },
      isLoadingMoreChats: false,
    });
  },
}));

// Clear all local data utility
const clearAllLocalData = async () => {
  try {
    // Clear chat store
    const { resetStore } = useChatStore.getState();
    resetStore();
  } catch (error) {}
};

// Helper function to generate chat title from user message
const generateChatTitle = (message: string): string => {
  if (!message || message.trim().length === 0) {
    return "New Chat";
  }

  // Clean the message
  let cleanMessage = message.trim();

  // Remove common prefixes and clean up
  const prefixesToRemove = [
    "search for",
    "find",
    "show me",
    "i want",
    "i need",
    "looking for",
    "can you",
    "please",
    "help me find",
    "find me",
    "search",
    "query:",
    "question:",
    "ask:",
  ];

  for (const prefix of prefixesToRemove) {
    if (cleanMessage.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleanMessage = cleanMessage.substring(prefix.length).trim();
      break;
    }
  }

  // Remove punctuation from the end
  cleanMessage = cleanMessage.replace(/[.!?]+$/, "");

  // Capitalize first letter
  if (cleanMessage.length > 0) {
    cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
  }

  // Limit to 50 characters and add ellipsis if needed
  if (cleanMessage.length > 50) {
    cleanMessage = cleanMessage.substring(0, 47) + "...";
  }

  // If the result is too short or empty, use a fallback
  if (cleanMessage.length < 3) {
    return "New Chat";
  }

  return cleanMessage;
};
