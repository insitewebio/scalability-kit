import { DEFAULT_CONCURRENCY, DEFAULT_DELAY, DEFAULT_MAX_RETRIES, isUndefinedOrValidNumber } from '../common';
import { Queue } from '../queue/queue';
import { Worker } from '../worker/worker';

export interface TaskOrchestratorActions<T = any> {
  callback: (batch?: T) => Promise<any>;
  onRetry?: (attempt: number, batch?: T) => any;
  onError?: (error: Error | unknown, batch?: T) => any;
  onSuccess?: (response?: any, batch?: T) => any;
}

interface TaskOrchestratorOptions {
  concurrency?: number;
  batchSize?: number;
  maxRetries?: number;
  delay?: number;
}

interface TaskOrchestratorParams {
  data: any[];
  actions: TaskOrchestratorActions;
  options?: TaskOrchestratorOptions;
}

export class TaskOrchestrator {
  private readonly data: any[];
  private readonly queue: Queue;
  private readonly actions: TaskOrchestratorActions;
  private readonly options: TaskOrchestratorOptions;

  constructor(params: TaskOrchestratorParams) {
    const isConcurrencyValid = isUndefinedOrValidNumber(params.options?.concurrency);

    if (!isConcurrencyValid) {
      throw new Error('Invalid concurrency value. It must be a positive number.');
    }

    this.queue = new Queue();
    this.data = params.data;
    this.options = params.options ?? {};
    this.actions = params.actions;
    this.queue.bulkInitialize(this.data, this.options.batchSize);
  }

  public async process(): Promise<void> {
    const concurrency = this.options.concurrency ?? DEFAULT_CONCURRENCY;
    const maxRetries = this.options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const delay = this.options.delay ?? DEFAULT_DELAY;

    const workers = Array.from({ length: concurrency }, () =>
      new Worker({
        queue: this.queue,
        actions: this.actions,
        maxRetries,
        delay,
      })
    );

    await Promise.all(workers.map(worker => worker.start()));
  }
};
