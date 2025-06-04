import { loadLegalDocuments } from '@/lib/legalLoader';
import { documentProcessor } from '@/core/documentProcessor';

async function processLegalDocuments() {
  const documents = await loadLegalDocuments();
  let processedCount = 0;
  
  for (const doc of documents) {
    try {
      await documentProcessor.processDocument(doc);
      processedCount++;
      console.log(`Processed document: ${doc.metadata.title}`);
    } catch (error) {
      console.error(`Failed to process ${doc.metadata.title}:`, error);
    }
  }
  
  console.log(`Successfully processed ${processedCount}/${documents.length} documents`);
}

processLegalDocuments(); 