import { BaseCrawler } from './base-crawler';
import type { CrawlerResult, DocumentMetadata } from './types';
import { supabase } from '@/integrations/supabase/client';
import { PDFDocument } from 'pdf-lib';

export class MagyarKozlonyCrawler extends BaseCrawler {
  private readonly baseUrl = 'https://magyarkozlony.hu';
  private readonly searchUrl = `${this.baseUrl}/kereses`;

  public async crawl(): Promise<CrawlerResult> {
    try {
      await this.initialize();
      const documents: CrawlerResult['documents'] = [];

      // Navigate to the search page
      await this.page!.goto(this.searchUrl);
      await this.page!.waitForLoadState('networkidle');

      // Get the latest issues
      const issueLinks = await this.page!.$$('a[href*="/lap/"]');
      const latestIssues = await Promise.all(
        issueLinks.slice(0, 5).map(link => link.getAttribute('href'))
      );

      for (const issueUrl of latestIssues) {
        if (!issueUrl) continue;

        // Navigate to the issue page
        await this.page!.goto(`${this.baseUrl}${issueUrl}`);
        await this.page!.waitForLoadState('networkidle');

        // Get all document links in the issue
        const docLinks = await this.page!.$$('a[href*="/dokumentum/"]');
        const docUrls = await Promise.all(
          docLinks.map(link => link.getAttribute('href'))
        );

        for (const docUrl of docUrls) {
          if (!docUrl) continue;

          // Check if document already exists
          const { data: existingDoc } = await supabase
            .from('documents')
            .select('id')
            .eq('metadata->original_url', `${this.baseUrl}${docUrl}`)
            .single();

          if (existingDoc) continue;

          // Navigate to the document page
          await this.page!.goto(`${this.baseUrl}${docUrl}`);
          await this.page!.waitForLoadState('networkidle');

          // Extract document information
          const title = await this.page!.$eval('h1', el => el.textContent?.trim() || '');
          const content = await this.page!.$eval('.document-content', el => el.textContent?.trim() || '');
          const documentNumber = await this.page!.$eval('.document-number', el => el.textContent?.trim() || '');
          const publishedDate = await this.page!.$eval('.published-date', el => el.textContent?.trim() || '');

          // Create metadata
          const metadata: DocumentMetadata = {
            source: 'Magyar Közlöny',
            source_type: 'magyar_kozlony',
            original_url: `${this.baseUrl}${docUrl}`,
            published_date: publishedDate,
            document_number: documentNumber,
            keywords: this.extractKeywords(content),
            language: 'hu'
          };

          // Download PDF if available
          const pdfLink = await this.page!.$('a[href*=".pdf"]');
          if (pdfLink) {
            const pdfUrl = await pdfLink.getAttribute('href');
            if (pdfUrl) {
              const pdfBuffer = await this.downloadPdf(`${this.baseUrl}${pdfUrl}`);
              if (pdfBuffer) {
                // Store PDF in Supabase Storage
                const fileName = `${documentNumber}-${Date.now()}.pdf`;
                const { data: storageData, error: storageError } = await supabase.storage
                  .from('legal-documents')
                  .upload(fileName, pdfBuffer, {
                    contentType: 'application/pdf',
                    upsert: true
                  });

                if (!storageError && storageData) {
                  metadata.file_path = storageData.path;
                }
              }
            }
          }

          documents.push({
            title,
            content,
            metadata
          });
        }
      }

      return {
        success: true,
        documents
      };
    } catch (error) {
      console.error('Error crawling Magyar Közlöny:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      await this.cleanup();
    }
  }

  private async downloadPdf(url: string): Promise<Buffer | null> {
    try {
      const response = await this.page!.goto(url);
      if (!response) return null;

      const buffer = await response.body();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      return null;
    }
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['és', 'vagy', 'a', 'az', 'egy', 'mint', 'hogy', 'van', 'lesz', 'volt']);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
} 