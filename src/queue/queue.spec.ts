import { Queue } from './queue';

describe('Queue', () => {
  let queue: Queue;

  beforeEach(() => {
    queue = new Queue();
  });

  it('should enqueue elements correctly', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    expect(queue.isEmpty()).toBe(false);
    expect(queue.next()).toBe(1);
    expect(queue.next()).toBe(2);
    expect(queue.next()).toBe(3);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should bulk initialize elements correctly', () => {
    const data = [1, 2, 3, 4, 5];
    queue.bulkInitialize(data, 2);

    expect(queue.isEmpty()).toBe(false);
    expect(queue.next()).toEqual([1, 2]);
    expect(queue.next()).toEqual([3, 4]);
    expect(queue.next()).toEqual([5]);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should throw an error if bulkInitialize is called on a non-empty queue', () => {
    queue.enqueue(1);

    expect(() => {
      queue.bulkInitialize([2, 3, 4]);
    }).toThrow('Queue is not empty. Cannot bulk initialize.');
  });

  it('should return null when next is called on an empty queue', () => {
    expect(queue.next()).toBeNull();
  });

  it('should clear the queue correctly', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    queue.clearQueue();

    expect(queue.isEmpty()).toBe(true);
    expect(queue.next()).toBeNull();
  });

  it('should handle empty bulk initialization gracefully', () => {
    queue.bulkInitialize([]);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should handle clearQueue on an already empty queue gracefully', () => {
    expect(() => {
      queue.clearQueue();
    }).not.toThrow();
  });
});