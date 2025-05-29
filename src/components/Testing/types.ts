
export interface TestResult {
  id: string;
  testName: string;
  category: 'authentication' | 'documents' | 'contracts' | 'qa' | 'agents' | 'performance' | 'security' | 'regression';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  duration?: number;
  details?: any;
  timestamp: Date;
}

export interface TestCategory {
  id: string;
  name: string;
  icon: string;
}

export interface TestStats {
  total: number;
  passed: number;
  failed: number;
  running: number;
  warnings: number;
}
