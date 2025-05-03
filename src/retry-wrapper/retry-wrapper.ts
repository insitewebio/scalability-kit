import { TaskOrchestratorActions } from '../orchestrator/task-orchestrator';
import { DEFAULT_DELAY, DEFAULT_MAX_RETRIES, isUndefinedOrValidNumber } from '../common';

interface RetryWrapperOptions {
  maxRetries?: number;
  delay?: number;
  actions: TaskOrchestratorActions;
}

export class RetryWrapper {
  private readonly actions: TaskOrchestratorActions;
  private readonly maxRetries: number;
  private readonly delay: number;
  private retries: number = 0;

  constructor(options: RetryWrapperOptions) {
    const ismaxRetriesValid = isUndefinedOrValidNumber(options.maxRetries);
    const isDelayValid = isUndefinedOrValidNumber(options.delay);

    if(!ismaxRetriesValid || !isDelayValid) {
      throw new Error('Invalid maxRetries or delay value. They must be non-negative numbers.');
    }

    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.delay = options.delay ?? DEFAULT_DELAY;
    this.actions = options.actions;
  }

  public async execute<T>(batch: T): Promise<void> {
    do {
      try {
        const response = await this.actions.callback(batch);

        if (this.actions.onSuccess) {
          this.actions.onSuccess(response, batch);
        }
        return;
      } catch (error: Error | unknown) {
        this.retries++;

        const isRetryable = this.retries <= this.maxRetries;

        if (!isRetryable && this.actions.onError) {
          this.actions.onError(error as Error, batch);
        }

        if (isRetryable) {
          if (this.actions.onRetry) {
            this.actions.onRetry(this.retries, batch);
          }

          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      }
    } while (this.retries <= this.maxRetries);
  }
};