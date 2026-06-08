export interface PollingOptions {
  intervalMs: number;
  maxRetries: number;
  backoffFactor: number;
  maxIntervalMs: number;
}

const DEFAULT_OPTIONS: PollingOptions = {
  intervalMs: 1_000,
  maxRetries: 120,
  backoffFactor: 1.5,
  maxIntervalMs: 10_000,
};

export function createPollingStrategy(options?: Partial<PollingOptions>) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    getDelay(attempt: number): number {
      const delay = opts.intervalMs * Math.pow(opts.backoffFactor, attempt);
      return Math.min(delay, opts.maxIntervalMs);
    },
    hasMoreAttempts(attempt: number): boolean {
      return attempt < opts.maxRetries;
    },
    getMaxRetries(): number {
      return opts.maxRetries;
    },
  };
}

export interface PollingState {
  attempts: number;
  lastDelay: number;
  totalElapsed: number;
}

export async function poll<T>(
  check: () => Promise<T>,
  isComplete: (result: T) => boolean,
  options?: Partial<PollingOptions>,
  onTick?: (state: PollingState) => void,
): Promise<T> {
  const strategy = createPollingStrategy(options);
  let attempts = 0;
  let totalElapsed = 0;

  for (;;) {
    const result = await check();
    const done = isComplete(result);
    if (done) return result;

    attempts++;
    if (!strategy.hasMoreAttempts(attempts)) {
      return result;
    }

    const delay = strategy.getDelay(attempts);
    totalElapsed += delay;
    if (onTick) onTick({ attempts, lastDelay: delay, totalElapsed });
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
