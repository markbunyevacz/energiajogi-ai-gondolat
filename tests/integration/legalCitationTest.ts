import { loadLegalDocuments } from '@/lib/legalLoader';
import { documentProcessor } from '@/core/documentProcessor';
import { CitationGraphBuilder } from '@/core-legal-platform/citation-graph/CitationGraphBuilder';
import { EmbeddingService } from '@/core-legal-platform/embedding/EmbeddingService';

// Add type to Document
interface Document {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    title: string;
    citation: string;
    documentType: string;
    date: string;
  };
}

async function testCitationSystem() {
  const documents = await loadLegalDocuments();
  
  // Process documents
  for (const doc of documents.slice(0, 100)) {
    await documentProcessor.processDocument(doc);
  }
  
  // Test impact chain
  const builder = new CitationGraphBuilder(
    supabase,
    process.env.OPENAI_API_KEY!,
    new EmbeddingService()
  );
  
  const impact = await builder.findImpactChain('important_law_123');
  console.log('Impact chain:', impact);
  
  // Verify citation extraction
  const testDoc = documents[0];
  const citations = builder.extractExplicitCitations(testDoc.content);
  console.log(`Extracted ${citations.length} citations from ${testDoc.metadata.title}`);
} 