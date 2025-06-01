import { DocumentService } from '../lib/documentService.js';

async function processLegalDocuments() {
  // Initialize the document service with your Claude API key
  const documentService = new DocumentService(process.env.CLAUDE_API_KEY || '');

  try {
    // Example: Process a single document
    const file = new File(['document content'], 'example.txt', { type: 'text/plain' });
    const processedDoc = await documentService.processDocument(file);
    
    if (processedDoc) {
      console.log('Processed document metadata:', processedDoc.metadata);
    }

    // Example: Process multiple documents in batch
    const files = [
      new File(['document 1 content'], 'doc1.txt', { type: 'text/plain' }),
      new File(['document 2 content'], 'doc2.txt', { type: 'text/plain' }),
    ];

    const processedDocs = await documentService.processBatch(files);
    
    // Get statistics about the processed documents
    const stats = documentService.getDocumentStats(processedDocs);
    console.log('Document statistics:', stats);

    // Export processed documents to JSON
    const jsonOutput = documentService.exportToJson(processedDocs);
    console.log('JSON output:', jsonOutput);

  } catch (error) {
    console.error('Error processing documents:', error);
  }
}

// Run the example
processLegalDocuments().catch(console.error); 