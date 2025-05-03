export const DEFAULT_BATCH_SIZE = 1;
export const DEFAULT_CONCURRENCY = 1;
export const DEFAULT_DELAY = 1000;
export const DEFAULT_MAX_RETRIES = 0;

export const isUndefinedOrValidNumber = (value: any): boolean => {
  return value === undefined || (typeof value === 'number' && value >= 0);
}