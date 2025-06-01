import { LegalCrawler } from './LegalCrawler.js';
import { CrawlerConfig, DocumentMetadata, ChangeDetectionResult } from './types.js';
import { createClient } from '@supabase/supabase-js';
import { JSDOM } from 'jsdom';

interface DocumentLink {
  url: string;
  title: string;
  type: 'PDF' | 'HTML';
}

export class MagyarKozlonyCrawler extends LegalCrawler {
  private supabase;

  constructor(config: CrawlerConfig, supabaseUrl: string, supabaseKey: string) {
    super(config);
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async crawl(): Promise<void> {
    if (!this.page) {
      throw new Error('Crawler not initialized');
    }

    try {
      // Navigate to the main page
      await this.page.goto(this.config.baseUrl);
      
      // Wait for the main content to load
      await this.page.waitForSelector('.main-content');

      // Get all document links
      const documentLinks = await this.page.$$eval('a[href*=".pdf"], a[href*=".html"]', 
        (links) => links.map(link => ({
          url: (link as HTMLAnchorElement).href,
          title: link.textContent?.trim() || '',
          type: (link as HTMLAnchorElement).href.endsWith('.pdf') ? 'PDF' : 'HTML'
        }))
      );

      // Process each document
      for (const link of documentLinks) {
        const metadata = await this.processDocument(link.url);
        if (metadata) {
          const changeResult = await this.detectChanges(metadata);
          await this.storeDocument(metadata, changeResult);
        }
      }

      // Check for pagination and continue if needed
      const hasNextPage = await this.page.$('.pagination .next:not(.disabled)');
      if (hasNextPage) {
        await this.page.click('.pagination .next');
        await this.crawl(); // Recursive call for next page
      }

    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private async detectChanges(metadata: DocumentMetadata): Promise<ChangeDetectionResult> {
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

  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    // Simple implementation using Levenshtein distance
    // In production, you might want to use more sophisticated algorithms
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

  private async storeDocument(
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
} 