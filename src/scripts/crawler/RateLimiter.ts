interface RateLimitConfig {
  requestsPerMinute: number;
  concurrentRequests: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requestQueue: Array<() => Promise<void>> = [];
  private activeRequests = 0;
  private lastRequestTime = 0;
  private requestInterval: number;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.requestInterval = (60 * 1000) / config.requestsPerMinute; // Convert to milliseconds
  }

  async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const executeRequest = async () => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestInterval) {
          await new Promise(r => setTimeout(r, this.requestInterval - timeSinceLastRequest));
        }

        this.activeRequests++;
        this.lastRequestTime = Date.now();
        
        resolve();
      };

      if (this.activeRequests < this.config.concurrentRequests) {
        executeRequest();
      } else {
        this.requestQueue.push(executeRequest);
      }
    });
  }

  releaseSlot(): void {
    this.activeRequests--;
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }
} 