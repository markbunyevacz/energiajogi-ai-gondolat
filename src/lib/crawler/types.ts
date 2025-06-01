import type { Database } from '@/integrations/supabase/types.js';

export type LegalSourceType = Database['public']['Enums']['legal_source_type'];
export type CrawlerStatus = Database['public']['Enums']['crawler_status'];

export interface LegalSource {
  id: string;
  name: string;
  url: string;
  type: string;
  crawlFrequency: number;
}

export interface CrawlerJob {
  id: string;
  source_id: string;
  status: CrawlerStatus;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  documents_found: number;
  documents_processed: number;
}

export interface CrawlerProxy {
  server: string;
  username?: string;
  password?: string;
}

export interface CrawlerConfig {
  name: string;
  baseUrl: string;
  maxRequestsPerMinute: number;
  minDelayBetweenRequests: number;
  retryConfig: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
}

export interface DocumentMetadata {
  source: string;
  source_type: LegalSourceType;
  original_url: string;
  published_date: string;
  document_number?: string;
  keywords: string[];
  category?: string;
  language: string;
  file_path?: string;
}

export interface CrawlerResult {
  success: boolean;
  documents: any[];
  errors: string[];
  startTime: Date;
  endTime: Date;
  source: LegalSource;
}

export interface CrawlLog {
  url: string;
  status: 'success' | 'error';
  error?: string;
  timestamp: Date;
  source: string;
} 