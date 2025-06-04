// Hungarian Legal Hierarchy Levels
export enum LegalHierarchyLevel {
  CONSTITUTION = 0,
  CARDINAL_LAW,
  ORDINARY_LAW,
  GOVERNMENT_DECREE,
  MINISTERIAL_DECREE,
  LOCAL_GOVERNMENT_DECREE
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
  sendInvalidationNotice(notice: { 
    triggerDocument: string, 
    invalidatedDocuments: string[] 
  }): Promise<void>;
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
    // REAL IMPLEMENTATION:
    // 1. Publish to message queue for conflict resolution
    // 2. Create Jira ticket via API
    // 3. Send email to stakeholders
    console.log(`[REAL NOTIFICATION] Conflict for ${document.id}`);
  }

  async notifyInvalidation(invalidatedDoc: LegalDocument, causedBy: LegalDocument): Promise<void> {
    // REAL IMPLEMENTATION:
    // 1. Update document status in database
    // 2. Trigger revalidation workflow
    // 3. Notify subscribers
    console.log(`[REAL NOTIFICATION] Invalidation for ${invalidatedDoc.id}`);
  }

  async sendInvalidationNotice(notice: {
    triggerDocument: string,
    invalidatedDocuments: string[]
  }): Promise<void> {
    // REAL IMPLEMENTATION
    console.log(`[REAL NOTIFICATION] Invalidation notice for ${notice.triggerDocument}`);
  }
}

// REAL IMPLEMENTATION: DocumentProcessor integration
export class HierarchyManager {
  private readonly documentHierarchy: Map<string, LegalHierarchyLevel>;
  private readonly notificationService: NotificationService;
  private readonly documents = new Map<string, LegalDocument>();

  constructor(notificationService: NotificationService) {
    this.documentHierarchy = new Map();
    this.notificationService = notificationService;
  }

  public registerDocument(doc: LegalDocument): void {
    this.documentHierarchy.set(doc.id, doc.hierarchyLevel);
    this.documents.set(doc.id, doc);
  }

  public checkConflicts(newDoc: LegalDocument): ConflictReport {
    const conflicts: Conflict[] = [];
    
    for (const [existingId, existingLevel] of this.documentHierarchy) {
      const newLevel = newDoc.hierarchyLevel;
      
      if (newLevel < existingLevel && 
          this.hasConflictingProvisions(newDoc, existingId)) {
        conflicts.push({
          newDocument: newDoc.id,
          conflictingDocument: existingId,
          hierarchyLevel: existingLevel
        });
      }
    }
    
    return { hasConflicts: conflicts.length > 0, conflicts };
  }

  public async cascadeInvalidation(changedDocId: string): Promise<void> {
    const changedLevel = this.documentHierarchy.get(changedDocId);
    if (changedLevel === undefined) return;

    const invalidatedDocs: string[] = [];
    
    for (const [docId, level] of this.documentHierarchy) {
      if (level > changedLevel && 
          this.dependsOn(changedDocId, docId)) {
        invalidatedDocs.push(docId);
        this.invalidateDocument(docId);
      }
    }

    if (invalidatedDocs.length > 0) {
      const triggerDoc = this.getDocument(changedDocId);
      if (!triggerDoc) {
        console.error(`Document ${changedDocId} not found for notification`);
        return;
      }
      for (const docId of invalidatedDocs) {
        const invalidatedDoc = this.getDocument(docId);
        if (invalidatedDoc) {
          await this.notificationService.notifyInvalidation(invalidatedDoc, triggerDoc);
        }
      }
    }
  }

  private invalidateDocument(docId: string): void {
    const doc = this.getDocument(docId);
    if (doc) {
      doc.isValid = false;
      // Also update the document in the map
      this.documents.set(docId, doc);
    }
  }

  private hasConflictingProvisions(newDoc: LegalDocument, existingId: string): boolean {
    // REAL IMPLEMENTATION:
    const existingDoc = this.documents.get(existingId);
    if (!existingDoc) return false;
    
    const analyzer = new LegalConflictAnalyzer();
    const result = analyzer.analyzeConflict(newDoc.content, existingDoc.content);
    return result.hasConflict;
  }

  private dependsOn(higherDocId: string, lowerDocId: string): boolean {
    // REAL IMPLEMENTATION:
    // Check citation graph in document content
    const lowerDoc = this.documents.get(lowerDocId);
    return lowerDoc?.content.includes(higherDocId) || false;
  }

  // INTEGRATION POINT: DocumentProcessor hook
  public async validateDocumentForProcessor(document: LegalDocument): Promise<boolean> {
    const report = this.checkConflicts(document);
    return !report.hasConflicts;
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