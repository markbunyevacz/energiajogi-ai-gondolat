export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Domain-specific errors
  DOMAIN_NOT_FOUND = 'DOMAIN_NOT_FOUND',
  DOMAIN_ACCESS_DENIED = 'DOMAIN_ACCESS_DENIED',
  INVALID_DOMAIN_HIERARCHY = 'INVALID_DOMAIN_HIERARCHY',

  // Document-specific errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_PROCESSING_ERROR = 'DOCUMENT_PROCESSING_ERROR',
  INVALID_DOCUMENT_TYPE = 'INVALID_DOCUMENT_TYPE',
  DOCUMENT_HIERARCHY_ERROR = 'DOCUMENT_HIERARCHY_ERROR',

  // Queue-specific errors
  QUEUE_PROCESSING_ERROR = 'QUEUE_PROCESSING_ERROR',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  INVALID_MESSAGE_TYPE = 'INVALID_MESSAGE_TYPE',

  // Performance errors
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  RESOURCE_EXHAUSTION = 'RESOURCE_EXHAUSTION',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  cause?: Error;
  timestamp: string;
}

export class AgentError extends Error {
  public readonly code: ErrorCode;
  public readonly details: Record<string, any>;
  public readonly timestamp: string;
  public readonly cause?: Error;

  constructor(code: ErrorCode, message: string, details?: Record<string, any>, cause?: Error) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.details = details || {};
    this.cause = cause;
    this.timestamp = new Date().toISOString();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AgentError.prototype);
  }

  public toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.cause,
      timestamp: this.timestamp,
    };
  }

  public static fromError(error: Error): AgentError {
    if (error instanceof AgentError) {
      return error;
    }

    return new AgentError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      { originalError: error },
      error
    );
  }

  public static isRetryable(error: AgentError): boolean {
    const retryableCodes = [
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.RATE_LIMIT_ERROR,
      ErrorCode.RESOURCE_EXHAUSTION,
      ErrorCode.QUEUE_PROCESSING_ERROR,
    ];

    return retryableCodes.includes(error.code);
  }

  public static isFatal(error: AgentError): boolean {
    const fatalCodes = [
      ErrorCode.AUTHENTICATION_ERROR,
      ErrorCode.AUTHORIZATION_ERROR,
      ErrorCode.INVALID_DOCUMENT_TYPE,
      ErrorCode.INVALID_DOMAIN_HIERARCHY,
    ];

    return fatalCodes.includes(error.code);
  }
}

export class ValidationError extends AgentError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AgentError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.AUTHENTICATION_ERROR, message, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AgentError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.AUTHORIZATION_ERROR, message, details);
    this.name = 'AuthorizationError';
  }
}

export class ResourceNotFoundError extends AgentError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.RESOURCE_NOT_FOUND, message, details);
    this.name = 'ResourceNotFoundError';
  }
}

export class ConflictError extends AgentError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.CONFLICT, message, details);
    this.name = 'ConflictError';
  }
}

export class DomainError extends AgentError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(code, message, details);
    this.name = 'DomainError';
  }
}

export class DocumentError extends AgentError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(code, message, details);
    this.name = 'DocumentError';
  }
}

export class QueueError extends AgentError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(code, message, details);
    this.name = 'QueueError';
  }
}

export class PerformanceError extends AgentError {
  constructor(code: ErrorCode, message: string, details?: Record<string, any>) {
    super(code, message, details);
    this.name = 'PerformanceError';
  }
} 