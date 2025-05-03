import { TaskOrchestratorActions } from '../orchestrator/task-orchestrator';
import { DEFAULT_DELAY, DEFAULT_MAX_RETRIES } from '../common';
import { Queue } from '../queue/queue';
import { RetryWrapper } from '../retry-wrapper/retry-wrapper';

interface WorkerOptions {
  queue: Queue;
  actions: TaskOrchestratorActions;
  maxRetries?: number;
  delay?: number;
}

export class Worker {
  private readonly queue: Queue;
  private readonly actions: TaskOrchestratorActions;
  private readonly maxRetries: number;
  private readonly delay: number;

  constructor({ queue, actions, maxRetries, delay }: WorkerOptions) {
    this.maxRetries = maxRetries ?? DEFAULT_MAX_RETRIES;
    this.delay = delay ?? DEFAULT_DELAY;
    this.queue = queue;
    this.actions = actions;
  }

  public async start<T>(): Promise<void> {
    while (true) {
      const item = this.queue.next<T>();

      if (!item) {
        break;
      }

      const retryTask = new RetryWrapper({
        maxRetries: this.maxRetries,
        delay: this.delay,
        actions: this.actions,
      });

      await retryTask.execute<T>(item);
    }
  }
};