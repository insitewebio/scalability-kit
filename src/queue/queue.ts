import { chunk } from 'lodash';
import { DEFAULT_BATCH_SIZE, isUndefinedOrValidNumber } from '../common';

interface QueueNode<T> {
  data: T;
  next: QueueNode<T> | null;
};

export class Queue {
  private head: QueueNode<any> | null = null;
  private tail: QueueNode<any> | null = null;
  private _size: number = 0;

  public enqueue<T>(data: T): void {
    const newNode: QueueNode<T> = { data, next: null };

    if (this.tail) {
      // Add node as next to current tail
      this.tail.next = newNode;
    }

    // Set new node as tail
    this.tail = newNode;

    if (!this.head) {
      this.head = newNode;
    }
    this._size++;
  }

  public bulkInitialize<T>(data: T[], batchSize: number = DEFAULT_BATCH_SIZE): void {
    const isBatchSizeValid = isUndefinedOrValidNumber(batchSize);

    if (!isBatchSizeValid) {
      throw new Error('Invalid batch size. It must be a positive number.');
    }
    
    if (this._size > 0) {
      throw new Error('Queue is not empty. Cannot bulk initialize.');
    }

    if (data.length === 0) {
      return;
    }

    const batches = chunk(data, batchSize);

    batches.forEach((batch: T[], index: number) => {
      const newNode: QueueNode<T[]> = { data: batch, next: null };

      if (this.tail) {
        this.tail.next = newNode;
      }

      this.tail = newNode;

      if (index === 0) {
        this.head = newNode;
      }

      this._size++;
    });
  }

  public next<T>(): T | null {
    if (!this.head) {
      return null;
    }

    // Get the data from the head node
    const data = this.head.data;

    // The next node becomes the new head
    this.head = this.head.next;

    // If the head is now null, set tail to null as well
    // (this means the queue is empty)
    if (!this.head) {
      this.tail = null;
    }

    if (this._size > 0) {
      this._size--;
    }

    return data;
  }

  public isEmpty(): boolean {
    return this._size === 0;
  }

  public clearQueue(): void {
    let next = this.head?.next;
    while (next) {
      const current = next;
      next = next.next;
      current.data = null; // Clear the data
    }

    this.head = null;
    this.tail = null;
    this._size = 0;
  }
};