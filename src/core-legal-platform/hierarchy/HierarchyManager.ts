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
}

// Definition for Conflict and ConflictReport
export interface Conflict {
  documentId1: string; // The document being checked or the new document
  documentId2: string; // The existing document it conflicts with
  conflictType: 'direct_contradiction' | 'scope_overlap' | 'procedural_conflict' | 'none';
  details: string;
}

export interface ConflictReport {
  hasConflicts: boolean;
  conflicts: Conflict[];
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
   * Analyze legal documents for conflicts using semantic analysis.
   * Note: This is a simplified analyzer. Real-world scenarios require advanced NLP.
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
    
    // Placeholder for procedural conflict (not implemented)
    // if (this.detectProceduralConflict(newContent, existingContent)) {
    //   return { hasConflict: true, conflictType: 'procedural_conflict', confidence: 0.7, details: ["Procedural conflict detected."] };
    // }
    
    return {
      hasConflict: false,
      conflictType: 'none',
      confidence: 0.95, // High confidence if no conflict found by current rules
      details: []
    };
  }

  /**
   * Extract legal entities and relationships from text.
   * Note: This is a very basic entity extraction. Advanced NLP/NER needed for accuracy.
   */
  private extractLegalEntities(content: string): { subjects: string[], actions: string[], objects: string[] } {
    const subjects: string[] = [];
    const actions: string[] = [];
    const objects: string[] = [];
    
    const subjectMatches = content.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*) shall|must|may/gi) || [];
    subjects.push(...subjectMatches.map(m => m.split(' ')[0]));
    
    const actionMatches = content.match(/shall|must|may|required to|prohibited from/gi) || [];
    actions.push(...actionMatches);
    
    const objectMatches = content.match(/to [a-z]+ [a-z]+|from [a-z]+ [a-z]+/gi) || [];
    objects.push(...objectMatches.map(m => m.replace(/^(to|from) /, '')));
    
    return { subjects, actions, objects };
  }

  private detectDirectContradiction(content1: string, content2: string): string[] {
    const contradictions: string[] = [];
    for (const pattern of this.contradictionPatterns) {
      const hasPositive1 = pattern.positive.test(content1);
      const hasNegative1 = pattern.negative.test(content1);
      const hasPositive2 = pattern.positive.test(content2);
      const hasNegative2 = pattern.negative.test(content2);
      
      if ((hasPositive1 && hasNegative2) || (hasNegative1 && hasPositive2)) {
        contradictions.push(`Direct contradiction found based on pattern: positive regex '${pattern.positive}' vs negative regex '${pattern.negative}'`);
      }
    }
    return contradictions;
  }

  private detectScopeOverlap(
    entities1: { subjects: string[], actions: string[], objects: string[] },
    entities2: { subjects: string[], actions: string[], objects: string[] }
  ): string[] {
    const overlaps: string[] = [];
    const subjectOverlap = entities1.subjects.filter(subj => entities2.subjects.includes(subj));
    if (subjectOverlap.length > 0) {
      overlaps.push(`Subject overlap on: ${subjectOverlap.join(', ')}`);
    }
    const objectOverlap = entities1.objects.filter(obj => entities2.objects.includes(obj));
    if (objectOverlap.length > 0) {
      overlaps.push(`Object overlap on: ${objectOverlap.join(', ')}`);
    }
    return overlaps;
  }

  private calculateConfidence(evidenceCount: number): number {
    return Math.min(0.95, 0.7 + (evidenceCount * 0.1)); // Capped at 0.95
  }
}

// REAL IMPLEMENTATION: Notification service
export class LegalNotificationService implements NotificationService {
  async notifyConflict(document: LegalDocument, conflictingDocs: LegalDocument[]): Promise<void> {
    // REAL IMPLEMENTATION: Integrate with actual notification system
    // This is a placeholder. In a real system, this would:
    // 1. Send email/notification to relevant stakeholders (e.g., document owners, legal reviewers).
    // 2. Create a conflict resolution task in a workflow system or ticketing system.
    // 3. Log the conflict details to an audit trail or monitoring system.
    console.warn(`[LEGAL HIERARCHY CONFLICT]`);
    console.warn(`Document ID: ${document.id} (Title: "${document.title}", Level: ${LegalHierarchyLevel[document.hierarchyLevel]})`);
    console.warn(`Conflicts with the following document(s):`);
    conflictingDocs.forEach(conflictingDoc => {
      console.warn(`  - ID: ${conflictingDoc.id} (Title: "${conflictingDoc.title}", Level: ${LegalHierarchyLevel[conflictingDoc.hierarchyLevel]})`);
    });
    // Example: sendEmail('legal-team@example.com', 'Conflict Detected', `...details...`);
    // Example: createJiraTicket('Conflict in document ' + document.id, '...');
  }

  async notifyInvalidation(invalidatedDoc: LegalDocument, causedBy: LegalDocument): Promise<void> {
    // REAL IMPLEMENTATION: Integrate with actual notification system
    // This is a placeholder. In a real system, this would:
    // 1. Notify owners/stewards of the invalidated document.
    // 2. Update the document's status to "Invalid" or "Requires Review" in the primary document management system/database.
    // 3. Potentially trigger automated workflows for re-evaluation or archival of the invalidated document.
    // 4. Log the invalidation event for auditing purposes.
    console.warn(`[LEGAL DOCUMENT INVALIDATION]`);
    console.warn(`Document ID: ${invalidatedDoc.id} (Title: "${invalidatedDoc.title}", Level: ${LegalHierarchyLevel[invalidatedDoc.hierarchyLevel]}) has been invalidated.`);
    console.warn(`Reason: Changes in higher-level document ID: ${causedBy.id} (Title: "${causedBy.title}", Level: ${LegalHierarchyLevel[causedBy.hierarchyLevel]}).`);
    console.warn(`The status of document ${invalidatedDoc.id} should be updated to reflect this invalidation.`);
    // Example: updateDocumentStatusInDB(invalidatedDoc.id, 'INVALID');
    // Example: sendEmail(invalidatedDoc.ownerEmail, 'Document Invalidated', '...');
  }
}

// REAL IMPLEMENTATION: DocumentProcessor integration
export class HierarchyManager {
  private readonly documents: Map<string, LegalDocument> = new Map();
  private readonly notificationService: NotificationService;
  private readonly conflictAnalyzer: LegalConflictAnalyzer;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
    this.conflictAnalyzer = new LegalConflictAnalyzer();
  }

  public registerDocument(doc: LegalDocument): void {
    if (!doc || typeof doc.id !== 'string' || typeof doc.hierarchyLevel === 'undefined') {
        console.error("Attempted to register an invalid or incomplete document.", doc);
        // Optionally throw an error: throw new Error("Invalid document for registration.");
        return;
    }
    doc.isValid = doc.isValid !== undefined ? doc.isValid : true; // Default to valid if not specified
    doc.lastModified = doc.lastModified || new Date();
    this.documents.set(doc.id, doc);
    console.log(`Document ${doc.id} registered. Level: ${LegalHierarchyLevel[doc.hierarchyLevel]}, Valid: ${doc.isValid}`);
  }

  public checkConflicts(newDoc: LegalDocument): ConflictReport {
    const conflicts: Conflict[] = [];
    if (!newDoc || !newDoc.content) {
        console.warn("Cannot check conflicts for a document without content.", newDoc);
        return { hasConflicts: false, conflicts: [] };
    }
    
    for (const existingDoc of this.documents.values()) {
      if (newDoc.id === existingDoc.id) continue; 
      if (!existingDoc.isValid) continue; // Skip conflicts with already invalid documents

      // Conflict check logic:
      // 1. If newDoc is lower level than existingDoc (e.g., new Ordinary Law vs existing Constitution)
      //    -> newDoc potential conflict with existingDoc (higher authority)
      // 2. If newDoc is same level as existingDoc (e.g., new Ordinary Law vs existing Ordinary Law)
      //    -> mutual conflict potential
      // 3. If newDoc is higher level than existingDoc (e.g., new Constitution vs existing Ordinary Law)
      //    -> this scenario primarily triggers cascade invalidation for existingDoc if newDoc changes,
      //       not typically a "conflict" that invalidates newDoc itself.
      //       However, for completeness, we might still want to log potential inconsistencies.
      //       Let's focus on newDoc being invalidated by higher or same level laws.
      if (newDoc.hierarchyLevel >= existingDoc.hierarchyLevel) { // newDoc is lower or same level
        const conflictResult = this.conflictAnalyzer.analyzeConflict(newDoc.content, existingDoc.content);
        if (conflictResult.hasConflict) {
          const conflictDetail: Conflict = {
            documentId1: newDoc.id,
            documentId2: existingDoc.id,
            conflictType: conflictResult.conflictType,
            details: `Conflict between ${newDoc.id} (Level: ${LegalHierarchyLevel[newDoc.hierarchyLevel]}) and ${existingDoc.id} (Level: ${LegalHierarchyLevel[existingDoc.hierarchyLevel]}): ${conflictResult.details.join('; ')}`
          };
          conflicts.push(conflictDetail);
          // Consider notifying immediately or letting the caller handle notifications based on the report.
          // await this.notificationService.notifyConflict(newDoc, [existingDoc]); // Example immediate notification
        }
      }
    }
    
    const report = { hasConflicts: conflicts.length > 0, conflicts };
    if (report.hasConflicts) {
        console.warn(`Conflict check for ${newDoc.id} found ${report.conflicts.length} conflicts.`);
    }
    return report;
  }

  public async cascadeInvalidation(changedDocId: string): Promise<void> {
    const changedDoc = this.documents.get(changedDocId);
    // Ensure the changed document itself is valid and exists before cascading.
    // If a document is updated to be invalid, that change itself is the event,
    // and then cascade considers its previous valid state or the implications of its new (e.g. amended) content if it's still valid.
    // For simplicity, we assume changedDoc is the *newly validated and current version* of the document.
    if (!changedDoc || !changedDoc.isValid) {
      console.log(`Cascade invalidation skipped: Document ${changedDocId} not found or is already invalid.`);
      return;
    }

    const invalidatedDocsBatch: LegalDocument[] = [];
    
    for (const doc of this.documents.values()) {
      if (doc.id === changedDocId || !doc.isValid) continue; // Don't compare with itself or already invalid docs

      // A document 'doc' should be invalidated if:
      // 1. 'doc' is of a lower hierarchy level than 'changedDoc'.
      // 2. 'doc' depends on 'changedDoc'.
      if (doc.hierarchyLevel > changedDoc.hierarchyLevel && this.dependsOn(changedDoc, doc)) {
        // Invalidate 'doc'
        const previousIsValid = doc.isValid;
        doc.isValid = false;
        doc.lastModified = new Date();
        if (previousIsValid) { // Only add to batch and log if it was previously valid
            invalidatedDocsBatch.push(doc);
            console.log(`Document ${doc.id} (Level: ${LegalHierarchyLevel[doc.hierarchyLevel]}) marked as invalid due to changes in ${changedDoc.id} (Level: ${LegalHierarchyLevel[changedDoc.hierarchyLevel]}).`);
        }
      }
    }

    if (invalidatedDocsBatch.length > 0) {
      // Notify for each invalidated document
      for (const invalidatedDoc of invalidatedDocsBatch) {
        // Ensure causedBy is the document that triggered the invalidation
        await this.notificationService.notifyInvalidation(invalidatedDoc, changedDoc);
      }
      console.log(`${invalidatedDocsBatch.length} document(s) were invalidated and notifications sent.`);
    } else {
        console.log(`No documents were invalidated by the change in ${changedDocId}.`);
    }
  }

  // invalidateDocument is now effectively part of cascadeInvalidation logic to update internal state.
  // It's not called directly from outside in this refactor but kept if direct invalidation becomes a feature.
  private invalidateDocument(docId: string, causedBy: LegalDocument): void {
    const document = this.documents.get(docId);
    if (document && document.isValid) { // Only act if document exists and is currently valid
      document.isValid = false;
      document.lastModified = new Date();
      console.log(`Document ${docId} has been programmatically invalidated by ${causedBy.id}.`);
      // No notification from here; cascadeInvalidation handles notifications.
    }
  }
  
  // Removed hasConflictingProvisions as its logic is now directly in checkConflicts with conflictAnalyzer

  /**
   * Checks if a lower-level document 'lowerDoc' depends on a higher-level document 'higherDoc'.
   * This is a simplified check. Real-world dependency might involve analyzing content for explicit references,
   * common subject matter, or maintained dependency graphs.
   * @param higherDoc The higher-level document.
   * @param lowerDoc The lower-level document.
   * @returns True if lowerDoc is considered dependent on higherDoc for invalidation purposes.
   */
  private dependsOn(higherDoc: LegalDocument, lowerDoc: LegalDocument): boolean {
    if (!higherDoc || !lowerDoc) return false;
    if (!higherDoc.isValid) return false; // Cannot depend on an invalid document for this purpose.
    
    // Basic hierarchical dependency: a lower-level law depends on a higher-level one.
    // More advanced: check for thematic links, shared keywords, explicit citations (future enhancement).
    return lowerDoc.hierarchyLevel > higherDoc.hierarchyLevel;
  }

  public async validateDocumentForProcessor(document: LegalDocument): Promise<boolean> {
    if (!this.documents.has(document.id)) {
       // Important: The document should be registered first to be part of the hierarchy for accurate conflict checking.
       // Consider if this method should auto-register or throw if not found.
       // For now, we proceed, but conflicts might be missed if it's not in `this.documents`.
       console.warn(`Document ${document.id} is being validated but is not registered in HierarchyManager. Register it first for comprehensive checks.`);
    }
    if (!document.isValid) {
        console.log(`Document ${document.id} is already marked as invalid. Skipping conflict checks for processor validation.`);
        return false; // Or true, depending on whether an invalid doc should pass "validation" (likely false)
    }

    const report = this.checkConflicts(document); 
    
    if (report.hasConflicts) {
      console.log(`[VALIDATION FAIL] Document ${document.id} (Level: ${LegalHierarchyLevel[document.hierarchyLevel]}) has ${report.conflicts.length} conflicts:`);
      report.conflicts.forEach(conflict => {
        const conflictingDoc = this.documents.get(conflict.documentId2);
        const conflictingDocLevel = conflictingDoc ? LegalHierarchyLevel[conflictingDoc.hierarchyLevel] : 'N/A';
        console.log(`  - Conflicts with: ${conflict.documentId2} (Level: ${conflictingDocLevel}), Type: ${conflict.conflictType}, Details: ${conflict.details}`);
      });
      // Optionally, notify about conflicts found during this validation step using NotificationService
      // This depends on whether the caller or this method is responsible for notifications.
      // For example:
      // const conflictingDocs = report.conflicts.map(c => this.getDocument(c.documentId2)).filter(d => d !== undefined) as LegalDocument[];
      // if (conflictingDocs.length > 0) {
      //    await this.notificationService.notifyConflict(document, conflictingDocs);
      // }
      return false; // Validation fails if there are conflicts
    }
    console.log(`[VALIDATION SUCCESS] Document ${document.id} passed hierarchy validation.`);
    return true; // Validation passes if no conflicts
  }

  getDocumentsByLevel(level: LegalHierarchyLevel): LegalDocument[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.hierarchyLevel === level && doc.isValid); // Added isValid check
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

// This function seems like a utility for a broader state management, possibly unrelated to the core HierarchyManager internal logic.
// Providing 'any' types to satisfy linter for now, as its specific structure is external to this file's main concern.
const mergeLegalState = (hierarchyState: any, queueState: any) => ({
  legalHierarchy: {
    ...hierarchyState,
    validationQueue: queueState.priorityQueue
  }
});

// Removed problematic imports from the end of the file as definitions are local or should be properly managed at the top.
// import { MessageQueue } from '../queue/MessageQueue';
// import { NotificationService } from '../notifications'; 
// import { MessageQueue } from '../queue/MessageQueue';
// import { NotificationService } from '../notifications'; 