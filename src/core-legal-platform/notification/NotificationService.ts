export interface InvalidationNotice {
  triggerDocument: string;
  invalidatedDocuments: string[];
  timestamp: Date;
}

export interface NotificationService {
  sendInvalidationNotice(notice: InvalidationNotice): void;
  // ... other existing methods ...
} 