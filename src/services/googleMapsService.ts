import Config from "react-native-config";

// Types for Google Maps API responses
export interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
}

export interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
  error_message?: string;
}

export interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceAutocompleteResponse {
  status: string;
  predictions: PlaceAutocompleteResult[];
  error_message?: string;
}

export interface PlaceDetailsResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
}

export interface PlaceDetailsResponse {
  status: string;
  result: PlaceDetailsResult;
  error_message?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// Google Maps Service
export const GoogleMapsService = {
  /**
   * Get the base URL for Google Maps API
   */
  getBaseUrl: (): string => {
    return Config.GOOGLE_MAP_BASE_URL || "https://maps.googleapis.com/maps/api";
  },

  /**
   * Get the API key from environment
   */
  getApiKey: (): string => {
    return Config.GOOGLE_MAP_API_KEY || "";
  },

  /**
   * Reverse geocode coordinates to get address
   * @param coords - Latitude and longitude coordinates
   * @returns Promise with address information
   */
  reverseGeocode: async (coords: LocationCoordinates): Promise<string> => {
    try {
      const baseUrl = GoogleMapsService.getBaseUrl();
      const apiKey = GoogleMapsService.getApiKey();

      if (!apiKey) {
        throw new Error("Google Maps API key not found in configuration");
      }

      const url = `${baseUrl}/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GeocodeResponse = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        throw new Error(
          data.error_message || `Geocoding failed with status: ${data.status}`
        );
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error;
    }
  },

  /**
   * Search for places based on query string
   * @param query - Search query string
   * @param types - Optional types filter (default: 'geocode')
   * @returns Promise with place search results
   */
  searchPlaces: async (
    query: string,
    types: string = "geocode"
  ): Promise<PlaceAutocompleteResult[]> => {
    try {
      if (query.length < 3) {
        return [];
      }

      const baseUrl = GoogleMapsService.getBaseUrl();
      const apiKey = GoogleMapsService.getApiKey();

      if (!apiKey) {
        throw new Error("Google Maps API key not found in configuration");
      }

      const url = `${baseUrl}/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${apiKey}&types=${types}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PlaceAutocompleteResponse = await response.json();

      if (data.status === "OK") {
        return data.predictions || [];
      } else {
        throw new Error(
          data.error_message ||
            `Places search failed with status: ${data.status}`
        );
      }
    } catch (error) {
      console.error("Places search error:", error);
      throw error;
    }
  },

  /**
   * Get place details by place ID
   * @param placeId - Google Places place ID
   * @param fields - Optional fields to include (default: 'geometry')
   * @returns Promise with place details
   */
  getPlaceDetails: async (
    placeId: string,
    fields: string = "geometry"
  ): Promise<LocationCoordinates> => {
    try {
      const baseUrl = GoogleMapsService.getBaseUrl();
      const apiKey = GoogleMapsService.getApiKey();

      if (!apiKey) {
        throw new Error("Google Maps API key not found in configuration");
      }

      const url = `${baseUrl}/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PlaceDetailsResponse = await response.json();

      if (data.status === "OK" && data.result?.geometry?.location) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
      } else {
        throw new Error(
          data.error_message ||
            `Place details failed with status: ${data.status}`
        );
      }
    } catch (error) {
      console.error("Place details error:", error);
      throw error;
    }
  },

  /**
   * Get coordinates and address for a place by place ID
   * @param placeId - Google Places place ID
   * @returns Promise with coordinates and formatted address
   */
  getPlaceDetailsWithAddress: async (
    placeId: string
  ): Promise<{
    coordinates: LocationCoordinates;
    address: string;
  }> => {
    try {
      const baseUrl = GoogleMapsService.getBaseUrl();
      const apiKey = GoogleMapsService.getApiKey();

      if (!apiKey) {
        throw new Error("Google Maps API key not found in configuration");
      }

      const url = `${baseUrl}/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PlaceDetailsResponse = await response.json();

      if (data.status === "OK" && data.result?.geometry?.location) {
        return {
          coordinates: {
            latitude: data.result.geometry.location.lat,
            longitude: data.result.geometry.location.lng,
          },
          address: data.result.formatted_address || "",
        };
      } else {
        throw new Error(
          data.error_message ||
            `Place details failed with status: ${data.status}`
        );
      }
    } catch (error) {
      console.error("Place details with address error:", error);
      throw error;
    }
  },
};

export default GoogleMapsService;
