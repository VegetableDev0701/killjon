export interface CTAButton {
  type: "merchant_list" | "share_modal";
  label: string;
}

export interface Story {
  id: string;
  imageUrl: string;
  merchantId?: string;
  merchantName?: string;
  title?: string;
  ctaButtons: CTAButton[];
  duration: number; // in milliseconds
  isBoosted?: boolean; // For gradient border
  isStatic?: boolean; // True for static stories from Remote Config
  shareUrl?: string; // Share URL for merchant
  qrCodeUrl?: string; // QR code URL for merchant
  boostedProducts?: BoostedProduct[]; // Products to show in horizontal slider
}

export interface StaticStory {
  id: string;
  imageUrl: string;
  title: string;
  ctaUrl?: string;
  ctaText?: string;
  duration?: number; // Optional, defaults to 30000 (30 seconds)
}

export interface StoryViewerData {
  stories: Story[];
  currentIndex: number;
  progress: number; // 0 to 1
}

export interface BoostedProduct {
  id: string;
  user_id: string;
  owner_id?: string;
  category: string;
  title: string;
  description: string;
  price: number;
  price_currency?: string;
  phone_number: string;
  location: {
    city?: string;
    state?: string;
    street?: string;
    country?: string;
    district?: string;
    postcode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    display_name?: string;
    neighborhood?: string;
    formatted_address?: string;
  };
  media: string[];
  basic_attributes: Record<string, any>;
  attributes: Record<string, any>;
  status: string;
  boost: number;
  boost_expire: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantStory {
  merchant: {
    id: string;
    user_id: string;
    brand_name: string;
    logo_url: string | null;
    slug: string | null;
    category: string | null;
    status: string;
    share_url?: string | null;
    qr_code_url?: string | null;
    location: {
      latitude: number | null;
      longitude: number | null;
    };
    createdAt: string;
    updatedAt: string;
    isFromUser: boolean;
  };
  boostedProducts: BoostedProduct[];
  boostedProductsCount: number;
}
