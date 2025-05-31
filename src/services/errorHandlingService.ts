import { ContractAnalysisError, ErrorCodes, ErrorResponse as ApiErrorResponse, ErrorCode } from '@/types/errors';
import { LoggingService } from './loggingService';

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter?: boolean; // Add random jitter to prevent thundering herd
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true
};

interface ErrorDetails {
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

interface ErrorResponse {
  status: number;
  message: string;
  details?: ErrorDetails;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private retryConfigs: Map<ErrorCode, RetryConfig>;
  private logger: LoggingService;

  private constructor() {
    this.retryConfigs = new Map();
    this.logger = LoggingService.getInstance();
    this.initializeRetryConfigs();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private initializeRetryConfigs() {
    // Network errors - more aggressive retry with jitter
    this.retryConfigs.set(ErrorCodes.NETWORK_ERROR, {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true
    });

    // API errors - moderate retry
    this.retryConfigs.set(ErrorCodes.API_ERROR, {
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 15000,
      backoffFactor: 1.5,
      jitter: true
    });

    // Rate limit - longer delays
    this.retryConfigs.set(ErrorCodes.API_RATE_LIMIT, {
      maxAttempts: 2,
      initialDelay: 60000,
      maxDelay: 120000,
      backoffFactor: 1,
      jitter: false
    });

    // Document processing errors - moderate retry
    this.retryConfigs.set(ErrorCodes.DOCUMENT_PROCESSING_ERROR, {
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 20000,
      backoffFactor: 1.5,
      jitter: true
    });

    // OCR errors - more attempts due to potential temporary issues
    this.retryConfigs.set(ErrorCodes.OCR_ERROR, {
      maxAttempts: 4,
      initialDelay: 3000,
      maxDelay: 25000,
      backoffFactor: 1.5,
      jitter: true
    });

    // Contract analysis errors - more attempts due to potential temporary issues
    this.retryConfigs.set(ErrorCodes.CONTRACT_ANALYSIS_ERROR, {
      maxAttempts: 4,
      initialDelay: 3000,
      maxDelay: 25000,
      backoffFactor: 1.5,
      jitter: true
    });

    // Contract validation errors - more attempts due to potential temporary issues
    this.retryConfigs.set(ErrorCodes.CONTRACT_VALIDATION_ERROR, {
      maxAttempts: 4,
      initialDelay: 3000,
      maxDelay: 25000,
      backoffFactor: 1.5,
      jitter: true
    });

    // New API rate limit error
    this.retryConfigs.set(ErrorCodes.API_RATE_LIMIT, {
      maxAttempts: 2,
      initialDelay: 60000,
      maxDelay: 120000,
      backoffFactor: 1,
      jitter: false
    });
  }

  public async withRetry<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode,
    context?: any
  ): Promise<T> {
    const config = this.retryConfigs.get(errorCode) || DEFAULT_RETRY_CONFIG;
    let lastError: Error | null = null;
    let delay = config.initialDelay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isRetryableError(error as ContractAnalysisError)) {
          this.logger.log('error', 'Non-retryable error occurred', error as ContractAnalysisError, context);
          throw error;
        }

        if (attempt === config.maxAttempts) {
          this.logger.log('error', 'Max retry attempts reached', error as ContractAnalysisError, {
            ...context,
            attempt,
            config
          });
          break;
        }

        const jitteredDelay = config.jitter ? this.addJitter(delay) : delay;
        this.logger.log('warn', `Retrying operation (attempt ${attempt}/${config.maxAttempts})`, error as ContractAnalysisError, {
          ...context,
          delay: jitteredDelay
        });

        await this.wait(jitteredDelay);
        delay = Math.min(delay * config.backoffFactor, config.maxDelay);
      }
    }

    throw this.createErrorResponse(lastError as ContractAnalysisError, context);
  }

  private addJitter(delay: number): number {
    const jitter = Math.random() * 0.3; // 30% jitter
    return delay * (1 + jitter);
  }

  private isRetryableError(error: ContractAnalysisError): boolean {
    const retryableCodes = [
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.API_RATE_LIMIT,
      ErrorCodes.API_ERROR,
      ErrorCodes.DOCUMENT_PROCESSING_ERROR,
      ErrorCodes.OCR_ERROR,
      ErrorCodes.CONTRACT_ANALYSIS_ERROR,
      ErrorCodes.CONTRACT_VALIDATION_ERROR,
      ErrorCodes.API_RATE_LIMIT
    ] as const;
    return retryableCodes.includes(error.code as typeof retryableCodes[number]);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public createErrorResponse(error: ContractAnalysisError, context?: Record<string, unknown>): ErrorResponse {
    const errorMessage = error.message || 'Unknown error occurred';
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const errorStack = error.stack || '';
    
    const baseResponse: ErrorResponse = {
      status: 500,
      message: errorMessage,
      details: {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
        context
      }
    };

    // Add context-specific error handling
    if (context) {
      baseResponse.details = {
        ...baseResponse.details,
        context
      };
    }

    // Add specific error actions
    baseResponse.action = this.getErrorAction(error);

    // Log the error
    this.logger.log('error', errorMessage, error, context);

    return baseResponse;
  }

  private getErrorAction(error: ContractAnalysisError) {
    switch (error.code) {
      case ErrorCodes.CONTRACT_VALIDATION_ERROR:
        return {
          label: 'Szerződés javítása',
          onClick: () => {
            this.logger.log('info', 'Attempting to fix contract validation', error);
            // Implement contract validation fix logic
            console.log('Fixing contract validation...');
          }
        };
      case ErrorCodes.AUTHENTICATION_ERROR:
        return {
          label: 'Újra bejelentkezés',
          onClick: () => {
            this.logger.log('info', 'Attempting re-authentication', error);
            // Implement re-authentication logic
            console.log('Re-authenticating...');
          }
        };
      case ErrorCodes.API_RATE_LIMIT:
        return {
          label: 'Várjon 1 percet',
          onClick: () => {
            this.logger.log('info', 'Waiting for API rate limit', error);
            // Implement API rate limit handling
            console.log('Waiting for API rate limit...');
            setTimeout(() => this.handleRetry(error), 60000);
          }
        };
      case ErrorCodes.NETWORK_ERROR:
        return {
          label: 'Újrapróbálás',
          onClick: () => {
            this.logger.log('info', 'Retrying network operation', error);
            // Implement network retry with exponential backoff
            this.handleRetry(error);
          }
        };
      case ErrorCodes.DOCUMENT_PROCESSING_ERROR:
        return {
          label: 'Dokumentum újrafeldolgozása',
          onClick: () => {
            this.logger.log('info', 'Retrying document processing', error);
            this.handleRetry(error);
          }
        };
      case ErrorCodes.OCR_ERROR:
        return {
          label: 'OCR újrafuttatása',
          onClick: () => {
            this.logger.log('info', 'Retrying OCR processing', error);
            this.handleRetry(error);
          }
        };
      case ErrorCodes.CONTRACT_ANALYSIS_ERROR:
        return {
          label: 'Szerződés elemzése újra',
          onClick: () => {
            this.logger.log('info', 'Retrying contract analysis', error);
            this.handleRetry(error);
          }
        };
      case ErrorCodes.CONTRACT_VALIDATION_ERROR:
        return {
          label: 'Szerződés validálása újra',
          onClick: () => {
            this.logger.log('info', 'Retrying contract validation', error);
            this.handleRetry(error);
          }
        };
      default:
        return undefined;
    }
  }

  private handleRetry(error: ContractAnalysisError) {
    const config = this.retryConfigs.get(error.code as ErrorCode) || DEFAULT_RETRY_CONFIG;
    this.logger.log('info', 'Handling retry', error, { config });
    // Implement specific retry logic based on error type
  }

  public getRetryConfig(errorCode: ErrorCode): RetryConfig {
    return this.retryConfigs.get(errorCode) || DEFAULT_RETRY_CONFIG;
  }

  public getErrorStats() {
    return this.logger.getErrorStats();
  }
} 