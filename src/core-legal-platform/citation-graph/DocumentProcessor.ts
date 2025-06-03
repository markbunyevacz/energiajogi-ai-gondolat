import { LegalDocument, ProcessedDocument, Domain } from './types';
import { CitationError } from './errors';

export class DocumentProcessor {
  constructor(private readonly supabase: SupabaseClient) {}

  async processDocument(document: LegalDocument): Promise<ProcessedDocument> {
    try {
      const content = await this.extractContent(document);
      const domain = await this.detectDomain(content);
      return {
        id: document.id,
        content,
        domain,
        metadata: document.metadata
      };
    } catch (error) {
      throw new CitationError(
        'Failed to process document',
        'PROCESS_FAILED',
        'error',
        true,
        { documentId: document.id, error }
      );
    }
  }

  private async extractContent(document: LegalDocument): Promise<string> {
    // Implement content extraction logic
    return document.content;
  }

  private async detectDomain(content: string): Promise<Domain> {
    const domainPatterns = {
      energy: /energetikai|áram|villamos|gáz/gi,
      tax: /adó|jövedelem|társasági/gi,
      labor: /munkaviszony|foglalkoztatás|bér/gi
    };

    for (const [domain, pattern] of Object.entries(domainPatterns)) {
      if (pattern.test(content)) {
        return domain as Domain;
      }
    }

    return 'other';
  }

  async extractLegalReferences(content: string): Promise<string[]> {
    const patterns = [
      /(\d+\.)\s+törvény\s+(\d{4})\.\s+évben/gi,
      /(\d+\.)\s+törvény\s+(\d{4})\.\s+évben\s+(\d+)\.\s+paragrafus/gi
    ];

    const references: string[] = [];
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        references.push(match[0]);
      }
    }

    return references;
  }
} 