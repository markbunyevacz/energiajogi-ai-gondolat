import { Anthropic } from '@anthropic-ai/sdk';

export interface DocumentMetadata {
  documentType: 'law' | 'regulation' | 'decision' | 'other';
  date: string;
  references: string[];
  legalAreas: string[];
  title: string;
  source: string;
}

export interface ProcessedDocument {
  content: string;
  metadata: DocumentMetadata;
}

export class ClaudeService {
  private anthropic: Anthropic;
  private readonly MAX_TOKENS = 100000;
  private readonly CHUNK_SIZE = 4000;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  private async processChunk(chunk: string, context: string): Promise<DocumentMetadata> {
    const prompt = `
    Analyze the following legal document chunk and extract metadata:
    
    Context: ${context}
    
    Document chunk:
    ${chunk}
    
    Extract and return the following information in JSON format:
    - documentType: The type of legal document (law, regulation, decision, other)
    - date: The date of the document
    - references: Array of legal references mentioned
    - legalAreas: Array of affected legal areas
    - title: The title of the document
    - source: The source of the document
    
    Return only the JSON object, no additional text.
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    return JSON.parse(response.content[0].text);
  }

  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.CHUNK_SIZE) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  public async processDocument(content: string): Promise<ProcessedDocument> {
    const chunks = this.splitIntoChunks(content);
    let combinedMetadata: DocumentMetadata = {
      documentType: 'other',
      date: '',
      references: [],
      legalAreas: [],
      title: '',
      source: '',
    };

    for (let i = 0; i < chunks.length; i++) {
      const context = i > 0 ? chunks[i - 1] : '';
      const chunkMetadata = await this.processChunk(chunks[i], context);
      
      // Merge metadata
      combinedMetadata = {
        documentType: combinedMetadata.documentType === 'other' ? chunkMetadata.documentType : combinedMetadata.documentType,
        date: combinedMetadata.date || chunkMetadata.date,
        references: [...new Set([...combinedMetadata.references, ...chunkMetadata.references])],
        legalAreas: [...new Set([...combinedMetadata.legalAreas, ...chunkMetadata.legalAreas])],
        title: combinedMetadata.title || chunkMetadata.title,
        source: combinedMetadata.source || chunkMetadata.source,
      };
    }

    return {
      content,
      metadata: combinedMetadata,
    };
  }

  public async processBatch(documents: string[]): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = [];
    
    for (const doc of documents) {
      try {
        const processed = await this.processDocument(doc);
        results.push(processed);
      } catch (error) {
        console.error('Error processing document:', error);
        // Continue with next document
      }
    }

    return results;
  }
} 