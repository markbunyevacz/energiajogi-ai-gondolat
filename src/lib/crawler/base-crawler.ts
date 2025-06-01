import { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { supabase } from '../../integrations/supabase/client.js';
import type { CrawlerConfig, CrawlerResult, CrawlerProxy } from './types.js';
import { RateLimiter } from './rate-limiter.js';
import { ProxyManager } from './proxy-manager.js';

chromium.use(stealth());

export abstract class BaseCrawler {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected readonly config: CrawlerConfig;
  protected readonly rateLimiter: RateLimiter;
  protected readonly proxyManager: ProxyManager;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.maxRequestsPerMinute);
    this.proxyManager = new ProxyManager();
  }

  protected async initialize(): Promise<void> {
    if (this.browser) return;

    const proxy = await this.proxyManager.getNextProxy();
    const launchOptions: any = {
      headless: true
    };

    if (proxy) {
      launchOptions.proxy = {
        server: proxy.server,
        username: proxy.username,
        password: proxy.password
      };
    }

    this.browser = await chromium.launch(launchOptions);

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    this.page = await this.context.newPage();
    await this.page.setDefaultTimeout(30000); // 30 second timeout
  }

  protected async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async logCrawlResult(url: string, status: 'success' | 'error', error?: string): Promise<void> {
    try {
      const { error: dbError } = await supabase
        .from('system_health')
        .insert({
          service_name: this.config.name,
          status,
          error_message: error,
          created_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('Failed to log crawl result:', dbError);
      }
    } catch (error) {
      console.error('Failed to log crawl result:', error);
    }
  }

  public abstract crawl(): Promise<CrawlerResult>;
} 