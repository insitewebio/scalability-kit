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
export declare class TaskOrchestrator {
    private readonly data;
    private readonly queue;
    private readonly actions;
    private readonly options;
    constructor(params: TaskOrchestratorParams);
    process(): Promise<void>;
}
export {};
