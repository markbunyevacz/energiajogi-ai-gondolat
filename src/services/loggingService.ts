import { ContractAnalysisError, ErrorCode, ErrorCodes } from '@/types/errors';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: ContractAnalysisError;
  context?: any;
  metadata?: {
    component?: string;
    action?: string;
    userId?: string;
    sessionId?: string;
  };
}

interface ErrorPattern {
  code: ErrorCode;
  count: number;
  timeWindow: number; // in milliseconds
  occurrences: {
    timestamp: string;
    context?: any;
  }[];
}

export class LoggingService {
  private static instance: LoggingService;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly ERROR_THRESHOLD = 5; // Number of errors before triggering alert
  private errorCount: Map<ErrorCode, number> = new Map();
  private errorPatterns: Map<ErrorCode, ErrorPattern> = new Map();
  private readonly PATTERN_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly PATTERN_THRESHOLD = 3; // Number of occurrences to consider a pattern

  private constructor() {
    this.initializeErrorPatterns();
  }

  private initializeErrorPatterns() {
    // Initialize patterns for known error types
    Object.values(ErrorCodes).forEach(code => {
      this.errorPatterns.set(code as ErrorCode, {
        code: code as ErrorCode,
        count: 0,
        timeWindow: this.PATTERN_WINDOW,
        occurrences: []
      });
    });
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public log(
    level: LogLevel,
    message: string,
    error?: ContractAnalysisError,
    context?: any,
    metadata?: LogEntry['metadata']
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error,
      context,
      metadata
    };

    this.logs.push(entry);
    this.trimLogs();

    if (error) {
      this.trackError(error, context);
      this.detectErrorPattern(error, context);
    }

    // In production, you would send this to your logging service
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, {
        error,
        context,
        metadata
      });
    }

    // Report to external services in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToExternalServices(entry);
    }
  }

  private async reportToExternalServices(entry: LogEntry) {
    try {
      // Example: Report to error tracking service
      if (entry.error) {
        await this.reportToErrorTracking(entry);
      }

      // Example: Report to monitoring service
      if (entry.level === 'error' || entry.level === 'warn') {
        await this.reportToMonitoring(entry);
      }

      // Example: Report to analytics service
      await this.reportToAnalytics(entry);
    } catch (error) {
      console.error('Failed to report to external services:', error);
    }
  }

  private async reportToErrorTracking(entry: LogEntry) {
    // Implement integration with error tracking service (e.g., Sentry)
    // Example:
    // await Sentry.captureException(entry.error, {
    //   extra: {
    //     context: entry.context,
    //     metadata: entry.metadata
    //   }
    // });
  }

  private async reportToMonitoring(entry: LogEntry) {
    // Implement integration with monitoring service (e.g., Datadog)
    // Example:
    // await Datadog.increment('error.count', {
    //   error_code: entry.error?.code,
    //   severity: entry.error?.severity
    // });
  }

  private async reportToAnalytics(entry: LogEntry) {
    // Implement integration with analytics service
    // Example:
    // await Analytics.track('error_occurred', {
    //   error_code: entry.error?.code,
    //   component: entry.metadata?.component
    // });
  }

  private trimLogs() {
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
  }

  private trackError(error: ContractAnalysisError, context?: any) {
    const errorCode = error.code as ErrorCode;
    const count = (this.errorCount.get(errorCode) || 0) + 1;
    this.errorCount.set(errorCode, count);

    if (count >= this.ERROR_THRESHOLD) {
      this.triggerErrorAlert(error);
    }
  }

  private detectErrorPattern(error: ContractAnalysisError, context?: any) {
    const errorCode = error.code as ErrorCode;
    const pattern = this.errorPatterns.get(errorCode);
    if (!pattern) return;

    const now = Date.now();
    const recentOccurrences = pattern.occurrences.filter(
      occurrence => now - new Date(occurrence.timestamp).getTime() < pattern.timeWindow
    );

    pattern.occurrences = [
      ...recentOccurrences,
      { timestamp: new Date().toISOString(), context }
    ];

    if (pattern.occurrences.length >= this.PATTERN_THRESHOLD) {
      this.triggerPatternAlert(pattern);
    }
  }

  private triggerPatternAlert(pattern: ErrorPattern) {
    // In production, you would send this to your monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Error pattern detected for ${pattern.code}:`, {
        count: pattern.occurrences.length,
        timeWindow: pattern.timeWindow,
        occurrences: pattern.occurrences
      });
    }
  }

  private triggerErrorAlert(error: ContractAnalysisError) {
    // In production, you would send this to your monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Error threshold reached for ${error.code}:`, {
        count: this.errorCount.get(error.code as ErrorCode),
        error
      });
    }
  }

  public getRecentLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    return filtered.slice(-limit);
  }

  public getErrorStats(): Map<ErrorCode, number> {
    return new Map(this.errorCount);
  }

  public getErrorPatterns(): Map<ErrorCode, ErrorPattern> {
    return new Map(this.errorPatterns);
  }

  public clearLogs() {
    this.logs = [];
    this.errorCount.clear();
    this.initializeErrorPatterns();
  }
} 