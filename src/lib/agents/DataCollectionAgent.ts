import { supabase } from '../../integrations/supabase/client.js';
import { CrawlerManager } from '../crawler/crawler-manager.js';
import { MagyarKozlonyCrawler } from '../crawler/magyar-kozlony-crawler.js';
import { HungarianGazetteCrawler } from '../crawler/hungarian-gazette-crawler.js';
import { JogtarCrawler } from '../crawler/jogtar-crawler.js';
import type { LegalSource, CrawlerResult, CrawlerConfig } from '../crawler/types.js';
import type { Database } from '../../integrations/supabase/types.js';

type LegalSourceRow = Database['public']['Tables']['legal_sources']['Row'];
type LegalSourceType = Database['public']['Enums']['legal_source_type'];
type DocumentType = Database['public']['Enums']['document_type'];

const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  name: 'default',
  baseUrl: '',
  maxRequestsPerMinute: 30,
  minDelayBetweenRequests: 2000,
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2
  }
};

export class DataCollectionAgent {
  private crawlerManager: CrawlerManager;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;
  private readonly MIN_RUN_INTERVAL = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.crawlerManager = CrawlerManager.getInstance();
  }

  /**
   * Starts the data collection process
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Data collection agent is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting data collection agent...');

    try {
      // Get all active legal sources
      const { data: sources, error } = await supabase
        .from('legal_sources')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      if (!sources) throw new Error('No active legal sources found');

      // Process each source
      for (const source of sources) {
        await this.processSource(source);
      }

      this.lastRunTime = new Date();
    } catch (error) {
      console.error('Error in data collection agent:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Processes a single legal source
   */
  private async processSource(source: LegalSourceRow): Promise<void> {
    try {
      console.log(`Processing source: ${source.name}`);

      // Check if it's time to crawl this source
      if (!this.shouldCrawlSource(source)) {
        console.log(`Skipping source ${source.name} - not due for crawling yet`);
        return;
      }

      // Create appropriate crawler based on source type
      const crawler = this.createCrawler(source);
      if (!crawler) {
        console.error(`No crawler available for source type: ${source.type}`);
        return;
      }

      // Run the crawler
      const result = await crawler.crawl();
      
      // Process the results
      await this.processCrawlResult(source, result);

      // Update last crawled timestamp
      await supabase
        .from('legal_sources')
        .update({ last_crawled_at: new Date().toISOString() })
        .eq('id', source.id);

    } catch (error) {
      console.error(`Error processing source ${source.name}:`, error);
      // Log the error but continue with other sources
    }
  }

  /**
   * Determines if a source should be crawled based on its crawl frequency
   */
  private shouldCrawlSource(source: LegalSourceRow): boolean {
    if (!source.last_crawled_at) return true;

    const lastCrawl = new Date(source.last_crawled_at);
    const now = new Date();
    const minutesSinceLastCrawl = (now.getTime() - lastCrawl.getTime()) / (1000 * 60);

    return minutesSinceLastCrawl >= source.crawl_frequency_minutes;
  }

  /**
   * Creates the appropriate crawler instance based on source type
   */
  private createCrawler(source: LegalSourceRow) {
    const legalSource: LegalSource = {
      id: source.id,
      name: source.name,
      url: source.base_url,
      type: source.type,
      crawlFrequency: source.crawl_frequency_minutes
    };

    const config: CrawlerConfig = {
      ...DEFAULT_CRAWLER_CONFIG,
      name: source.name,
      baseUrl: source.base_url
    };

    switch (source.type) {
      case 'magyar_kozlony':
        return new MagyarKozlonyCrawler(config);
      case 'official_journal':
        return new HungarianGazetteCrawler(legalSource, config);
      case 'legislation':
        return new JogtarCrawler(legalSource, config);
      default:
        return null;
    }
  }

  /**
   * Processes the results of a crawl operation
   */
  private async processCrawlResult(source: LegalSourceRow, result: CrawlerResult): Promise<void> {
    if (!result.success || !result.documents) {
      console.error(`Crawl failed for source ${source.name}:`, result.errors);
      return;
    }

    // Process each document
    for (const doc of result.documents) {
      try {
        // Map document type to Hungarian document type
        const documentType: DocumentType = this.mapDocumentType(doc.metadata.source_type);

        // Check if document already exists
        const { data: existingDoc } = await supabase
          .from('documents')
          .select('id')
          .eq('metadata->original_url', doc.metadata.original_url)
          .single();

        if (existingDoc) {
          // Update existing document
          await supabase
            .from('documents')
            .update({
              title: doc.title,
              content: doc.content,
              type: documentType,
              metadata: doc.metadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDoc.id);
        } else {
          // Insert new document
          await supabase.from('documents').insert({
            title: doc.title,
            content: doc.content,
            type: documentType,
            metadata: doc.metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error processing document:', error);
        // Continue with next document
      }
    }
  }

  /**
   * Maps crawler source type to Hungarian document type
   */
  private mapDocumentType(sourceType: LegalSourceType): DocumentType {
    switch (sourceType) {
      case 'magyar_kozlony':
      case 'official_journal':
        return 'törvény';
      case 'legislation':
        return 'rendelet';
      case 'court_decision':
        return 'határozat';
      default:
        return 'egyéb';
    }
  }

  /**
   * Stops the data collection process
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Stopping data collection agent...');
  }

  /**
   * Gets the current status of the agent
   */
  public getStatus(): {
    isRunning: boolean;
    lastRunTime: Date | null;
  } {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime
    };
  }
} 