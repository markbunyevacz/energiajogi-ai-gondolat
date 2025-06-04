import { CitationGraphBuilder } from '../citation-graph/CitationGraphBuilder';
import { EmbeddingService } from '../embedding/EmbeddingService';
import { supabase } from '@/integrations/supabase/client';
import { Document } from './Document';

export class DocumentProcessor {
  private citationBuilder: CitationGraphBuilder;

  constructor(embeddingService: EmbeddingService) {
    this.citationBuilder = new CitationGraphBuilder(
      supabase,
      embeddingService
    );
  }

  async processDocument(document: Document): Promise<void> {
    // ... existing processing ...

    // Process citations
    await this.citationBuilder.processDocument(document);
  }
} 