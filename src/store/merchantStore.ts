import { create } from "zustand";
import { MerchantService } from "../services/merchantService";
import { Merchant } from "../types/merchant";
import { MerchantStory } from "../types/story";

interface MerchantState {
  topMerchants: Merchant[];
  allMerchants: any[];
  merchantListings: any[];
  merchantScrapped: any[];
  boostedMerchants: MerchantStory[];
  topMerchantLoading: boolean;
  allMerchantsLoading: boolean;
  merchantListingsLoading: boolean;
  boostedMerchantsLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  allMerchantsLastFetched: number | null;
  // Pagination metadata for merchant listings
  merchantListingsPagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  // Pagination metadata for boosted products
  boostedPagination: {
    offset: number;
    limit: number;
    count: number;
    total: number;
  };
}

type MerchantStore = MerchantState & MerchantActions;

const initialState: MerchantState = {
  topMerchants: [],
  allMerchants: [],
  merchantListings: [],
  merchantScrapped: [],
  boostedMerchants: [],
  topMerchantLoading: false,
  allMerchantsLoading: false,
  merchantListingsLoading: false,
  boostedMerchantsLoading: false,
  error: null,
  lastFetched: null,
  allMerchantsLastFetched: null,
  merchantListingsPagination: {
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
  },
  boostedPagination: {
    offset: 0,
    limit: 10,
    count: 0,
    total: 0,
  },
};

export const useMerchantStore = create<MerchantStore>((set, get) => ({
  ...initialState,

  fetchTopMerchants: async () => {
    const state = get();

    if (state.topMerchantLoading) {
      return; // Prevent multiple simultaneous requests
    }

    try {
      set({ topMerchantLoading: true, error: null });

      const merchants = await MerchantService.getTopMerchants();

      set({
        topMerchants: merchants,
        topMerchantLoading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error) {
      set({
        topMerchantLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch merchants",
        topMerchants: [], // Clear merchants on error
      });
    }
  },

  fetchAllMerchants: async (
    page: number = 1,
    limit: number = 100,
    sortingOrder: "asc" | "desc" = "asc"
  ) => {
    const state = get();

    // Only use cache for page 1
    // if (
    //   page === 1 &&
    //   state.allMerchants.length > 0 &&
    //   state.allMerchantsLastFetched &&
    //   Date.now() - state.allMerchantsLastFetched < CACHE_DURATION
    // ) {
    //   console.log("MerchantStore: Using cached data for page 1");
    //   return; // Use cached data only for page 1
    // }

    if (state.allMerchantsLoading) {
      console.log(
        "MerchantStore: Already topMerchantLoading, skipping request"
      );
      return; // Prevent multiple simultaneous requests
    }

    try {
      set({ allMerchantsLoading: true, error: null });
      console.log("MerchantStore: Calling MerchantService.getAllMerchants...");

      const response = await MerchantService.getAllMerchants(
        page,
        limit,
        sortingOrder
      );

      console.log("MerchantStore: API response received", {
        dataLength: response.data?.length,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
      });

      const newMerchants = response.data || [];

      // For page 1, replace the list. For page > 1, append to existing list
      const updatedMerchants =
        page === 1 ? newMerchants : [...state.allMerchants, ...newMerchants];

      set({
        allMerchants: updatedMerchants,
        allMerchantsLoading: false,
        error: null,
        allMerchantsLastFetched: Date.now(),
      });

      // Return the response so components can access totalPages
      return response;
    } catch (error) {
      console.error("MerchantStore: Error fetching merchants", error);
      set({
        allMerchantsLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch all merchants",
        // Only clear merchants on error if it's page 1
        allMerchants: page === 1 ? [] : state.allMerchants,
      });
      throw error; // Re-throw error so components can handle it
    }
  },

  fetchMerchantListings: async (
    merchantId: string,
    page: number = 1,
    append: boolean = false
  ) => {
    if (!merchantId) {
      console.warn("fetchMerchantListings called without merchantId");
      return;
    }

    const state = get();

    if (state.merchantListingsLoading) {
      return; // Prevent multiple simultaneous requests
    }

    try {
      set({
        merchantListingsLoading: true,
        error: null,
      });

      const response = await MerchantService.getMerchantProducts(
        merchantId,
        page,
        20
      );

      const listings = response.data?.listings || [];
      const scrapped = response.data?.scrapped || [];

      const currentListings = state.merchantListings;
      const currentScrapped = state.merchantScrapped;

      const newListings = append ? [...currentListings, ...listings] : listings;

      const newScrapped = append ? [...currentScrapped, ...scrapped] : scrapped;

      // Update pagination metadata from API response (top level)
      const paginationData = {
        total: response.total || 0,
        totalPages: response.totalPages || 0,
        currentPage: page,
        limit: response.limit || 20,
      };

      set({
        merchantListings: newListings,
        merchantScrapped: newScrapped,
        merchantListingsLoading: false,
        error: null,
        merchantListingsPagination: paginationData,
      });
    } catch (error) {
      set({
        merchantListingsLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch merchant listings",
      });
    }
  },

  fetchBoostedMerchants: async (
    offset: number = 0,
    append: boolean = false
  ) => {
    const state = get();

    if (state.boostedMerchantsLoading) {
      return; // Prevent multiple simultaneous requests
    }

    try {
      set({ boostedMerchantsLoading: true, error: null });

      const response = await MerchantService.getBoostedProducts(offset, 10);

      const newMerchants = response.data || [];

      set({
        boostedMerchants: append
          ? [...state.boostedMerchants, ...newMerchants]
          : newMerchants,
        boostedMerchantsLoading: false,
        error: null,
        boostedPagination: response.pagination,
      });
    } catch (error) {
      set({
        boostedMerchantsLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch boosted merchants",
      });
    }
  },

  clearMerchantListings: () =>
    set({
      merchantListings: [],
      merchantScrapped: [],
      merchantListingsPagination: {
        total: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 20,
      },
    }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
