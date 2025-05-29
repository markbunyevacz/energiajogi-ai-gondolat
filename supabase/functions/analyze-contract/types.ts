
export interface RequestBody {
  documentId: string;
  content: string;
  userId: string;
}

export interface ClaudeAnalysisResult {
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  risks?: Array<{
    type: 'legal' | 'financial' | 'operational';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
    section?: string;
  }>;
  recommendations?: string[];
}
