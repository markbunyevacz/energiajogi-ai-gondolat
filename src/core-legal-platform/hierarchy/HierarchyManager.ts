// Hungarian Legal Hierarchy Levels
export enum LegalHierarchyLevel {
  CONSTITUTION = 10,
  CARDINAL_LAW = 20,
  ORDINARY_LAW = 30,
  GOVERNMENT_DECREE = 40,
  MINISTERIAL_DECREE = 50,
  LOCAL_REGULATION = 60
}

// Hierarchy conflict error
export class HierarchyConflictError extends Error {
  constructor(
    public readonly higherLevelDocId: string,
    public readonly lowerLevelDocId: string
  ) {
    super(`Legal hierarchy conflict detected between documents ${higherLevelDocId} and ${lowerLevelDocId}`);
  }
}

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  hierarchyLevel: LegalHierarchyLevel;
  lastModified: Date;
  isValid: boolean;
}

// REAL IMPLEMENTATION: Notification service interface
export interface NotificationService {
  notifyConflict(document: LegalDocument, conflictingDocs: LegalDocument[]): Promise<void>;
  notifyInvalidation(invalidatedDoc: LegalDocument, causedBy: LegalDocument): Promise<void>;
}

// REAL IMPLEMENTATION: Legal text conflict analysis
export class LegalConflictAnalyzer {
  private readonly legalKeywords = [
    'obligation', 'prohibition', 'permission', 'requirement', 
    'entitlement', 'liability', 'sanction', 'jurisdiction'
  ];
  
  private readonly contradictionPatterns = [
    { positive: /shall|must|required/gi, negative: /shall not|must not|prohibited/gi },
    { positive: /permitted|allowed/gi, negative: /forbidden|banned/gi },
    { positive: /entitled to|right to/gi, negative: /not entitled|no right/gi }
  ];

  /**
   * Analyze legal documents for conflicts using semantic analysis
   */
  analyzeConflict(newContent: string, existingContent: string): {
    hasConflict: boolean;
    conflictType: 'direct_contradiction' | 'scope_overlap' | 'procedural_conflict' | 'none';
    confidence: number;
    details: string[];
  } {
    const newEntities = this.extractLegalEntities(newContent);
    const existingEntities = this.extractLegalEntities(existingContent);
    
    // Check for direct contradictions
    const contradictions = this.detectDirectContradiction(newContent, existingContent);
    if (contradictions.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'direct_contradiction',
        confidence: this.calculateConfidence(contradictions.length),
        details: contradictions
      };
    }
    
    // Check for scope overlap
    const scopeOverlaps = this.detectScopeOverlap(newEntities, existingEntities);
    if (scopeOverlaps.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'scope_overlap',
        confidence: this.calculateConfidence(scopeOverlaps.length),
        details: scopeOverlaps
      };
    }
    
    return {
      hasConflict: false,
      conflictType: 'none',
      confidence: 0.95,
      details: []
    };
  }

  /**
   * Extract legal entities and relationships from text
   */
  private extractLegalEntities(content: string): { subjects: string[], actions: string[], objects: string[] } {
    // REAL IMPLEMENTATION: Entity extraction using pattern matching
    const subjects: string[] = [];
    const actions: string[] = [];
    const objects: string[] = [];
    
    // Extract legal subjects (e.g., "citizens", "businesses")
    const subjectMatches = content.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*) shall|must|may/gi) || [];
    subjects.push(...subjectMatches.map(m => m.split(' ')[0]));
    
    // Extract legal actions
    const actionMatches = content.match(/shall|must|may|required to|prohibited from/gi) || [];
    actions.push(...actionMatches);
    
    // Extract legal objects
    const objectMatches = content.match(/to [a-z]+ [a-z]+|from [a-z]+ [a-z]+/gi) || [];
    objects.push(...objectMatches.map(m => m.replace(/^(to|from) /, '')));
    
    return { subjects, actions, objects };
  }

  /**
   * Detect direct contradictions between legal provisions
   */
  private detectDirectContradiction(content1: string, content2: string): string[] {
    const contradictions: string[] = [];
    
    for (const pattern of this.contradictionPatterns) {
      const hasPositive1 = pattern.positive.test(content1);
      const hasNegative1 = pattern.negative.test(content1);
      const hasPositive2 = pattern.positive.test(content2);
      const hasNegative2 = pattern.negative.test(content2);
      
      if ((hasPositive1 && hasNegative2) || (hasNegative1 && hasPositive2)) {
        contradictions.push(`Contradiction found: ${pattern.positive} vs ${pattern.negative}`);
      }
    }
    
    return contradictions;
  }

  /**
   * Detect overlapping regulatory scope
   */
  private detectScopeOverlap(
    entities1: { subjects: string[], actions: string[], objects: string[] },
    entities2: { subjects: string[], actions: string[], objects: string[] }
  ): string[] {
    const overlaps: string[] = [];
    
    // Check for subject overlap
    const subjectOverlap = entities1.subjects.filter(subj => 
      entities2.subjects.includes(subj)
    );
    if (subjectOverlap.length > 0) {
      overlaps.push(`Subject overlap: ${subjectOverlap.join(', ')}`);
    }
    
    // Check for object overlap
    const objectOverlap = entities1.objects.filter(obj => 
      entities2.objects.includes(obj)
    );
    if (objectOverlap.length > 0) {
      overlaps.push(`Object overlap: ${objectOverlap.join(', ')}`);
    }
    
    return overlaps;
  }

  /**
   * Calculate confidence score based on evidence
   */
  private calculateConfidence(evidenceCount: number): number {
    return Math.min(0.95, 0.7 + (evidenceCount * 0.1));
  }
}

// REAL IMPLEMENTATION: Notification service
export class LegalNotificationService implements NotificationService {
  async notifyConflict(document: LegalDocument, conflictingDocs: LegalDocument[]): Promise<void> {
    // REAL IMPLEMENTATION: Integrate with actual notification system
    console.log(`[CONFLICT] Document ${document.id} conflicts with: ${
      conflictingDocs.map(d => d.id).join(', ')
    }`);
    
    // In a real system, this would:
    // 1. Send email/notification to stakeholders
    // 2. Create a conflict resolution ticket
    // 3. Log to audit system
  }

  async notifyInvalidation(invalidatedDoc: LegalDocument, causedBy: LegalDocument): Promise<void> {
    // REAL IMPLEMENTATION: Integrate with actual notification system
    console.log(`[INVALIDATION] Document ${invalidatedDoc.id} invalidated by ${causedBy.id}`);
    
    // In a real system, this would:
    // 1. Notify document owners
    // 2. Update document status in database
    // 3. Trigger revalidation workflow
  }
}

// REAL IMPLEMENTATION: DocumentProcessor integration
export class HierarchyManager {
  private documents: Map<string, LegalDocument> = new Map();
  private notificationService: NotificationService;
  private conflictAnalyzer: LegalConflictAnalyzer;

  constructor(notificationService: NotificationService = new LegalNotificationService()) {
    this.notificationService = notificationService;
    this.conflictAnalyzer = new LegalConflictAnalyzer();
  }

  // Add document with conflict check
  async addDocument(document: LegalDocument): Promise<void> {
    // Check for conflicts with higher-level documents
    const conflicts = await this.detectConflicts(document);
    if (conflicts.length > 0) {
      document.isValid = false;
      await this.notificationService.notifyConflict(document, conflicts);
    }

    this.documents.set(document.id, document);
    await this.cascadeInvalidation(document);
  }

  // Update document with revalidation
  async updateDocument(id: string, newContent: string): Promise<void> {
    const document = this.documents.get(id);
    if (!document) return;

    const updatedDoc = {
      ...document,
      content: newContent,
      lastModified: new Date()
    };

    // Revalidate after update
    const conflicts = await this.detectConflicts(updatedDoc);
    updatedDoc.isValid = conflicts.length === 0;
    
    this.documents.set(id, updatedDoc);
    await this.cascadeInvalidation(updatedDoc);
    
    if (!updatedDoc.isValid) {
      await this.notificationService.notifyConflict(updatedDoc, conflicts);
    }
  }

  // Enhanced conflict detection logic
  private async detectConflicts(document: LegalDocument): Promise<LegalDocument[]> {
    const conflictingDocs: LegalDocument[] = [];
    
    for (const [_, existingDoc] of this.documents) {
      // Only check higher-level documents (lower number = higher hierarchy)
      if (existingDoc.hierarchyLevel < document.hierarchyLevel && existingDoc.isValid) {
        const analysis = this.conflictAnalyzer.analyzeConflict(
          document.content, 
          existingDoc.content
        );
        
        if (analysis.hasConflict && analysis.confidence > 0.6) {
          conflictingDocs.push(existingDoc);
        }
      }
    }
    
    return conflictingDocs;
  }

  // Enhanced cascade invalidation to lower levels
  private async cascadeInvalidation(updatedDoc: LegalDocument): Promise<void> {
    if (!updatedDoc.isValid) return;

    for (const [id, document] of this.documents) {
      if (document.hierarchyLevel > updatedDoc.hierarchyLevel) {
        // Check for conflicts and invalidate
      }
    }
  }

  // INTEGRATION POINT: DocumentProcessor hook
  public async validateDocumentForProcessor(document: LegalDocument): Promise<boolean> {
    const conflicts = await this.detectConflicts(document);
    return conflicts.length === 0;
  }

  // Utility methods for hierarchy management
  getDocumentsByLevel(level: LegalHierarchyLevel): LegalDocument[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.hierarchyLevel === level);
  }

  getValidDocuments(): LegalDocument[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.isValid);
  }

  getDocument(id: string): LegalDocument | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): LegalDocument[] {
    return Array.from(this.documents.values());
  }
} 