import { UrlData, UrlFormData, UrlShorteningResponse } from '../types';
import { logger } from './LoggingService';
import { addMinutes } from 'date-fns';

class UrlService {
  private static instance: UrlService;
  private readonly STORAGE_KEY = 'shortened_urls';
  private readonly DEFAULT_VALIDITY_MINUTES = 30;

  private constructor() {}

  public static getInstance(): UrlService {
    if (!UrlService.instance) {
      UrlService.instance = new UrlService();
    }
    return UrlService.instance;
  }

  private generateShortCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  private getStoredUrls(): UrlData[] {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (!storedData) return [];
    
    const urls: UrlData[] = JSON.parse(storedData);
    return urls.map(url => ({
      ...url,
      createdAt: new Date(url.createdAt),
      expiryDate: new Date(url.expiryDate),
      clicks: url.clicks.map(click => ({ ...click, timestamp: new Date(click.timestamp) }))
    }));
  }

  private saveUrls(urls: UrlData[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(urls));
  }

  private generateUniqueShortCode(): string {
    const urls = this.getStoredUrls();
    let shortCode: string;
    do {
      shortCode = this.generateShortCode();
    } while (urls.some(url => url.shortCode === shortCode));
    return shortCode;
  }

  public shortenUrl(urlData: UrlFormData): UrlShorteningResponse {
    logger.info('Attempting to shorten URL', { urlData });

    const urls = this.getStoredUrls();
    let shortCode = urlData.shortCode;

    // Validate and generate shortcode
    if (shortCode) {
      if (urls.some(u => u.shortCode === shortCode)) {
        logger.error('Custom shortcode already exists', { shortCode });
        throw new Error('Custom shortcode already exists');
      }
    } else {
      shortCode = this.generateUniqueShortCode();
    }

    const now = new Date();
    const validityMinutes = urlData.validityMinutes || this.DEFAULT_VALIDITY_MINUTES;
    const expiryDate = addMinutes(now, validityMinutes);

    const newUrlData: UrlData = {
      longUrl: urlData.longUrl,
      shortCode: shortCode,
      validityMinutes,
      createdAt: now,
      expiryDate,
      clicks: []
    };

    urls.push(newUrlData);
    this.saveUrls(urls);

    logger.info('URL shortened successfully', { shortCode, expiryDate });

    return {
      shortUrl: `http://localhost:3000/${shortCode}`,
      expiryDate,
      originalUrl: urlData.longUrl
    };
  }

  public getUrlData(shortCode: string): UrlData | null {
    const urls = this.getStoredUrls();
    return urls.find(url => url.shortCode === shortCode) || null;
  }

  public recordClick(shortCode: string, source: string): void {
    const urls = this.getStoredUrls();
    const urlIndex = urls.findIndex(url => url.shortCode === shortCode);

    if (urlIndex === -1) {
      logger.error('URL not found for click recording', { shortCode });
      return;
    }

    const clickData = {
      timestamp: new Date(),
      source,
      location: 'Local' // In a real app, this would be determined from IP
    };

    urls[urlIndex].clicks.push(clickData);
    this.saveUrls(urls);
    logger.info('Click recorded', { shortCode, clickData });
  }

  public getAllUrls(): UrlData[] {
    return this.getStoredUrls();
  }

  public isUrlExpired(urlData: UrlData): boolean {
    return new Date() > new Date(urlData.expiryDate);
  }
}

export const urlService = UrlService.getInstance();