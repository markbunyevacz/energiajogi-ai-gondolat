import { LegalDocumentService } from '../services/legal/legalDocumentService.js';

async function createTestData() {
  const service = new LegalDocumentService();

  try {
    // Create a legal document
    const document = await service.createLegalDocument({
      title: "Energy Market Regulation 2024",
      content: "New regulations for energy market participants...",
      document_type: "regulation",
      source_url: "https://example.com/regulations/2024/energy",
      publication_date: new Date().toISOString()
    });

    console.log("Created legal document:", document.id);

    // Create legal changes
    const changes = await Promise.all([
      service.createLegalChange({
        document_id: document.id,
        change_type: "amendment",
        description: "Updated pricing structure for renewable energy",
        impact_level: "high"
      }),
      service.createLegalChange({
        document_id: document.id,
        change_type: "new",
        description: "New reporting requirements for energy providers",
        impact_level: "medium"
      })
    ]);

    console.log("Created legal changes:", changes.map(c => c.id));

    // Create contracts
    const contracts = await Promise.all([
      service.createContract({
        contract_name: "Energy Supply Agreement",
        content: "Standard energy supply agreement...",
        contract_type: "service",
        risk_level: "high"
      }),
      service.createContract({
        contract_name: "Renewable Energy Purchase Agreement",
        content: "Agreement for purchasing renewable energy...",
        contract_type: "sales",
        risk_level: "medium"
      })
    ]);

    console.log("Created contracts:", contracts.map(c => c.id));

    // Create contract impacts
    const impacts = await Promise.all([
      service.analyzeContractImpact(contracts[0].id, changes[0].id),
      service.analyzeContractImpact(contracts[1].id, changes[1].id)
    ]);

    console.log("Created contract impacts:", impacts.map(i => i.id));

    console.log("\nTest data creation completed successfully!");
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

// Run the script
createTestData(); 