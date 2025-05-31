export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  metadata?: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface LogOptions {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  context?: Record<string, unknown>;
  metadata?: LogEntry['metadata'];
} 