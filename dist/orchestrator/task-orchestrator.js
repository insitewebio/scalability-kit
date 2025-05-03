import { DEFAULT_CONCURRENCY, DEFAULT_DELAY, DEFAULT_MAX_RETRIES, isUndefinedOrValidNumber } from '../common';
import { Queue } from '../queue/queue';
import { Worker } from '../worker/worker';
export class TaskOrchestrator {
    constructor(params) {
        var _a, _b;
        const isConcurrencyValid = isUndefinedOrValidNumber((_a = params.options) === null || _a === void 0 ? void 0 : _a.concurrency);
        if (!isConcurrencyValid) {
            throw new Error('Invalid concurrency value. It must be a positive number.');
        }
        this.queue = new Queue();
        this.data = params.data;
        this.options = (_b = params.options) !== null && _b !== void 0 ? _b : {};
        this.actions = params.actions;
        this.queue.bulkInitialize(this.data, this.options.batchSize);
    }
    async process() {
        var _a, _b, _c;
        const concurrency = (_a = this.options.concurrency) !== null && _a !== void 0 ? _a : DEFAULT_CONCURRENCY;
        const maxRetries = (_b = this.options.maxRetries) !== null && _b !== void 0 ? _b : DEFAULT_MAX_RETRIES;
        const delay = (_c = this.options.delay) !== null && _c !== void 0 ? _c : DEFAULT_DELAY;
        const workers = Array.from({ length: concurrency }, () => new Worker({
            queue: this.queue,
            actions: this.actions,
            maxRetries,
            delay,
        }));
        await Promise.all(workers.map(worker => worker.start()));
    }
}
;
