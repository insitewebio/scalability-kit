import { DEFAULT_DELAY, DEFAULT_MAX_RETRIES } from '../common';
import { RetryWrapper } from '../retry-wrapper/retry-wrapper';
export class Worker {
    constructor({ queue, actions, maxRetries, delay }) {
        this.maxRetries = maxRetries !== null && maxRetries !== void 0 ? maxRetries : DEFAULT_MAX_RETRIES;
        this.delay = delay !== null && delay !== void 0 ? delay : DEFAULT_DELAY;
        this.queue = queue;
        this.actions = actions;
    }
    async start() {
        while (true) {
            const item = this.queue.next();
            if (!item) {
                break;
            }
            const retryTask = new RetryWrapper({
                maxRetries: this.maxRetries,
                delay: this.delay,
                actions: this.actions,
            });
            await retryTask.execute(item);
        }
    }
}
;
