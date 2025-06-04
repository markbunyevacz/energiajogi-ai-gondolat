import { DocumentProcessor } from './document-processing/DocumentProcessor';
import { EmbeddingService } from './embedding/EmbeddingService';

const embeddingService = new EmbeddingService();
const documentProcessor = new DocumentProcessor(embeddingService);

// In your document processing loop
for (const document of legalDocuments) {
  await documentProcessor.processDocument(document);
} 