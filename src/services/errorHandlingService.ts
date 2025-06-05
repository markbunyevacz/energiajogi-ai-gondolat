import { ContractAnalysisError, ErrorCodes, ErrorCode } from '@/types/errors';
import { LoggingService } from './loggingService';

/**
 * Error Handling Service
 * 
 * This service provides centralized error handling and retry logic for the Legal AI application.
 * It handles various types of errors with configurable retry strategies and provides
 * user-friendly error responses.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Error categorization and context preservation
 * - Jitter support to prevent thundering herd problems
 * - Integration with logging service
 * - User-friendly error messages and recovery actions
 */

/**
 * Retry Configuration Interface
 * 
 * Defines the retry behavior for different types of operations
 */
interface RetryConfig {
  maxAttempts: number;      // Maximum number of retry attempts
  initialDelay: number;     // Initial delay in milliseconds
  maxDelay: number;         // Maximum delay cap in milliseconds
  backoffFactor: number;    // Multiplier for exponential backoff
  jitter?: boolean;         // Add random jitter to prevent thundering herd
}

/**
 * Default Retry Configuration
 * 
 * Balanced retry settings suitable for most operations
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,       // 1 second
  maxDelay: 10000,          // 10 seconds max
  backoffFactor: 2,         // Double delay each time
  jitter: true              // Add randomization
};

/**
 * Error Details Interface
 * 
 * Structured error information for consistent error handling
 */
interface ErrorDetails {
  message: string;                         // Human-readable error message
  code?: string;                          // Error code for programmatic handling
  stack?: string;                         // Stack trace for debugging
  context?: Record<string, unknown>;      // Additional context data
}

/**
 * Error Response Interface
 * 
 * Standardized error response format for UI components
 */
interface ErrorResponse {
  status: number;                         // HTTP-like status code
  message: string;                        // User-friendly error message
  details?: ErrorDetails;                 // Detailed error information
  action?: {                              // Optional recovery action
    label: string;                        // Button text for recovery action
    onClick: () => void;                  // Handler function
  };
}

/**
 * Error Handling Service Class
 * 
 * Singleton service that manages error handling and retry logic across the application
 */
export class ErrorHandlingService {
  // Singleton instance
  private static instance: ErrorHandlingService;
  
  // Retry configurations for different error types
  private retryConfigs: Map<ErrorCode, RetryConfig>;
  
  // Logging service integration
  private logger: LoggingService;

  /**
   * Private Constructor (Singleton Pattern)
   * 
   * Initializes the service with default configurations
   */
  private constructor() {
    this.retryConfigs = new Map();
    this.logger = LoggingService.getInstance();
    this.initializeRetryConfigs();
  }

  /**
   * Get Singleton Instance
   * 
   * Returns the singleton instance of the ErrorHandlingService
   * Creates a new instance if one doesn't exist
   * 
   * @returns ErrorHandlingService instance
   */
  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Initialize Retry Configurations
   * 
   * Sets up specific retry configurations for different error types
   * Each error type has tailored retry behavior based on its characteristics
   */
  private initializeRetryConfigs(): void {
    // Network errors - more aggressive retry with jitter
    // Network issues are often temporary and benefit from multiple attempts
    this.retryConfigs.set(ErrorCodes.NETWORK_ERROR, {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true
    });

    // API errors - moderate retry
    // API errors might be temporary but shouldn't be too aggressive
    this.retryConfigs.set(ErrorCodes.API_ERROR, {
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 15000,
      backoffFactor: 1.5,
      jitter: true
    });

    // Rate limit - longer delays
    // Rate limits require longer waits and fewer attempts
    this.retryConfigs.set(ErrorCodes.API_RATE_LIMIT, {
      maxAttempts: 2,
      initialDelay: 60000,    // 1 minute
      maxDelay: 120000,       // 2 minutes max
      backoffFactor: 1,       // No exponential increase
      jitter: false           // Consistent timing for rate limits
    });

    // Document processing errors - moderate retry
    // Document processing can fail due to temporary resource issues
    this.retryConfigs.set(ErrorCodes.DOCUMENT_PROCESSING_ERROR, {
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 20000,
      backoffFactor: 1.5,
      jitter: true
    });

    // OCR errors - more attempts due to potential temporary issues
    // OCR can be flaky, especially with complex documents
    this.retryConfigs.set(ErrorCodes.OCR_ERROR, {
      maxAttempts: 4,
      initialDelay: 3000,
      maxDelay: 25000,
      backoffFactor: 1.5,
      jitter: true
    });

    // Contract analysis errors - more attempts due to potential temporary issues
    // AI analysis can sometimes fail due to temporary service issues
    this.retryConfigs.set(ErrorCodes.CONTRACT_ANALYSIS_ERROR, {
      maxAttempts: 4,
      initialDelay: 3000,
      maxDelay: 25000,
      backoffFactor: 1.5,
      jitter: true
    });

    // Contract validation errors - more attempts due to potential temporary issues
    // Validation can fail due to service availability
    this.retryConfigs.set(ErrorCodes.CONTRACT_VALIDATION_ERROR, {
      maxAttempts: 4,
      initialDelay: 3000,
      maxDelay: 25000,
      backoffFactor: 1.5,
      jitter: true
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
        stack: errorStack
      }
    };

    // Add context-specific error handling
    if (context) {
      baseResponse.details = {
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
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