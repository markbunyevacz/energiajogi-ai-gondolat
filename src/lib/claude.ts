import { Anthropic } from '@anthropic-ai/sdk';
import { getMetadataExtractionPrompt } from './promptTemplates';

export interface DocumentMetadata {
  documentType: 'law' | 'regulation' | 'decision' | 'other';
  date: string;
  references: string[];
  legalAreas: string[];
  title: string;
  source: string;
  error?: string;
  raw?: string;
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
    const prompt = getMetadataExtractionPrompt(chunk, context);

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    return this.safeParseJson(response.content[0].text);
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
    return Promise.all(documents.map(doc => this.processDocument(doc)));
  }

  private safeParseJson(text: string): DocumentMetadata {
    try {
      const match = text.match(/{[\s\S]*}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error('No JSON found in response');
    } catch (e) {
      return {
        documentType: 'other',
        date: '',
        references: [],
        legalAreas: [],
        title: '',
        source: '',
        error: 'Parsing error: ' + (e as Error).message,
        raw: text
      } as any;
    }
  }
} 