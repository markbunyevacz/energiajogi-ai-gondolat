import { HierarchyManager } from './hierarchy/HierarchyManager';

export class DocumentProcessor {
  constructor(
    private readonly hierarchyManager: HierarchyManager
  ) {}

  public async processDocument(doc: Document): Promise<void> {
    // ... existing processing
    
    // Add hierarchy validation
    this.hierarchyManager.validateAgainstHierarchy(doc, existingDocs);
    
    // ... continue processing
  }

  // New Hungarian-specific validation methods
  public isConstitutionalAmendment(content: string): boolean {
    // Check for proper amendment language and references
    return /(alkotmánymódosítás|Alaptörvény [XVI]+\. cikk)/i.test(content);
  }

  public detectFundamentalRightsViolation(
    docContent: string, 
    constitutionContent: string
  ): boolean {
    // Check for fundamental rights references with negative context
    const rightsKeywords = [
      'emberi jog', 'alapjog', 'szabadságjog', 
      'tulajdonjog', 'szólásszabadság'
    ];
    
    return rightsKeywords.some(right => 
      docContent.includes(right) && 
      !constitutionContent.includes(right)
    );
  }

  public isWithinLocalAuthority(content: string, jurisdiction: string): boolean {
    // Check if content stays within local authority boundaries
    const localKeywords = [
      'helyi adó', 'közterület', 'önkormányzati',
      'helyi építési', 'közlekedési rendelet'
    ];
    
    return localKeywords.some(keyword => 
      content.includes(keyword) && 
      !content.includes('országos') &&
      !content.includes('nemzeti')
    );
  }
} 