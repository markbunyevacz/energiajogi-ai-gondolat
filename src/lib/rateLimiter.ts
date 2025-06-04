/**
 * RateLimiter manages API rate limits by tracking request counts within a time window.
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  /**
   * Creates a new RateLimiter instance.
   * @param options - Rate limiter configuration
   * @param options.maxRequests - Maximum number of requests allowed in the time window
   * @param options.timeWindow - Time window in milliseconds
   */
  constructor(options: { maxRequests: number; timeWindow: number }) {
    this.maxRequests = options.maxRequests;
    this.timeWindow = options.timeWindow;
  }

  /**
   * Waits for a token to become available before proceeding.
   * @returns Promise that resolves when a token is available
   */
  async waitForToken(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForToken();
    }

    this.requests.push(now);
  }

  /**
   * Gets the current number of requests in the time window.
   * @returns Number of active requests
   */
  getCurrentRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length;
  }

  /**
   * Resets the rate limiter.
   */
  reset(): void {
    this.requests = [];
  }
} 