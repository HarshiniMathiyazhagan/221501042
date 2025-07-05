export interface UrlData {
  longUrl: string;
  shortCode?: string;
  validityMinutes?: number;
  createdAt: Date;
  expiryDate: Date;
  clicks: ClickData[];
}

export interface ClickData {
  timestamp: Date;
  source: string;
  location: string;
}

export interface UrlFormData {
  longUrl: string;
  shortCode?: string;
  validityMinutes?: number;
}

export interface UrlShorteningResponse {
  shortUrl: string;
  expiryDate: Date;
  originalUrl: string;
}