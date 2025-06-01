export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond
  private readonly minDelay: number; // minimum delay between requests in milliseconds

  constructor(
    maxRequestsPerMinute: number,
    minDelayBetweenRequests: number = 1000
  ) {
    this.maxTokens = maxRequestsPerMinute;
    this.tokens = maxRequestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = maxRequestsPerMinute / (60 * 1000); // tokens per millisecond
    this.minDelay = minDelayBetweenRequests;
  }

  public async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens < 1) {
      const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refillTokens();
    }

    this.tokens--;
    await new Promise(resolve => setTimeout(resolve, this.minDelay));
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const newTokens = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  public getCurrentTokens(): number {
    this.refillTokens();
    return this.tokens;
  }
} 