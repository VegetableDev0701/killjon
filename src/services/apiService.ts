import { PlatformOSType } from "react-native";
import axiosClient from "../utils/axiosClient";

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  isPinned: boolean;
  category?: string;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  messages?: [];
}

export interface Message {
  id: string;
  content: {
    text: string;
    type?: string;
    metadata?: {
      confidence?: number;
      sources?: string[];
    };
  };
  sender: "user" | "ai";
  timestamp: string;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchRequest {
  message: string;
  chatId?: string;
  page: number;
  limit: number;
}

export interface PaymentVerificationRequest {
  transaction_id: string;
  product_id?: string;
  purchaseToken?: string;
  platform: PlatformOSType;
  platformProductId?: string;
}

export interface FeedbackRequest {
  rating: number;
  comment: string;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
}

export interface ClickProductRequest {
  productId: string; // id or hid of product
  productType: 1 | 2; // 1 for listing, 2 for scrapped product
  category: string; // category name
  productOwnerId: string | null; // for listing product-> userId of product owner. for scrapped-> null
}

export interface ClickProductResponse {
  success: boolean;
  message?: string;
}

export interface SubscriptionData {
  id: string;
  productType: string;
  duration: string;
  expiresDate: string;
  autoRenewStatus: boolean;
  purchaseDate: string;
  amount: string;
  currency: string;
  status: string;
}

export interface ActiveFeature {
  featureType: string;
  activatedAt: string;
  expiresAt: string;
}

export interface SubscriptionsResponse {
  success: boolean;
  hasActiveSubscription: boolean;
  subscriptions: SubscriptionData[];
  activeFeatures: ActiveFeature[];
}

// API Service
export const ApiService = {
  // Conversations
  conversations: {
    create: async (title: string): Promise<Conversation> => {
      const response = await axiosClient.post("/chat", { title });
      return response.data;
    },

    getAll: async (
      favoritesOnly?: boolean,
      page: number = 1,
      limit: number = 20
    ): Promise<{
      conversations: Conversation[];
      pagination: { currentPage: number; totalPages: number; hasMore: boolean };
    }> => {
      const params = new URLSearchParams();

      if (favoritesOnly) {
        params.append("favoritesOnly", "true");
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await axiosClient.get(`/chat?${params.toString()}`);
      const json = response.data;
      if (Array.isArray(json)) {
        const sorted = json.slice().sort((a: any, b: any) => {
          if (a.isPinned !== b.isPinned) {
            return b.isPinned ? 1 : -1;
          }
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        return {
          conversations: sorted,
          pagination: { currentPage: 1, totalPages: 1, hasMore: false },
        };
      }

      // New format with pagination
      const conversations = json.conversations || json.data || [];
      const pagination = json.pagination || {
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
      };

      const sorted = conversations.slice().sort((a: any, b: any) => {
        if (a.isPinned !== b.isPinned) {
          return b.isPinned ? 1 : -1;
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      return {
        conversations: sorted,
        pagination,
      };
    },

    getFavorites: async (): Promise<Conversation[]> => {
      const response = await axiosClient.get("/chat/favorites");
      return response.data;
    },

    getById: async (id: string): Promise<any> => {
      const response = await axiosClient.get(`/chat/${id}`);
      return response.data;
    },

    updateTitle: async (id: string, title: string): Promise<Conversation> => {
      const response = await axiosClient.patch(`/chat/${id}/title`, { title });
      return response.data;
    },

    toggleFavorite: async (id: string): Promise<Conversation> => {
      const response = await axiosClient.post("/chat/pin", { chatId: id });
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await axiosClient.delete(`/chat/${id}`);
    },
  },

  // Messages
  messages: {
    send: async (
      conversationId: string,
      content: Message["content"]
    ): Promise<Message> => {
      const response = await axiosClient.post(
        `/chat/${conversationId}/messages`,
        { content }
      );
      return response.data;
    },
  },

  // Search
  search: {
    unified: async (request: SearchRequest) => {
      const response = await axiosClient.post("/search/unified", request);
      return response.data;
    },

    // New pagination method using searchId
    getBySearchId: async (
      searchId: string,
      page: number = 1,
      limit: number = 25,
      priceOrder?: "ASC" | "DESC"
    ) => {
      const response = await axiosClient.get(
        `/search/by-id/${searchId}?page=${page}&limit=${limit}&order_by_price=${priceOrder}`
      );
      return response.data;
    },
  },

  // Favorites
  favorites: {
    toggle: async (data: {
      id: string;
      category: "vehicles" | "products" | "real_estate";
      type: 1 | 2;
    }) => {
      const response = await axiosClient.post(
        "/auth/users/favorites/toggle",
        data
      );
      return response.data;
    },

    getAll: async () => {
      const response = await axiosClient.get("/auth/users/favorites");
      return response.data;
    },
  },

  // Payment
  payment: {
    validate: async (paymentData: PaymentVerificationRequest) => {
      const response = await axiosClient.post(
        "/api/payment/validate",
        paymentData
      );
      return response.data;
    },

    getMySubscriptions: async (): Promise<SubscriptionsResponse> => {
      const response = await axiosClient.get("/api/payment/subscription/me");
      return response.data;
    },
  },

  // Audio Transcription
  transcription: {
    transcribeAudio: async (audioUri: string): Promise<any> => {
      try {
        const formData = new FormData();
        const filename = audioUri.split("/").pop();
        const fileType = filename?.split(".").pop();
        formData.append("audioFile", {
          uri: audioUri,
          name: filename,
          type: `audio/${fileType}`,
        } as any);

        const response = await axiosClient.post("/api/transcribe", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        return response.data;
      } catch (error) {
        console.error("Transcription error:", error);
        throw error;
      }
    },
  },

  feedback: {
    submit: async (
      feedbackData: FeedbackRequest
    ): Promise<FeedbackResponse> => {
      try {
        const response = await axiosClient.post("/api/feedback", feedbackData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },
  user: {
    updateCountry: async (
      countryCode: string
    ): Promise<{ message: string; country: string }> => {
      try {
        const response = await axiosClient.post("/auth/users/country", {
          country: countryCode,
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },

  // Analytics
  analytics: {
    clickProduct: async (
      clickData: ClickProductRequest
    ): Promise<ClickProductResponse> => {
      try {
        const response = await axiosClient.post(
          "/api/analytics/click/product",
          clickData
        );
        return response.data;
      } catch (error) {
        console.error("Product click analytics failed:", error);
        throw error;
      }
    },
  },

  // User Profile Verification
  verification: {
    submitDocuments: async (
      formData: FormData
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await axiosClient.post(
          "/api/profile-verification/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      } catch (error: any) {
        throw error;
      }
    },

    getVerificationDetails: async (): Promise<{
      verifications: Array<{
        id: string;
        userId: string;
        appleIdName: string;
        cedulaFrontImageUrl: string;
        status: string;
        rejectionReason?: string;
        createdAt: string;
        updatedAt: string;
        User: {
          id: string;
          full_name: string;
          email: string;
        };
      }>;
    }> => {
      try {
        const response = await axiosClient.get("/api/profile-verification/");
        return response.data;
      } catch (error: any) {
        throw error;
      }
    },
  },

  merchant: {
    updateLogo: async (
      imageUri: string
    ): Promise<{
      message: string;
      logoUrl: string;
    }> => {
      try {
        const formData = new FormData();
        const filename = imageUri.split("/").pop();
        const fileType = filename?.split(".").pop();

        // Add the logo image with 'logo' key as per API requirements
        formData.append("logo", {
          uri: imageUri,
          name: filename || "profile_logo.jpg",
          type: `image/${fileType || "jpeg"}`,
        } as any);

        const response = await axiosClient.post(
          "/api/merchant/update-logo",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      } catch (error: any) {
        console.error("Error updating merchant logo:", error);
        throw error;
      }
    },
  },
};
