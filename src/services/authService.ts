import axiosClient, { authUtils } from "../utils/axiosClient";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  appleId: string;
  lastLogin: string;
  status: "active" | "inactive" | string;
  hasVerificationBadge: boolean;
  verifiedStatus?: "UNPAID" | "PAID" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  country?: string | null;
  analyticsAccessStatus?: "APPROVED" | "NO_ACCESS";
  logoUrl?: string;
  subscriptionStatus?: "FREEMIUM" | "PREMIUM";
}

export interface LoginPayload {
  idToken: string;
  user: {
    name: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface GoogleLoginPayload {
  idToken: string;
  user: {
    email: string;
    name: {
      firstName: string;
      lastName: string;
    };
  };
}

interface LoginResponse {
  success: boolean;
  data: {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
    country?: string;
  };
  error?: string;
}

interface UserProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

interface UserNameUpdateResponse {
  message: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

// Auth Service
export const AuthService = {
  getUserProfile: async (): Promise<UserProfile | null> => {
    const isAuthenticated = await authUtils.isAuthenticated();
    if (!isAuthenticated) {
      return null;
    }

    try {
      const { data } = await axiosClient.get<UserProfileResponse>("/auth/me");
      return data?.data ?? null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  getUserLogin: async (
    payload: LoginPayload
  ): Promise<LoginResponse | null> => {
    try {
      const response = await axiosClient.post<LoginResponse>(
        "/auth/apple/signin",
        payload
      );

      return response.data;
    } catch (error) {
      console.error("Error logging in: ", error);
      return null;
    }
  },

  getUserGoogleLogin: async (
    payload: GoogleLoginPayload
  ): Promise<LoginResponse | null> => {
    try {
      const response = await axiosClient.post<LoginResponse>(
        "/auth/google/signin",
        payload
      );

      return response.data;
    } catch (error) {
      console.error("Error logging in with Google: ", error);
      return null;
    }
  },

  getUserNameUpdated: async (
    firstName: string,
    lastName: string
  ): Promise<UserNameUpdateResponse | null> => {
    try {
      const response = await axiosClient.put<UserNameUpdateResponse>(
        "/auth/users/name",
        {
          firstName,
          lastName,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user name: ", error);
      return null;
    }
  },

  deleteAccount: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axiosClient.delete("/auth/me/delete");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
