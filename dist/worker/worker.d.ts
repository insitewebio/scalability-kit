import { TaskOrchestratorActions } from '../orchestrator/task-orchestrator';
import { Queue } from '../queue/queue';
interface WorkerOptions {
    queue: Queue;
    actions: TaskOrchestratorActions;
    maxRetries?: number;
    delay?: number;
}
export declare class Worker {
    private readonly queue;
    private readonly actions;
    private readonly maxRetries;
    private readonly delay;
    constructor({ queue, actions, maxRetries, delay }: WorkerOptions);
    start<T>(): Promise<void>;
}
export {};
