import { supabase } from '@/integrations/supabase/client';
import { MagyarKozlonyCrawler } from './magyar-kozlony-crawler';
import type { LegalSource, CrawlerJob } from './types';

export class CrawlerManager {
  private static instance: CrawlerManager;
  private isRunning = false;
  private currentJob: CrawlerJob | null = null;

  private constructor() {}

  public static getInstance(): CrawlerManager {
    if (!CrawlerManager.instance) {
      CrawlerManager.instance = new CrawlerManager();
    }
    return CrawlerManager.instance;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    while (this.isRunning) {
      try {
        await this.processNextSource();
        // Wait for 1 minute before checking for next source
        await new Promise(resolve => setTimeout(resolve, 60000));
      } catch (error) {
        console.error('Error in crawler manager:', error);
        // Wait for 5 minutes before retrying after an error
        await new Promise(resolve => setTimeout(resolve, 300000));
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async processNextSource(): Promise<void> {
    // Get sources that need to be crawled
    const { data: sources, error } = await supabase
      .from('legal_sources')
      .select('*')
      .eq('is_active', true)
      .lt('last_crawled_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('last_crawled_at', { ascending: true })
      .limit(1);

    if (error || !sources?.length) return;

    const source = sources[0];
    await this.crawlSource(source);
  }

  private async crawlSource(source: LegalSource): Promise<void> {
    // Create a new crawler job
    const { data: job, error: jobError } = await supabase
      .from('crawler_jobs')
      .insert({
        source_id: source.id,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating crawler job:', jobError);
      return;
    }

    this.currentJob = job;

    try {
      // Select appropriate crawler based on source type
      const crawler = this.createCrawler(source);
      const result = await crawler.crawl();

      if (result.success && result.documents) {
        // Store documents in the database
        for (const doc of result.documents) {
          await supabase.from('documents').insert({
            title: doc.title,
            content: doc.content,
            type: 'egyéb',
            metadata: {
              source: doc.metadata.source,
              source_type: doc.metadata.source_type,
              original_url: doc.metadata.original_url,
              published_date: doc.metadata.published_date,
              document_number: doc.metadata.document_number,
              keywords: doc.metadata.keywords,
              category: doc.metadata.category,
              language: doc.metadata.language,
              file_path: doc.metadata.file_path
            },
            upload_date: new Date().toISOString(),
            file_path: doc.metadata.file_path || null,
            file_size: doc.content.length
          });
        }

        // Update job status
        await supabase
          .from('crawler_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            documents_found: result.documents.length,
            documents_processed: result.documents.length
          })
          .eq('id', job.id);

        // Update source last crawled timestamp
        await supabase
          .from('legal_sources')
          .update({
            last_crawled_at: new Date().toISOString()
          })
          .eq('id', source.id);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error crawling source:', error);
      await supabase
        .from('crawler_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
        .eq('id', job.id);
    }

    this.currentJob = null;
  }

  private createCrawler(source: LegalSource) {
    switch (source.type) {
      case 'magyar_kozlony':
        return new MagyarKozlonyCrawler(source);
      // Add more crawler implementations here
      default:
        throw new Error(`No crawler implementation for source type: ${source.type}`);
    }
  }
} 