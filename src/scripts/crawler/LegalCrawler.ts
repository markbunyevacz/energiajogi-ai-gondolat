import { Browser, Page } from 'playwright';
import { createLogger, format, transports } from 'winston';
import { CrawlerConfig, DocumentMetadata, CrawlerStats, CrawlerError, ChangeDetectionResult } from './types.js';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { RateLimiter } from './RateLimiter.js';
import { ProxyRotator } from './ProxyRotator.js';
import { PDFParser } from './PDFParser.js';
import { HTMLParser } from './HTMLParser.js';

export class LegalCrawler {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected config: CrawlerConfig;
  protected stats: CrawlerStats;
  protected rateLimiter: RateLimiter;
  protected proxyRotator: ProxyRotator;
  protected logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    transports: [
      new transports.File({ filename: 'crawl.log' }),
      new transports.Console()
    ]
  });

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.stats = {
      startTime: new Date(),
      documentsProcessed: 0,
      errors: 0,
      retries: 0
    };
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.proxyRotator = new ProxyRotator(config.proxyConfig);
  }

  async initialize(): Promise<void> {
    try {
      const { chromium } = await import('playwright');
      this.browser = await chromium.launch({
        proxy: this.config.proxyConfig.enabled ? this.proxyRotator.getCurrentProxy() : undefined
      });
      this.page = await this.browser.newPage();
      this.logger.info('Crawler initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize crawler', { error });
      throw error;
    }
  }

  async crawl(): Promise<void> {
    if (!this.page) {
      throw new Error('Crawler not initialized');
    }

    try {
      await this.page.goto(this.config.baseUrl);
      // Implement specific crawling logic for Magyar Közlöny
      // This will be expanded based on the specific structure of the website
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  protected async processDocument(url: string): Promise<DocumentMetadata | null> {
    try {
      await this.rateLimiter.waitForSlot();
      
      const response = await this.page!.goto(url);
      if (!response) {
        throw new Error(`Failed to fetch ${url}`);
      }

      const contentType = response.headers()['content-type'];
      const content = await response.text();
      const hash = this.generateHash(content);

      const metadata: DocumentMetadata = {
        id: this.generateId(url),
        title: await this.extractTitle(),
        source: this.config.baseUrl,
        url,
        publishedDate: new Date(),
        lastModified: new Date(),
        documentType: contentType?.includes('pdf') ? 'PDF' : 'HTML',
        hash
      };

      // Process content based on type
      if (metadata.documentType === 'PDF') {
        await new PDFParser().parse(content);
      } else {
        await new HTMLParser().parse(content);
      }

      this.stats.documentsProcessed++;
      return metadata;
    } catch (error) {
      this.handleError(error as Error);
      return null;
    }
  }

  protected generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  protected generateId(url: string): string {
    return createHash('md5').update(url).digest('hex');
  }

  protected async extractTitle(): Promise<string> {
    return await this.page!.title();
  }

  protected handleError(error: Error): void {
    this.stats.errors++;
    this.logger.error('Crawler error', { error: error.message });
    
    if (this.stats.retries < this.config.retryConfig.maxRetries) {
      this.stats.retries++;
      setTimeout(() => this.crawl(), this.config.retryConfig.retryDelay);
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    this.stats.endTime = new Date();
    this.logger.info('Crawler finished', { stats: this.stats });
  }
} 