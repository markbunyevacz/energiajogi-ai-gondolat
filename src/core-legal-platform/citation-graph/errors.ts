export class CitationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly severity: 'warning' | 'error',
    public readonly recoverable: boolean = true,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CitationError';
  }
} 