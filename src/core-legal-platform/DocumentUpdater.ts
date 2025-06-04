export class DocumentUpdater {
  constructor(
    private readonly hierarchyManager: HierarchyManager
  ) {}

  public async updateDocument(doc: Document): Promise<void> {
    // ... existing update logic
    
    // Trigger cascade invalidation
    await this.hierarchyManager.cascadeInvalidation(doc.id);
  }
} 