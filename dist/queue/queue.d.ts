export declare class Queue {
    private head;
    private tail;
    private _size;
    enqueue<T>(data: T): void;
    bulkInitialize<T>(data: T[], batchSize?: number): void;
    next<T>(): T | null;
    isEmpty(): boolean;
    clearQueue(): void;
}
