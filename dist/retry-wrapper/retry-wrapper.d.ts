import { TaskOrchestratorActions } from '../orchestrator/task-orchestrator';
interface RetryWrapperOptions {
    maxRetries?: number;
    delay?: number;
    actions: TaskOrchestratorActions;
}
export declare class RetryWrapper {
    private readonly actions;
    private readonly maxRetries;
    private readonly delay;
    private retries;
    constructor(options: RetryWrapperOptions);
    execute<T>(batch: T): Promise<void>;
}
export {};
