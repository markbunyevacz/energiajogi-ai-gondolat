import { CitationGraphBuilder } from '../citation-graph/CitationGraphBuilder';

export class DocumentProcessor {
  // ... existing methods ...

  async processDocuments(documents: Document[]) {
    // ... existing processing ...
    
    const graphBuilder = new CitationGraphBuilder(embeddingService);
    await graphBuilder.buildGraph(documents);
    await graphBuilder.persistGraph();
  }
} 