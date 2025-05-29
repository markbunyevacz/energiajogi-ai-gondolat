
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type UserRole = 'jogász' | 'it_vezető' | 'tulajdonos';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  metadata: DocumentMetadata;
  uploadDate: string;
  size: number;
  vectorId?: string;
  analysis_status?: 'not_analyzed' | 'analyzing' | 'completed' | 'failed';
  analysis_error?: string;
}

export type DocumentType = 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';

export interface DocumentMetadata {
  source: string;
  date: string;
  keywords: string[];
  author?: string;
  version?: string;
  category?: string;
}

export interface SearchResult {
  documentId: string;
  relevanceScore: number;
  snippet: string;
  title: string;
  metadata: DocumentMetadata;
}

export interface QASession {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  timestamp: string;
  userId: string;
  confidence: number;
}

export interface ContractAnalysis {
  id: string;
  contractId: string;
  riskLevel: 'low' | 'medium' | 'high';
  risks: Risk[];
  recommendations: string[];
  summary: string;
  timestamp: string;
}

export interface Risk {
  type: 'legal' | 'financial' | 'operational';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  section?: string;
}

export interface DashboardStats {
  totalDocuments: number;
  recentQueries: number;
  contractsAnalyzed: number;
  riskScore: number;
  costSavings?: number;
  apiUsage?: number;
  userActivity?: number;
}
