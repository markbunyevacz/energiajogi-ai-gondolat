import { BaseCrawler } from './base-crawler.js';
import type { CrawlerConfig, CrawlerResult, LegalSource } from './types.js';
import type { Page } from 'playwright';

export class JogtarCrawler extends BaseCrawler {
  private readonly source: LegalSource;
  private readonly contentSelectors = [
    '.content',
    '.jogszabaly-szoveg',
    '.document-content',
    '.main-content',
    '.container',
  ];

  private readonly documentCategories = [
    {
      name: 'active-laws',
      url: 'https://net.jogtar.hu/',
      description: 'Hatályos jogszabályok'
    },
    {
      name: 'new-laws',
      url: 'https://net.jogtar.hu/jogszabaly?docid=00000001.TXT',
      description: 'Új jogszabályok'
    },
    {
      name: 'modified-laws',
      url: 'https://net.jogtar.hu/jogszabaly?docid=00000003.TXT',
      description: 'Módosított jogszabályok'
    },
    {
      name: 'municipal-regulations',
      url: 'https://net.jogtar.hu/onkormanyzati-rendelettar',
      description: 'Önkormányzati rendelettár'
    }
  ];

  constructor(source: LegalSource, config: CrawlerConfig) {
    super(config);
    this.source = source;
  }

  private async inspectNetworkRequests(page: Page) {
    console.log('Inspecting network requests...');
    
    // Listen for all network requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/ajax/') || url.includes('/search')) {
        console.log('API Request:', {
          url,
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    // Listen for all responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('/ajax/') || url.includes('/search')) {
        console.log('API Response:', {
          url,
          status: response.status(),
          headers: response.headers()
        });
      }
    });
  }

  private async checkForFeeds(page: Page) {
    console.log('Checking for RSS feeds and sitemaps...');
    
    // Check for RSS feed links in the page
    const feedLinks = await page.$$('link[type="application/rss+xml"], link[type="application/atom+xml"]');
    for (const link of feedLinks) {
      const href = await link.evaluate(el => el.getAttribute('href'));
      console.log('Found feed:', href);
    }

    // Check for sitemap references
    const sitemapLinks = await page.$$('a[href*="sitemap"]');
    for (const link of sitemapLinks) {
      const href = await link.evaluate(el => el.getAttribute('href'));
      console.log('Found sitemap:', href);
    }

    // Try common sitemap locations
    const commonSitemapPaths = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemap/sitemap.xml',
      '/sitemap.txt',
      '/robots.txt'
    ];

    for (const path of commonSitemapPaths) {
      try {
        const response = await page.goto(new URL(path, this.source.url).toString(), { waitUntil: 'networkidle' });
        if (response?.ok()) {
          console.log(`Found sitemap at ${path}`);
          const content = await response.text();
          console.log('Sitemap content:', content);
        }
      } catch (error) {
        // Ignore errors for non-existent paths
      }
    }
  }

  public async crawl(): Promise<CrawlerResult> {
    const startTime = new Date();
    const errors: string[] = [];
    const documents: any[] = [];

    try {
      await this.initialize();
      if (!this.page) {
        throw new Error('Failed to initialize browser page');
      }

      // Set up network request monitoring
      await this.inspectNetworkRequests(this.page);

      console.log('Navigating to Jogtár main page...');
      await this.page.goto(this.source.url, { waitUntil: 'networkidle' });

      // Check for feeds and sitemaps
      await this.checkForFeeds(this.page);

      // Try to find search form and perform a test search
      console.log('Looking for search functionality...');
      
      // Check for search form
      const searchForm = await this.page.$('form[action*="search"]');
      if (searchForm) {
        console.log('Found search form, attempting test search...');
        
        // Try to find search input
        const searchInput = await this.page.$('input[type="text"], input[type="search"]');
        if (searchInput) {
          // Enter a test search term
          await searchInput.fill('energia');
          console.log('Entered test search term: energia');
          
          // Try to submit the form
          const submitButton = await this.page.$('button[type="submit"], input[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            console.log('Submitted search form');
            
            // Wait for results
            await this.page.waitForLoadState('networkidle');
            
            // Log the URL after search
            console.log('Current URL after search:', this.page.url());
            
            // Check if we got redirected to login
            if (this.page.url().includes('login') || this.page.url().includes('bejelentkezes')) {
              console.log('Search requires authentication');
            } else {
              // Try to find results
              const results = await this.page.$$('.search-results, .results, .list');
              console.log(`Found ${results.length} potential result containers`);
              
              // Log the page content for inspection
              const content = await this.page.content();
              console.log('Page content after search:', content);
            }
          }
        }
      }

      // Check for any API endpoints in the page source
      const pageContent = await this.page.content();
      const apiPatterns = [
        /\/api\/[^"']+/g,
        /\/ajax\/[^"']+/g,
        /\/search[^"']+/g,
        /\/jogszabaly\/[^"']+/g,
        /\/rss[^"']+/g,
        /\/feed[^"']+/g
      ];

      for (const pattern of apiPatterns) {
        const matches = pageContent.match(pattern);
        if (matches) {
          console.log('Found potential API endpoints:', matches);
        }
      }

      for (const category of this.documentCategories) {
        try {
          console.log(`Processing category: ${category.description}`);
          await this.page.goto(category.url, { waitUntil: 'networkidle' });

          // Check if we need to log in
          if (this.page.url().includes('login') || this.page.url().includes('bejelentkezes')) {
            console.log(`Authentication required for ${category.description}`);
            continue;
          }

          // Try to find document links
          const documentLinks = await this.page.$$('a[href*="/jogszabaly/"]');
          console.log(`Found ${documentLinks.length} documents in ${category.description}`);

          for (const link of documentLinks) {
            try {
              const href = await link.evaluate(el => el.getAttribute('href'));
              if (!href) continue;

              const fullUrl = new URL(href, this.source.url).toString();
              console.log(`Processing document at ${fullUrl}`);

              // Open document in new page to avoid navigation issues
              const docPage = await this.browser?.newPage();
              if (!docPage) continue;

              await docPage.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });

              // Try to extract content
              let content = '';
              for (const selector of this.contentSelectors) {
                try {
                  await docPage.waitForSelector(selector, { timeout: 5000 });
                  content = await docPage.$eval(selector, (el: Element) => el.textContent?.trim() || '');
                  if (content) break;
                } catch {}
              }

              if (content) {
                documents.push({
                  title: fullUrl,
                  content,
                  url: fullUrl,
                  source: this.source.id,
                  category: category.name
                });
                console.log(`Successfully processed document: ${fullUrl}`);
              } else {
                console.log(`Skipping document at ${fullUrl} - missing content`);
              }

              await docPage.close();
              await new Promise(resolve => setTimeout(resolve, this.config.minDelayBetweenRequests));
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`Failed to process document in ${category.description}: ${errorMessage}`);
              console.error(`Error processing document: ${errorMessage}`);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to process category ${category.description}: ${errorMessage}`);
          console.error(`Error processing category: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to crawl Jogtár: ${errorMessage}`);
      console.error(`Error crawling main page: ${errorMessage}`);
    } finally {
      await this.cleanup();
    }

    return {
      success: errors.length === 0,
      documents,
      errors,
      startTime,
      endTime: new Date(),
      source: this.source
    };
  }
} 