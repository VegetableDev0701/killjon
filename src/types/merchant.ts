export interface Merchant {
  brand_name: string;
  id: string;
  name: string;
  logo?: string;
  isVerified: boolean;
  productCount: number;
  rating?: number;
  category: string;
  description?: string;
}

export interface MerchantsResponse {
  success: boolean;
  data: any[];
  message?: string;
}
