interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

export class RetryMechanism {
  private readonly config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      backoffFactor: config.backoffFactor ?? 2,
      retryableErrors: config.retryableErrors ?? [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENOTFOUND',
        '429', // Too Many Requests
        '503', // Service Unavailable
        '504'  // Gateway Timeout
      ]
    };
  }

  public async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (!this.shouldRetry(error as Error) || attempt >= this.config.maxAttempts) {
          throw this.createRetryError(error as Error, attempt, context);
        }

        const delay = this.calculateDelay(attempt);
        console.log(
          `Retry attempt ${attempt}/${this.config.maxAttempts} for ${context ?? 'operation'} ` +
          `after ${delay}ms due to: ${(error as Error).message}`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private shouldRetry(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return this.config.retryableErrors!.some(
      retryableError => errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt - 1),
      this.config.maxDelay
    );
    // Add some jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  private createRetryError(error: Error, attempts: number, context?: string): Error {
    const message = `Failed after ${attempts} attempts${context ? ` for ${context}` : ''}: ${error.message}`;
    const retryError = new Error(message);
    retryError.stack = error.stack;
    return retryError;
  }
} 