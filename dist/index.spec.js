import { TaskOrchestrator } from './orchestrator/task-orchestrator';
import { DEFAULT_CONCURRENCY, DEFAULT_DELAY, DEFAULT_MAX_RETRIES } from './common';
import { Worker } from './worker/worker';
import { RetryWrapper } from './retry-wrapper';
import { Queue } from './queue';
const mockCallback = jest.fn();
const mockOnError = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnRetry = jest.fn();
const actions = {
    callback: mockCallback,
    onError: mockOnError,
    onSuccess: mockOnSuccess,
    onRetry: mockOnRetry,
};
const data = [1, 2, 3, 4, 5];
const batchSize = 2;
const delay = 0;
describe('TaskOrchestrator', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should call the callback function with the correct arguments', async () => {
        const taskOrchestrator = new TaskOrchestrator({
            data,
            actions,
            options: { batchSize },
        });
        await taskOrchestrator.process();
        const totalCalls = Math.ceil(data.length / batchSize);
        expect(mockCallback).toHaveBeenCalledTimes(totalCalls);
        expect(mockOnSuccess).toHaveBeenCalledTimes(totalCalls);
        expect(mockCallback).toHaveBeenCalledWith([1, 2]);
        expect(mockCallback).toHaveBeenCalledWith([3, 4]);
        expect(mockCallback).toHaveBeenCalledWith([5]);
        expect(mockOnError).not.toHaveBeenCalled();
        expect(mockOnRetry).not.toHaveBeenCalled();
    });
    it('should call the callback with the correct batch size', async () => {
        const data = Array.from({ length: 100 }, (_, i) => i + 1); // [1, 2, 3, 4, 5]
        const batchSize = 15;
        const taskOrchestrator = new TaskOrchestrator({
            data,
            actions,
        });
        await taskOrchestrator.process();
        mockCallback.mock.calls.forEach((call) => {
            expect(call[0].length).toBeLessThanOrEqual(batchSize);
        });
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnError).not.toHaveBeenCalled();
        expect(mockOnRetry).not.toHaveBeenCalled();
    });
    it('should initialize the correct number of workers', async () => {
        const workerSpy = jest.spyOn(Worker.prototype, 'start');
        const concurrency = 3;
        const taskOrchestrator = new TaskOrchestrator({
            data,
            actions,
            options: { batchSize, concurrency },
        });
        await taskOrchestrator.process();
        expect(workerSpy).toHaveBeenCalledTimes(concurrency);
        workerSpy.mockRestore();
        // now with no concurrency param
        const taskOrchestratorNoConcurrency = new TaskOrchestrator({
            data,
            actions,
            options: { batchSize },
        });
        const workerSpyNoConcurrency = jest.spyOn(Worker.prototype, 'start');
        await taskOrchestratorNoConcurrency.process();
        expect(workerSpyNoConcurrency).toHaveBeenCalledTimes(DEFAULT_CONCURRENCY);
        workerSpyNoConcurrency.mockRestore();
    });
    it('should call the onError callback if an error occurs', async () => {
        const error = new Error('Test error');
        mockCallback.mockRejectedValueOnce(error);
        const taskOrchestrator = new TaskOrchestrator({
            data,
            actions,
            options: { batchSize, delay },
        });
        await taskOrchestrator.process();
        expect(mockOnError).toHaveBeenCalledTimes(1);
        expect(mockOnError).toHaveBeenCalledWith(error, [1, 2]);
        expect(mockOnSuccess).toHaveBeenCalledTimes(2);
        expect(mockOnRetry).not.toHaveBeenCalled();
    });
    it('should call the onSuccess callback if the operation is successful', async () => {
        const taskOrchestrator = new TaskOrchestrator({
            data,
            actions,
            options: { batchSize },
        });
        let responses = [];
        mockCallback.mockImplementation((batch) => {
            return Promise.resolve({ success: true });
        });
        mockOnSuccess.mockImplementation((response) => {
            responses.push(response);
            return Promise.resolve(response);
        });
        await taskOrchestrator.process();
        expect(mockOnSuccess).toHaveBeenCalledTimes(3);
        expect(responses).toHaveLength(3);
        expect(mockOnSuccess).toHaveBeenCalledWith({ success: true }, [1, 2]);
        expect(mockOnSuccess).toHaveBeenCalledWith({ success: true }, [3, 4]);
        expect(mockOnSuccess).toHaveBeenCalledWith({ success: true }, [5]);
        expect(mockOnError).not.toHaveBeenCalled();
        expect(mockOnRetry).not.toHaveBeenCalled();
    });
    it('should call the onRetry callback if a retry is attempted', async () => {
        const error = new Error('Test error');
        mockCallback.mockRejectedValueOnce(error);
        const taskOrchestrator = new TaskOrchestrator({
            data,
            actions,
            options: { batchSize, delay, maxRetries: 1 },
        });
        await taskOrchestrator.process();
        expect(mockOnRetry).toHaveBeenCalledTimes(1);
        expect(mockOnRetry).toHaveBeenCalledWith(1, [1, 2]);
        expect(mockOnSuccess).toHaveBeenCalledTimes(3);
        expect(mockOnError).not.toHaveBeenCalled();
    });
    it('should only call onError after all retries have failed', async () => {
        const error = new Error('Test error');
        mockCallback.mockRejectedValueOnce(error);
        mockCallback.mockRejectedValueOnce(error);
        mockCallback.mockRejectedValueOnce(error);
        mockCallback.mockRejectedValueOnce(error);
        const taskOrchestrator = new TaskOrchestrator({
            data,
            actions,
            options: { batchSize, delay, maxRetries: 3 },
        });
        await taskOrchestrator.process();
        expect(mockCallback).toHaveBeenCalledTimes(6);
        expect(mockOnError).toHaveBeenCalledTimes(1);
        expect(mockOnError).toHaveBeenCalledWith(error, [1, 2]);
        expect(mockOnSuccess).toHaveBeenCalledTimes(2);
        expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });
    it('should wait the correct delay before retrying', async () => {
        const error = new Error('Test error');
        mockCallback.mockRejectedValueOnce(error);
        mockCallback.mockRejectedValueOnce(error);
        const taskOrchestrator = new TaskOrchestrator({
            data: [1],
            actions,
            options: { batchSize, maxRetries: 2, delay: 1500 },
        });
        const startTime = Date.now();
        await taskOrchestrator.process();
        const endTime = Date.now();
        expect(endTime - startTime).toBeGreaterThanOrEqual(3000);
        expect(mockOnRetry).toHaveBeenCalledTimes(2);
    });
    it('should throw error if maxRetries or delay is invalid', async () => {
        const invalidMaxRetries = -1;
        const invalidDelay = -1000;
        try {
            await new TaskOrchestrator({
                data,
                actions,
                options: { batchSize, maxRetries: invalidMaxRetries },
            }).process();
        }
        catch (error) {
            expect(error.message).toEqual('Invalid maxRetries or delay value. They must be non-negative numbers.');
        }
        try {
            await new TaskOrchestrator({
                data,
                actions,
                options: { batchSize, delay: invalidDelay },
            }).process();
        }
        catch (error) {
            expect(error.message).toEqual('Invalid maxRetries or delay value. They must be non-negative numbers.');
        }
    });
    it('should throw error if batchSize or concurrency is invalid', async () => {
        const invalidBatchSize = -1;
        const invalidConcurrency = -1;
        try {
            await new TaskOrchestrator({
                data,
                actions,
                options: { batchSize: invalidBatchSize },
            }).process();
        }
        catch (error) {
            expect(error.message).toEqual('Invalid batch size. It must be a positive number.');
        }
        try {
            await new TaskOrchestrator({
                data,
                actions,
                options: { batchSize, concurrency: invalidConcurrency },
            }).process();
        }
        catch (error) {
            expect(error.message).toEqual('Invalid concurrency value. It must be a positive number.');
        }
    });
});
describe('RetryWrapper', () => {
    it('should use default values for maxRetries and delay', () => {
        const retryWrapper = new RetryWrapper({ actions });
        const startTime = Date.now();
        retryWrapper.execute(1);
        const endTime = Date.now();
        expect(endTime - startTime).toBeGreaterThanOrEqual(DEFAULT_DELAY * DEFAULT_MAX_RETRIES);
        expect(mockOnRetry).toHaveBeenCalledTimes(DEFAULT_MAX_RETRIES);
    });
});
describe('Worker', () => {
    it('should use default values for maxRetries and delay', async () => {
        const queue = new Queue();
        const worker = new Worker({ queue, actions });
        const startTime = Date.now();
        await worker.start();
        const endTime = Date.now();
        expect(endTime - startTime).toBeGreaterThanOrEqual(DEFAULT_DELAY * DEFAULT_MAX_RETRIES);
        expect(mockOnRetry).toHaveBeenCalledTimes(DEFAULT_MAX_RETRIES);
    });
});
