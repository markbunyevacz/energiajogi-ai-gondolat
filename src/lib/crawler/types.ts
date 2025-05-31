import type { Database } from '@/integrations/supabase/types';

export type LegalSourceType = Database['public']['Enums']['legal_source_type'];
export type CrawlerStatus = Database['public']['Enums']['crawler_status'];

export interface LegalSource {
  id: string;
  name: string;
  type: LegalSourceType;
  base_url: string;
  last_crawled_at: string | null;
  crawl_frequency_minutes: number;
  is_active: boolean;
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
  id: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  is_active: boolean;
  last_used_at: string | null;
  failure_count: number;
}

export interface CrawlerConfig {
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
  rateLimitDelay: number;
  maxConcurrentRequests: number;
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
  error?: string;
  documents?: {
    title: string;
    content: string;
    metadata: DocumentMetadata;
  }[];
} 