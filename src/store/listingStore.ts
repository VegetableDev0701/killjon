import { create } from "zustand";
import { Category, ListingsApi } from "../services/listingsApi";
import { translateCategory } from "../utils/categoryTranslations";

export interface ListingFormState {
  // Basic listing info
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  images: string[];

  // Category and attributes
  selectedCategory: Category | null;
  categoryAttributes: Record<string, any>;
  basicAttributes: Record<string, any>;

  // Form validation
  errors: Record<string, string>;
  isSubmitting: boolean;

  // Categories list
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;

  // User listings
  userListings: any[];
  userListingsLoading: boolean;
  userListingsError: string | null;
  // Edit functionality
  editData: any | null;
  isEditing: boolean;
}

export interface ListingStoreActions {
  // Category management
  fetchCategories: (language: string) => Promise<void>;
  setCategories: (categories: Category[]) => void;
  setCategoriesLoading: (loading: boolean) => void;
  setCategoriesError: (error: string | null) => void;
  selectCategory: (category: Category) => void;

  // Form management
  setFormField: (
    field: keyof Pick<
      ListingFormState,
      "title" | "description" | "price" | "currency" | "location"
    >,
    value: any
  ) => void;
  setCategoryAttribute: (key: string, value: any) => void;
  setBasicAttribute: (key: string, value: any) => void;
  setImages: (images: string[]) => void;
  addImage: (image: string) => void;
  removeImage: (index: number) => void;
  setError: (field: string, error: string) => void;
  clearErrors: () => void;
  setSubmitting: (submitting: boolean) => void;

  // User listings management
  setUserListings: (listings: any[]) => void;
  setUserListingsLoading: (loading: boolean) => void;
  setUserListingsError: (error: string | null) => void;

  // Edit functionality
  setEditData: (data: any) => void;
  clearEditData: () => void;
  populateFormWithEditData: () => void;

  // Form reset
  resetForm: () => void;
  resetStore: () => void;
  deleteListing: (listingId: string) => Promise<void>;
  editListing: (listingId: string, updated: any) => Promise<void>;
}

export type ListingStore = ListingFormState & ListingStoreActions;

const initialState: ListingFormState = {
  title: "",
  description: "",
  price: 0,
  currency: "DOP",
  location: "",
  images: [],
  selectedCategory: null,
  categoryAttributes: {},
  basicAttributes: {},
  errors: {},
  isSubmitting: false,
  categories: [],
  categoriesLoading: false,
  categoriesError: null,
  userListings: [],
  userListingsLoading: false,
  userListingsError: null,
  editData: null,
  isEditing: false,
};

export const useListingStore = create<ListingStore>((set, get) => ({
  ...initialState,

  // Category management
  fetchCategories: async (language: string) => {
    try {
      set({ categoriesLoading: true, categoriesError: null });
      const categoriesData = await ListingsApi.getCategories();
      const translatedCategories = categoriesData.map((category) =>
        translateCategory(category, language)
      );
      set({ categories: translatedCategories, categoriesLoading: false });
    } catch (error) {
      set({
        categoriesError:
          error instanceof Error ? error.message : "Failed to fetch categories",
        categoriesLoading: false,
      });
    }
  },
  setCategories: (categories) => set({ categories }),
  setCategoriesLoading: (loading) => set({ categoriesLoading: loading }),
  setCategoriesError: (error) => set({ categoriesError: error }),
  selectCategory: (category) => {
    const { isEditing, categoryAttributes, basicAttributes } = get();
    set({
      selectedCategory: category,
      // Preserve existing attributes if we're in edit mode
      categoryAttributes: isEditing ? categoryAttributes : {},
      basicAttributes: isEditing ? basicAttributes : {},
      errors: {}, // Clear errors when category changes
    });
  },

  // Form management
  setFormField: (field, value) =>
    set((state) => ({
      [field]: value,
      errors: { ...state.errors, [field]: "" }, // Clear error for this field
    })),
  setCategoryAttribute: (key, value) =>
    set((state) => ({
      categoryAttributes: { ...state.categoryAttributes, [key]: value },
      errors: { ...state.errors, [key]: "" }, // Clear error for this field
    })),
  setBasicAttribute: (key, value) =>
    set((state) => ({
      basicAttributes: { ...state.basicAttributes, [key]: value },
      errors: { ...state.errors, [key]: "" }, // Clear error for this field
    })),
  setImages: (images) => set({ images }),
  addImage: (image) =>
    set((state) => ({
      images: [...state.images, image],
    })),
  removeImage: (index) =>
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
    })),
  setError: (field, error) =>
    set((state) => ({
      errors: { ...state.errors, [field]: error },
    })),
  clearErrors: () => set({ errors: {} }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  // User listings management
  setUserListings: (listings) => set({ userListings: listings }),
  setUserListingsLoading: (loading) => set({ userListingsLoading: loading }),
  setUserListingsError: (error) => set({ userListingsError: error }),

  // Edit functionality
  setEditData: (data) => {
    set({ editData: data, isEditing: true });
  },
  clearEditData: () =>
    set({
      editData: null,
      isEditing: false,
      selectedCategory: null,
      categoryAttributes: {},
      basicAttributes: {},
      errors: {},
      isSubmitting: false,
    }),
  populateFormWithEditData: () => {
    const { editData, selectedCategory } = get();
    if (editData && selectedCategory) {
      // Parse location data - it could be a string or an object
      let locationCoords = null;
      let locationDetails = null;
      let locationString = "";

      if (editData.location) {
        if (typeof editData.location === "string") {
          // If location is a string, try to parse it as JSON first
          try {
            const parsedLocation = JSON.parse(editData.location);
            if (parsedLocation.coordinates) {
              locationCoords = {
                latitude:
                  parsedLocation.coordinates.lat ||
                  parsedLocation.coordinates.latitude,
                longitude:
                  parsedLocation.coordinates.lng ||
                  parsedLocation.coordinates.longitude,
              };
              locationDetails = parsedLocation;
              locationString = editData.location; // Keep the original string for display
            }
          } catch (e) {
            // If parsing fails, treat it as a simple string
            locationString = editData.location;
          }
        } else if (typeof editData.location === "object") {
          // If location is already an object
          if (editData.location.coordinates) {
            locationCoords = {
              latitude:
                editData.location.coordinates.lat ||
                editData.location.coordinates.latitude,
              longitude:
                editData.location.coordinates.lng ||
                editData.location.coordinates.longitude,
            };
            locationDetails = editData.location;
            locationString =
              editData.location.city ||
              editData.location.formatted_address ||
              JSON.stringify(editData.location);
          }
        }
      }
      set({
        title: editData.title || "",
        description: editData.description || "",
        price: editData.price || 0,
        currency: editData.currency || "DOP",
        images: editData.media || [],
        // Set location-related attributes
        location: locationString,
        categoryAttributes: {
          ...editData.attributes,
          locationCoords,
          locationDetails,
          location: locationString,
        },
        basicAttributes: editData.basic_attributes || {},
        // Note: selectedCategory should be set separately when navigating to the form
      });
    }
  },

  // Add deleteListing and editListing actions
  deleteListing: async (listingId: string) => {
    set({ userListingsLoading: true, userListingsError: null });
    try {
      await ListingsApi.deleteListing(listingId);
      // Remove the deleted listing from userListings
      set((state) => ({
        userListings: state.userListings.filter((l) => l.id !== listingId),
        userListingsLoading: false,
      }));
    } catch (error: any) {
      set({
        userListingsError: error.message || "Failed to delete listing",
        userListingsLoading: false,
      });
    }
  },
  editListing: async (listingId: string, updated: any): Promise<void> => {
    set((state) => ({
      userListings: state.userListings.map((l) =>
        l.id === listingId ? updated : l
      ),
    }));
  },

  // Form reset
  resetForm: () =>
    set(() => ({
      title: "",
      description: "",
      price: 0,
      currency: "DOP",
      location: "",
      images: [],
      categoryAttributes: {},
      basicAttributes: {},
      errors: {},
      isSubmitting: false,
      selectedCategory: null,
      isEditing: false,
      editData: null,
    })),
  resetStore: () => set(initialState),
}));
