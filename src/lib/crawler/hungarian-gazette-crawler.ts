import { BaseCrawler } from './base-crawler.js';
import type { CrawlerConfig, CrawlerResult, LegalSource } from './types.js';
import type { Page } from 'playwright';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { createRequire } from 'module';

// Add DOMMatrix polyfill for Node.js
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    a: number = 1;
    b: number = 0;
    c: number = 0;
    d: number = 1;
    e: number = 0;
    f: number = 0;

    constructor(init?: string | number[]) {
      if (init) {
        if (typeof init === 'string') {
          // Parse matrix string
          const values = init.replace(/matrix\(|\)/g, '').split(',').map(Number);
          this.a = values[0] || 1;
          this.b = values[1] || 0;
          this.c = values[2] || 0;
          this.d = values[3] || 1;
          this.e = values[4] || 0;
          this.f = values[5] || 0;
        } else if (Array.isArray(init)) {
          this.a = init[0] || 1;
          this.b = init[1] || 0;
          this.c = init[2] || 0;
          this.d = init[3] || 1;
          this.e = init[4] || 0;
          this.f = init[5] || 0;
        }
      }
    }
  } as any;
}

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

// export class HungarianGazetteCrawler extends BaseCrawler {
//   ...
// }
// (Class implementation remains, but export is commented out for now)

export class HungarianGazetteCrawler extends BaseCrawler {
  private readonly source: LegalSource;
  private readonly contentSelectors = [
    '.document-content',
    '.content',
    '.panel-body',
    '#document-content',
    '.document-body',
    '.document-text',
    '.document-view',
    '.document-container',
    '.document-wrapper',
    '.jogszabaly-szoveg'
  ];

  constructor(source: LegalSource, config: CrawlerConfig) {
    super(config);
    this.source = source;
  }

  private async downloadPDF(page: Page, url: string): Promise<string> {
    try {
      // Create a new page for PDF download
      const pdfPage = await page.context().newPage();
      
      // Set up response handler before navigation
      const responsePromise = pdfPage.waitForResponse(
        response => response.url().includes('/pdf') && response.ok(),
        { timeout: 30000 }
      );
      
      // Navigate to the PDF URL
      await pdfPage.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for the response
      const response = await responsePromise;
      if (!response) {
        throw new Error('Failed to get PDF response');
      }

      // Get the PDF buffer
      const buffer = await response.body();
      
      // Generate filename and save
      const filename = `jogszabaly_${Date.now()}.pdf`;
      const filepath = join(process.cwd(), 'downloads', filename);
      await writeFile(filepath, buffer);
      
      // Close the PDF page
      await pdfPage.close();
      
      return filepath;
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  private async extractTextFromPDF(filepath: string): Promise<string> {
    try {
      const data = new Uint8Array(await readFile(filepath));
      const doc = await pdfjsLib.getDocument({ data }).promise;
      
      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      
      return text;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw error;
    }
  }

  private async waitForContent(page: Page, selectors: string[]): Promise<string> {
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        const content = await page.$eval(selector, (el: Element) => el.textContent?.trim()) || '';
        if (content) {
          return content;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }
    throw new Error('Could not find document content with any known selector');
  }

  private async extractDocumentDetails(page: Page): Promise<{ title: string; date: string; number: string }> {
    const titleSelectors = [
      'h1',
      '.title',
      '.document-title',
      '.panel-title',
      '.panel-heading',
      '.document-header h1',
      '.document-header .title',
      '.jogszabaly-cim'
    ];

    const dateSelectors = [
      '.date',
      'time',
      '.document-date',
      '.panel-body time',
      '.document-header time',
      '.document-meta .date',
      '.jogszabaly-datum'
    ];

    const numberSelectors = [
      '.number',
      '.id',
      '.document-number',
      '.panel-body .text-muted',
      '.document-meta .number',
      '.document-header .number',
      '.jogszabaly-szam'
    ];

    let title = '';
    let date = '';
    let number = '';

    for (const selector of titleSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            title = text.trim();
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    for (const selector of dateSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            date = text.trim();
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    for (const selector of numberSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            number = text.trim();
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    return { title, date, number };
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

      console.log('Navigating to NJT main page...');
      await this.page.goto('https://njt.hu', { waitUntil: 'networkidle' });
      
      // Wait for the search form to be visible
      await this.page.waitForSelector('#search-form', { timeout: 30000 });
      
      // Get current year
      const now = new Date();
      const currentYear = now.getFullYear();

      console.log(`Searching for documents from year: ${currentYear}`);
      
      // Enter search criteria
      await this.page.fill('#search-input', currentYear.toString());
      
      // Submit the search
      await this.page.click('button[type="submit"]');
      
      // Wait for the results to load
      await this.page.waitForSelector('.search-results', { timeout: 30000 });
      
      // Get all document links
      const documentLinks = await this.page.$$('.search-results a[href*="/jogszabaly/"]');
      console.log(`Found ${documentLinks.length} document links`);

      for (const link of documentLinks) {
        try {
          // Get the href before navigating
          const href = await link.evaluate(el => el.getAttribute('href'));
          if (!href) continue;

          const fullUrl = new URL(href, 'https://njt.hu').toString();
          console.log(`Processing document at ${fullUrl}`);
          
          // Navigate to the document page with retry logic
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              if (!this.page) {
                throw new Error('Page is not initialized');
              }
              
              await this.page.goto(fullUrl, { 
                waitUntil: 'networkidle',
                timeout: 30000 
              });
              
              // Wait for at least one of the selectors to be visible
              const waitPromises = this.contentSelectors.map(selector => 
                this.page!.waitForSelector(selector, { timeout: 5000 })
                  .catch(() => null)
              );
              
              const result = await Promise.race(waitPromises);
              if (!result) {
                throw new Error('No content selectors found');
              }
              
              break;
            } catch (error) {
              retryCount++;
              if (retryCount === maxRetries) throw error;
              console.log(`Navigation failed, retrying (${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }

          // Try to find and download PDF
          if (!this.page) {
            throw new Error('Page is not initialized');
          }
          
          const pdfLink = await this.page.$('a[href*="/pdf"]');
          let pdfContent = '';
          let pdfPath = '';

          if (pdfLink) {
            const pdfUrl = await pdfLink.evaluate(el => el.getAttribute('href'));
            if (pdfUrl) {
              const fullPdfUrl = new URL(pdfUrl, 'https://njt.hu').toString();
              console.log(`Downloading PDF from ${fullPdfUrl}`);
              
              try {
                pdfPath = await this.downloadPDF(this.page, fullPdfUrl);
                pdfContent = await this.extractTextFromPDF(pdfPath);
                console.log('Successfully extracted text from PDF');
              } catch (error) {
                console.error('Failed to process PDF:', error);
              }
            }
          }
          
          // Wait for content with multiple possible selectors
          const content = await this.waitForContent(this.page, this.contentSelectors);
          const { title, date, number } = await this.extractDocumentDetails(this.page);

          if (title && (content || pdfContent)) {
            documents.push({
              title,
              content: pdfContent || content, // Prefer PDF content if available
              date,
              number,
              url: fullUrl,
              pdfUrl: pdfPath,
              source: this.source.id
            });

            try {
              await this.logCrawlResult(fullUrl, 'success');
            } catch (error) {
              console.error('Failed to log crawl result:', error);
            }
            
            console.log(`Successfully processed document: ${title}`);
          } else {
            console.log(`Skipping document at ${fullUrl} - missing title or content`);
          }

          // Add a small delay between requests
          await new Promise(resolve => setTimeout(resolve, this.config.minDelayBetweenRequests));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to process document at ${link}: ${errorMessage}`);
          try {
            await this.logCrawlResult(link.toString(), 'error', errorMessage);
          } catch (logError) {
            console.error('Failed to log error:', logError);
          }
          console.error(`Error processing document: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to crawl NJT: ${errorMessage}`);
      try {
        await this.logCrawlResult(this.source.url, 'error', errorMessage);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
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