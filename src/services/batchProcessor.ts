
interface BatchTask<T, R> {
  id: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface BatchProcessorOptions {
  batchSize: number;
  maxWaitTime: number;
  maxRetries: number;
}

class BatchProcessor<T, R> {
  private queue: BatchTask<T, R>[] = [];
  private processing = false;
  private timer: NodeJS.Timeout | null = null;
  private options: BatchProcessorOptions;

  constructor(
    private processBatchFn: (items: T[]) => Promise<R[]>,
    options: Partial<BatchProcessorOptions> = {}
  ) {
    this.options = {
      batchSize: 10,
      maxWaitTime: 100, // 100ms
      maxRetries: 3,
      ...options
    };
  }

  async add(data: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const task: BatchTask<T, R> = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(task);

      // Start timer if this is the first item
      if (this.queue.length === 1 && !this.timer) {
        this.startTimer();
      }

      // Process immediately if batch is full
      if (this.queue.length >= this.options.batchSize) {
        this.processQueuedBatch();
      }
    });
  }

  private startTimer(): void {
    this.timer = setTimeout(() => {
      this.processQueuedBatch();
    }, this.options.maxWaitTime);
  }

  private async processQueuedBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Take items from queue
    const batchSize = Math.min(this.queue.length, this.options.batchSize);
    const batch = this.queue.splice(0, batchSize);

    try {
      console.log(`Processing batch of ${batch.length} items`);
      
      const startTime = performance.now();
      const results = await this.processBatchFn(batch.map(task => task.data));
      const endTime = performance.now();
      
      console.log(`Batch processed in ${endTime - startTime}ms`);

      // Resolve all tasks with their results
      batch.forEach((task, index) => {
        if (results[index] !== undefined) {
          task.resolve(results[index]);
        } else {
          task.reject(new Error('No result for task'));
        }
      });

    } catch (error) {
      console.error('Batch processing failed:', error);
      
      // Reject all tasks in the batch
      batch.forEach(task => {
        task.reject(error as Error);
      });
    } finally {
      this.processing = false;

      // Continue processing if there are more items
      if (this.queue.length > 0) {
        this.startTimer();
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  clear(): void {
    this.queue.forEach(task => {
      task.reject(new Error('Batch processor cleared'));
    });
    this.queue = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export { BatchProcessor };
