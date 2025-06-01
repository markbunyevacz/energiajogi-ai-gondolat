import { LegalCrawler } from './LegalCrawler.js';
import { CrawlerConfig, DocumentMetadata, ChangeDetectionResult, CrawlerJob } from './types.js';
import { createClient } from '@supabase/supabase-js';
import { JSDOM } from 'jsdom';
import { RateLimiter } from './RateLimiter.js';
import { ProxyRotator } from './ProxyRotator.js';
import { PDFParser } from './PDFParser.js';
import { HTMLParser } from './HTMLParser.js';
import winston from 'winston';

export class GenericCrawler extends LegalCrawler {
  protected supabase;
  protected rateLimiter: RateLimiter;
  protected proxyRotator: ProxyRotator;
  protected pdfParser: PDFParser;
  protected htmlParser: HTMLParser;
  protected logger: winston.Logger;

  constructor(config: CrawlerConfig, supabaseUrl: string, supabaseKey: string) {
    super(config);
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.proxyRotator = new ProxyRotator(config.proxyConfig);
    this.pdfParser = new PDFParser();
    this.htmlParser = new HTMLParser();
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'crawl.log' }),
        new winston.transports.Console()
      ]
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    await this.setupDatabase();
  }

  private async setupDatabase(): Promise<void> {
    // Create necessary tables if they don't exist
    const { error } = await this.supabase.rpc('setup_crawler_tables');
    if (error) {
      this.logger.error('Failed to setup database tables:', error);
      throw error;
    }
  }

  async crawl(): Promise<void> {
    if (!this.page) {
      throw new Error('Crawler not initialized');
    }

    try {
      // Get pending jobs from database
      const { data: jobs, error } = await this.supabase
        .from('crawler_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false });

      if (error) throw error;

      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private async processJob(job: CrawlerJob): Promise<void> {
    try {
      // Update job status
      await this.updateJobStatus(job.id, 'processing');

      // Apply rate limiting
      await this.rateLimiter.waitForSlot();

      // Process the source
      const documents = await this.processSource(job.source_url);

      // Store documents
      for (const doc of documents) {
        const changeResult = await this.detectChanges(doc);
        await this.storeDocument(doc, changeResult);
      }

      // Update job status
      await this.updateJobStatus(job.id, 'completed');
    } catch (error) {
      this.logger.error(`Job ${job.id} failed:`, error);
      await this.updateJobStatus(job.id, 'failed', error as Error);
    }
  }

  private async processSource(url: string): Promise<DocumentMetadata[]> {
    try {
      await this.page?.goto(url);
      const documents: DocumentMetadata[] = [];

      // Extract document links based on source type
      const links = await this.extractDocumentLinks();
      
      for (const link of links) {
        try {
          const metadata = await this.processDocument(link.url);
          if (metadata) {
            documents.push(metadata);
          }
        } catch (error) {
          this.logger.error(`Failed to process document ${link.url}:`, error);
        }
      }

      return documents;
    } catch (error) {
      throw new Error(`Failed to process source ${url}: ${error}`);
    }
  }

  private async extractDocumentLinks(): Promise<Array<{ url: string; type: string }>> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Implement source-specific link extraction logic
    const links = await this.page.$$eval('a[href*=".pdf"], a[href*=".html"]', 
      (elements) => elements.map(el => ({
        url: (el as HTMLAnchorElement).href,
        type: (el as HTMLAnchorElement).href.endsWith('.pdf') ? 'PDF' : 'HTML'
      }))
    );
    return links;
  }

  protected async processDocument(url: string): Promise<DocumentMetadata | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      const response = await this.page.goto(url);
      if (!response) throw new Error('Failed to get response');
      
      const contentType = response.headers()['content-type'] || '';

      let content = '';
      let metadata: Partial<DocumentMetadata>;

      if (contentType.includes('pdf')) {
        const responseBody = await response.body();
        if (!responseBody) throw new Error('Failed to get PDF content');
        
        const pdfResult = await this.pdfParser.parse(responseBody.toString());
        content = pdfResult.text;
        const documentId = await this.generateDocumentId(url);
        const contentHash = await this.calculateHash(content);
        
        metadata = {
          ...pdfResult.metadata,
          url,
          hash: contentHash,
          id: documentId,
          title: pdfResult.metadata.title || url,
          source: this.config.baseUrl,
          publishedDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          documentType: 'PDF',
          content_text: content,
          metadata: pdfResult.metadata
        };
      } else {
        const html = await response.text();
        if (!html) throw new Error('Failed to get HTML content');
        
        const htmlResult = await this.htmlParser.parse(html);
        content = htmlResult.text;
        const documentId = await this.generateDocumentId(url);
        const contentHash = await this.calculateHash(content);
        
        metadata = {
          ...htmlResult.metadata,
          url,
          hash: contentHash,
          id: documentId,
          title: htmlResult.metadata.title || url,
          source: this.config.baseUrl,
          publishedDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          documentType: 'HTML',
          content_text: content,
          metadata: htmlResult.metadata
        };
      }

      return metadata as DocumentMetadata;
    } catch (error) {
      this.logger.error(`Failed to process document ${url}:`, error);
      return null;
    }
  }

  private async generateDocumentId(url: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(url);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  protected async detectChanges(metadata: DocumentMetadata): Promise<ChangeDetectionResult> {
    try {
      // Check if document exists
      const { data: existingDoc } = await this.supabase
        .from('documents')
        .select('*')
        .eq('external_id', metadata.id)
        .single();

      if (!existingDoc) {
        return {
          isNew: true,
          isModified: false,
          similarityScore: 0
        };
      }

      // Compare content hashes
      if (existingDoc.content_hash === metadata.hash) {
        return {
          isNew: false,
          isModified: false,
          similarityScore: 1,
          previousVersion: existingDoc
        };
      }

      // Calculate similarity score
      const similarityScore = await this.calculateSimilarity(
        existingDoc.content_text,
        metadata.content_text
      );

      return {
        isNew: false,
        isModified: true,
        similarityScore,
        previousVersion: existingDoc
      };
    } catch (error: any) {
      throw new Error(`Failed to detect changes: ${error?.message || 'Unknown error'}`);
    }
  }

  protected async storeDocument(
    metadata: DocumentMetadata,
    changeResult: ChangeDetectionResult
  ): Promise<void> {
    try {
      if (changeResult.isNew) {
        // Insert new document
        await this.supabase.from('documents').insert({
          external_id: metadata.id,
          title: metadata.title,
          source: metadata.source,
          url: metadata.url,
          published_date: metadata.publishedDate,
          last_modified: metadata.lastModified,
          document_type: metadata.documentType,
          content_hash: metadata.hash,
          content_text: metadata.content_text,
          metadata: metadata.metadata
        });
      } else if (changeResult.isModified) {
        // Store previous version
        await this.supabase.from('document_versions').insert({
          document_id: changeResult.previousVersion?.id,
          content_hash: changeResult.previousVersion?.hash,
          content_text: changeResult.previousVersion?.content_text,
          metadata: changeResult.previousVersion?.metadata,
          similarity_score: changeResult.similarityScore
        });

        // Update current document
        await this.supabase
          .from('documents')
          .update({
            title: metadata.title,
            last_modified: metadata.lastModified,
            content_hash: metadata.hash,
            content_text: metadata.content_text,
            metadata: metadata.metadata
          })
          .eq('external_id', metadata.id);
      }
    } catch (error: any) {
      throw new Error(`Failed to store document: ${error?.message || 'Unknown error'}`);
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: 'processing' | 'completed' | 'failed',
    error?: Error
  ): Promise<void> {
    const update = {
      status,
      last_updated: new Date().toISOString(),
      error_message: error?.message
    };

    const { error: dbError } = await this.supabase
      .from('crawler_jobs')
      .update(update)
      .eq('id', jobId);

    if (dbError) {
      this.logger.error(`Failed to update job status for ${jobId}:`, dbError);
    }
  }

  private async calculateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    // Simple implementation using Levenshtein distance
    const maxLength = Math.max(text1.length, text2.length);
    if (maxLength === 0) return 1.0;

    const distance = this.levenshteinDistance(text1, text2);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(text1: string, text2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= text1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= text2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= text1.length; i++) {
      for (let j = 1; j <= text2.length; j++) {
        if (text1[i - 1] === text2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[text1.length][text2.length];
  }

  protected handleError(error: Error): void {
    this.logger.error('Crawler error:', error);
    super.handleError(error);
  }

  async cleanup(): Promise<void> {
    await super.cleanup();
  }
} 