import { MerchantsResponse } from "../types/merchant";
import axiosClient from "../utils/axiosClient";

export const MerchantService = {
  // Get top merchants (first 5)
  getTopMerchants: async (): Promise<any[]> => {
    try {
      const response =
        await axiosClient.get<MerchantsResponse>("/api/merchant/top");
      console.log("API merchants response:", response);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching top merchants:", error);
      return [];
    }
  },

  // Get all merchants with pagination
  getAllMerchants: async (
    page: number = 1,
    limit: number = 20,
    sortingOrder?: "asc" | "desc"
  ): Promise<any> => {
    try {
      const base = `/api/merchant?page=${page}&limit=${limit}`;
      const url = sortingOrder ? `${base}&brandOrder=${sortingOrder}` : base;
      const response = await axiosClient.get(url);
      console.log("All merchants response:", response.data);

      return response.data; // Returns { data: [], page, limit, total, totalPages }
    } catch (error) {
      console.error("Error fetching all merchants:", error);
    }
  },

  // Get merchant products
  getMerchantProducts: async (
    merchantId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> => {
    try {
      const response = await axiosClient.get(
        `/api/merchant/${merchantId}/products?page=${page}&limit=${limit}`
      );

      return response.data; // Returns { data: [], page, limit, total, totalPages }
    } catch (error) {
      console.error("Error fetching merchant products:", error);

      // Fallback to mock data if API fails
      return {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    }
  },

  // Update store location
  updateStoreLocation: async (location: {
    latitude: number;
    longitude: number;
  }): Promise<any> => {
    try {
      console.log("MerchantService: Updating store location", location);
      const response = await axiosClient.post(
        "/api/merchant/store-location",
        location
      );
      console.log(
        "MerchantService: Store location updated successfully",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating store location:", error);
      throw error;
    }
  },

  // Get merchant details by user ID
  getMerchantDetails: async (userId: string): Promise<any> => {
    try {
      const response = await axiosClient.get(`/api/merchant/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching merchant details:", error);
      throw error;
    }
  },

  // Get boosted products for stories
  getBoostedProducts: async (
    offset: number = 0,
    limit: number = 10
  ): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      limit: number;
      offset: number;
      count: number;
      total: number;
    };
  }> => {
    try {
      const response = await axiosClient.get(
        `/api/merchant/boosted/products?offset=${offset}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching boosted products:", error);
      return {
        success: false,
        data: [],
        pagination: {
          limit: 10,
          offset: 0,
          count: 0,
          total: 0,
        },
      };
    }
  },
};
