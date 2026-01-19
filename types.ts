
export interface CustardShop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  brandColor?: string;
  chain?: string;
  logoUrl?: string;
}

export interface FlavorDetail {
  name: string;
  description?: string;
  imageUrl?: string;
  type?: 'daily' | 'monthly_flavor' | 'monthly_sundae' | 'monthly_shake' | 'monthly_sandwich';
}

export interface UpcomingFlavor {
  date: string; // ISO date string (YYYY-MM-DD)
  flavors: FlavorDetail[];
}

export interface FlavorStatus {
  shopId: string;
  flavors: FlavorDetail[];
  lastUpdated: string;
  isOpen?: boolean;
  statusMessage?: string;
  sources?: { title: string; uri: string }[];
  isLoading: boolean;
  error?: string;
  upcoming?: UpcomingFlavor[];
}

export interface SyncMetadata {
  lastGlobalSync: string | null;
  isSyncing: boolean;
}

export type ViewType = 'list' | 'map' | 'favorites';
