import { DEFAULT_DELAY, DEFAULT_MAX_RETRIES, isUndefinedOrValidNumber } from '../common';
export class RetryWrapper {
    constructor(options) {
        var _a, _b;
        this.retries = 0;
        const ismaxRetriesValid = isUndefinedOrValidNumber(options.maxRetries);
        const isDelayValid = isUndefinedOrValidNumber(options.delay);
        if (!ismaxRetriesValid || !isDelayValid) {
            throw new Error('Invalid maxRetries or delay value. They must be non-negative numbers.');
        }
        this.maxRetries = (_a = options.maxRetries) !== null && _a !== void 0 ? _a : DEFAULT_MAX_RETRIES;
        this.delay = (_b = options.delay) !== null && _b !== void 0 ? _b : DEFAULT_DELAY;
        this.actions = options.actions;
    }
    async execute(batch) {
        do {
            try {
                const response = await this.actions.callback(batch);
                if (this.actions.onSuccess) {
                    this.actions.onSuccess(response, batch);
                }
                return;
            }
            catch (error) {
                this.retries++;
                const isRetryable = this.retries <= this.maxRetries;
                if (!isRetryable && this.actions.onError) {
                    this.actions.onError(error, batch);
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
}
;
