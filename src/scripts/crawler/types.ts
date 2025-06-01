export interface CrawlerConfig {
  baseUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    concurrentRequests: number;
  };
  proxyConfig: {
    enabled: boolean;
    proxyList: string[];
    rotationInterval: number;
  };
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface DocumentMetadata {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedDate: string;
  lastModified: string;
  documentType: string;
  hash: string;
  content_text: string;
  metadata: Record<string, any>;
}

export interface CrawlerStats {
  startTime: Date;
  endTime?: Date;
  documentsProcessed: number;
  errors: number;
  retries: number;
}

export interface CrawlerError {
  timestamp: Date;
  url: string;
  error: string;
  retryCount: number;
}

export interface ChangeDetectionResult {
  isNew: boolean;
  isModified: boolean;
  similarityScore: number;
  previousVersion?: DocumentMetadata;
}

export interface CrawlerJob {
  id: string;
  source_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  created_at: string;
  last_updated: string;
  error_message?: string;
} 