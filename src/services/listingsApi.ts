import axiosClient from "../utils/axiosClient";

// Types for the API responses
export interface CategoryAttribute {
  type: "string" | "number" | "boolean" | "enum" | "array";
  label: string | Record<string, string>;
  required: boolean;
  placeholder?: string | Record<string, string>;
  min?: number;
  max?: number;
  options?: (string | Record<string, string>)[];
}

export interface Category {
  id: number;
  category_key: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  attributes: Record<string, CategoryAttribute>;
  search_fields: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  basic_attributes?: Record<string, CategoryAttribute> | {};
}

export interface ListingFormData {
  category_key: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  images: string[];
  attributes: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AutofillResponse {
  title: string;
  description: string;
  imageInfo: {
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export const ListingsApi = {
  // Fetch all categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const { data } = await axiosClient.get("/api/premium/categories");

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch categories");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  // Submit a new listing
  createListing: async (listingData: FormData): Promise<any> => {
    try {
      const { data } = await axiosClient.post(
        "/api/premium/listings",
        listingData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!data.success) {
        throw new Error(data.message || "Failed to create listing");
      }

      return data.data;
    } catch (error: any) {
      // Extract error message from axios response
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to create listing");
      }
    }
  },

  // Get user's listings
  getUserListings: async (): Promise<any[]> => {
    try {
      const { data } = await axiosClient.get("/api/premium/listings/my");

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch user listings");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching user listings:", error);
      throw error;
    }
  },

  // Update a listing (for premium users)
  updateListing: async (
    listingId: string,
    formData: FormData
  ): Promise<any> => {
    try {
      const { data } = await axiosClient.put(
        `/api/premium/listings/${listingId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!data.success) {
        throw new Error(data.message || "Failed to update listing");
      }

      return data.data;
    } catch (error: any) {
      console.error("Error updating listing:", error);

      // Extract error message from axios response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to update listing");
      }
    }
  },

  // Delete a listing
  deleteListing: async (listingId: string): Promise<void> => {
    try {
      const { data } = await axiosClient.delete(
        `/api/premium/listings/${listingId}`
      );

      if (!data.success) {
        throw new Error(data.message || "Failed to delete listing");
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      throw error;
    }
  },

  // Auto-fill listing details from image
  autofillFromImage: async (imageUri: string): Promise<AutofillResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "product-image.jpg",
        type: "image/jpeg",
      } as any);

      const { data } = await axiosClient.post(
        "/api/listings/autofill",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!data.success) {
        throw new Error(data.message || "Failed to autofill from image");
      }

      return data.data;
    } catch (error: any) {
      console.error("Error autofilling from image:", error);

      // Extract error message from axios response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to autofill from image");
      }
    }
  },
};
