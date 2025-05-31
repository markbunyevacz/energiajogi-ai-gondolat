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
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  contractId: string | null;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  timestamp: string | null;
  risks: Risk[];
}

export interface Risk {
  id: string;
  description: string;
  level: 'low' | 'medium' | 'high';
  type: 'legal' | 'financial' | 'operational';
  severity: 'low' | 'medium' | 'high';
  recommendation: string | null;
  section: string | null;
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

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
