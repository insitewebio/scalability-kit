# Scalability Kit

**Scalability Kit** is a lightweight, plug-and-play TypeScript library for processing tasks in **batches**, **concurrently**, and with **automatic retries**. Perfect for handling rate-limited APIs, large task queues, or any scenario where controlled task execution is needed.

## ✨ Features

- 🔁 Batch processing
- ⚙️ Configurable concurrency
- ♻️ Automatic retries with delay
- 🧩 Hooks for success, failure, and retry logic
- 📦 Lightweight, no external runtime dependencies

---

## 📦 Installation

```bash
npm install scalability-kit
```

## 🚀 Usage Example

```TypeScript
import { TaskOrchestrator } from 'scalability-kit';

const handler = new TaskOrchestrator({
  data: Array.from({ length: 20 }, (_, i) => ({ id: i })),
  actions: {
    callback: async (batch) => {
      console.log('Processing batch:', batch);
    },
    onRetry: (attempt, batch) => {
      console.log(`Retrying batch (attempt ${attempt})`, batch);
    },
    onError: (error, batch) => {
      console.error('Failed after retries:', error);
    },
    onSuccess: (response, batch) => {
      console.log('Successfully processed batch:', batch);
    },
  },
  options: {
    concurrency: 3,     // Run 3 batches in parallel
    batchSize: 5,       // 5 items per batch
    maxRetries: 2,      // Retry failed batches up to 2 times
    delay: 1000,        // Wait 1 second between retries
  }
});

await handler.process();

```

## Use Cases

### 🧱 1. Queue Use Case

**Use case:** Pre-batching and buffering tasks for later processing.

```TypeScript
import { Queue } from 'scalability-kit';

const queue = new Queue();

// Manually batching input data (e.g. 10,000 records into groups of 100)
const bigDataArray = Array.from({ length: 10000 }, (_, i) => i);
queue.bulkInitialize(bigDataArray, 100);

while (!queue.isEmpty()) {
  const batch = queue.next<number[]>();
  console.log('Processing batch of size:', batch?.length);
}
```

Typical scenarios:
- You have large sets of items and want to chunk them in memory before processing.
- You’re implementing a producer-consumer pipeline.

### 🔁 2. RetryWrapper Use Case

**Use case**: Add retry logic to an async function with hooks.

```TypeScript
import { RetryWrapper } from 'scalability-kit';

const retryWrapper = new RetryWrapper({
  maxRetries: 3,
  delay: 2000,
  actions: {
    callback: async (data) => {
      if (Math.random() < 0.7) throw new Error('Random failure');
      console.log('Processed successfully:', data);
    },
    onRetry: (attempt, data) => {
      console.log(`Retry attempt ${attempt} for:`, data);
    },
    onError: (error, data) => {
      console.error('Final failure after retries:', error.message);
    },
    onSuccess: (res, data) => {
      console.log('RetryWrapper success callback:', data);
    }
  }
});

await retryWrapper.execute({ task: 'Send email' });
```

Typical scenarios:
- Email sending, file uploads, or external API calls.
- Any task that might fail transiently and can be retried with backoff.

### 🧵 3. Worker Use Case

**Use case**: Spawn a worker to pull and process batches from a queue with retry logic.

```TypeScript
import { Worker } from 'scalability-kit';
import { Queue } from 'scalability-kit';

const queue = new Queue();
queue.bulkInitialize(['task1', 'task2', 'task3', 'task4'], 2); // 2 per batch

const worker = new Worker({
  queue,
  maxRetries: 2,
  delay: 1000,
  actions: {
    callback: async (batch) => {
      console.log('Processing batch:', batch);
      if (batch.includes('task2')) throw new Error('Simulated failure');
    },
    onRetry: (attempt, batch) => {
      console.log(`Retrying (attempt ${attempt}) for batch:`, batch);
    },
    onError: (error, batch) => {
      console.error('Failed after retries:', batch);
    },
    onSuccess: (response, batch) => {
      console.log('Successfully handled batch:', batch);
    }
  }
});

await worker.start(); // Run this in parallel for concurrency
```

Typical scenarios:
- Background workers pulling from in-memory queues.
- Task runners with fault tolerance but without full orchestration.

## 🛠 API

### `TaskOrchestrator(options: TaskOrchestratorParams)`

| Param    | Type                   | Description                                |
|----------|------------------------|--------------------------------------------|
| `data`   | `any[]`                | Array of items to process.                |
| `actions`| `BatchHandlerActions`  | Lifecycle hooks (callback, retry, error). |
| `options`| `BatchHandlerOptions?` | Concurrency, batch size, retry settings.  |

### `TaskOrchestratorActions`

```TypeScript
interface TaskOrchestratorsActions<T = any> {
  callback: (batch?: T) => Promise<any>;
  onRetry?: (attempt: number, batch?: T) => any;
  onError?: (error: Error, batch?: T) => any;
  onSuccess?: (response?: any, batch?: T) => any;
}
```

## ✅ When to Use This
- Handling batched API calls (e.g. file uploads, webhooks)
- Processing large datasets in parallel
- Implementing job queues with retries
- Rate-limited operations (e.g. Stripe, Shopify, etc.)

## License
MIT