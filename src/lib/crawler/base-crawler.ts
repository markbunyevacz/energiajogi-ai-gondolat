import { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { supabase } from '@/integrations/supabase/client';
import type { LegalSource, CrawlerConfig, CrawlerResult, CrawlerProxy } from './types';

chromium.use(stealth());

export abstract class BaseCrawler {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected currentProxy: CrawlerProxy | null = null;
  protected config: CrawlerConfig;

  constructor(
    protected source: LegalSource,
    config: Partial<CrawlerConfig> = {}
  ) {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      requestTimeout: 30000,
      rateLimitDelay: 60000,
      maxConcurrentRequests: 5,
      ...config
    };
  }

  protected async initialize(): Promise<void> {
    if (this.browser) return;

    const proxy = await this.getNextProxy();
    if (!proxy) {
      throw new Error('No available proxies');
    }

    this.currentProxy = proxy;
    const proxyConfig = {
      server: `http://${proxy.host}:${proxy.port}`,
      username: proxy.username,
      password: proxy.password
    };

    this.browser = await chromium.launch({
      headless: true,
      proxy: proxyConfig
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    this.page = await this.context.newPage();
    await this.page.setDefaultTimeout(this.config.requestTimeout);
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

  protected async getNextProxy(): Promise<CrawlerProxy | null> {
    const { data, error } = await supabase
      .from('crawler_proxies')
      .select('*')
      .eq('is_active', true)
      .order('last_used_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) return null;

    // Update last used timestamp
    await supabase
      .from('crawler_proxies')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  }

  protected async markProxyFailure(proxyId: string): Promise<void> {
    const { data } = await supabase
      .from('crawler_proxies')
      .select('failure_count')
      .eq('id', proxyId)
      .single();

    if (data) {
      const newFailureCount = (data.failure_count || 0) + 1;
      await supabase
        .from('crawler_proxies')
        .update({
          failure_count: newFailureCount,
          is_active: newFailureCount < 5 // Deactivate proxy after 5 failures
        })
        .eq('id', proxyId);
    }
  }

  protected async handleRateLimit(): Promise<void> {
    if (this.currentProxy) {
      await this.markProxyFailure(this.currentProxy.id);
    }
    await this.cleanup();
    await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
    await this.initialize();
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = this.config.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.retryWithBackoff(operation, retries - 1);
      }
      throw error;
    }
  }

  public abstract crawl(): Promise<CrawlerResult>;
} 