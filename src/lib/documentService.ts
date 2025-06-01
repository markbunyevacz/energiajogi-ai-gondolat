import { ClaudeService, ProcessedDocument } from './claude.js';
import { DocumentProcessor } from './documentProcessor.js';

export class DocumentService {
  private claudeService: ClaudeService;

  constructor(apiKey: string) {
    this.claudeService = new ClaudeService(apiKey);
  }

  /**
   * Process a single document
   */
  public async processDocument(file: File): Promise<ProcessedDocument | null> {
    try {
      const text = await DocumentProcessor.extractTextFromDocument(file);
      
      if (!DocumentProcessor.isValidLegalDocument(text)) {
        throw new Error('Invalid legal document');
      }

      return await this.claudeService.processDocument(text);
    } catch (error) {
      console.error('Error processing document:', error);
      return null;
    }
  }

  /**
   * Process multiple documents in batch
   */
  public async processBatch(files: File[]): Promise<ProcessedDocument[]> {
    const processedDocuments: ProcessedDocument[] = [];
    const validDocuments: string[] = [];

    // First, validate and extract text from all documents
    for (const file of files) {
      try {
        const text = await DocumentProcessor.extractTextFromDocument(file);
        if (DocumentProcessor.isValidLegalDocument(text)) {
          validDocuments.push(text);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    // Then process valid documents in batch
    if (validDocuments.length > 0) {
      const results = await this.claudeService.processBatch(validDocuments);
      processedDocuments.push(...results);
    }

    return processedDocuments;
  }

  /**
   * Export processed documents to JSON
   */
  public exportToJson(documents: ProcessedDocument[]): string {
    return JSON.stringify(documents, null, 2);
  }

  /**
   * Get document statistics
   */
  public getDocumentStats(documents: ProcessedDocument[]): {
    total: number;
    byType: Record<string, number>;
    byLegalArea: Record<string, number>;
  } {
    const stats = {
      total: documents.length,
      byType: {} as Record<string, number>,
      byLegalArea: {} as Record<string, number>,
    };

    documents.forEach(doc => {
      // Count by document type
      stats.byType[doc.metadata.documentType] = (stats.byType[doc.metadata.documentType] || 0) + 1;

      // Count by legal area
      doc.metadata.legalAreas.forEach((area: string) => {
        stats.byLegalArea[area] = (stats.byLegalArea[area] || 0) + 1;
      });
    });

    return stats;
  }
} 