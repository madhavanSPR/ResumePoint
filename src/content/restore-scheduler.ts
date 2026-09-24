export const RESTORE_DELAYS = [0, 150, 400, 800, 1500, 2500, 4000, 6000];

export type AttemptResult = "anchor" | "scroll" | "pending" | "fail";

export interface RestoreOutcome {
  ok: boolean;
  method?: "anchor" | "scroll";
}

export interface RestoreSchedulerOptions {
  attempt: () => Promise<AttemptResult> | AttemptResult;
  delays?: number[];
  schedule?: (fn: () => void, ms: number) => number;
  cancel?: (id: number) => void;
  observe?: (cb: () => void) => () => void;
}

export function createRestoreScheduler(options: RestoreSchedulerOptions): {
  start: () => Promise<RestoreOutcome>;
  stop: () => void;
} {
  const delays = options.delays ?? RESTORE_DELAYS;
  const schedule = options.schedule ?? ((fn, ms) => window.setTimeout(fn, ms));
  const cancel = options.cancel ?? ((id) => window.clearTimeout(id));
  const timers = new Set<number>();
  let stopped = false;
  let finished = false;
  let lastResult: AttemptResult = "pending";
  let unobserve: (() => void) | undefined;
  let resolveOutcome: ((outcome: RestoreOutcome) => void) | undefined;

  function outcomeFrom(result: AttemptResult): RestoreOutcome {
    if (result === "anchor") {
      return { ok: true, method: "anchor" };
    }
    if (result === "scroll") {
      return { ok: true, method: "scroll" };
    }
    return { ok: false };
  }

  function finish(result: AttemptResult): void {
    if (finished) {
      return;
    }
    finished = true;
    stopped = true;
    for (const timer of timers) {
      cancel(timer);
    }
    timers.clear();
    unobserve?.();
    resolveOutcome?.(outcomeFrom(result));
  }

  async function runAttempt(): Promise<void> {
    if (stopped || finished) {
      return;
    }
    const result = await options.attempt();
    lastResult = result;
    if (result === "anchor" || result === "fail") {
      finish(result);
    }
  }

  function stop(): void {
    finish(lastResult);
  }

  function start(): Promise<RestoreOutcome> {
    return new Promise((resolve) => {
      resolveOutcome = resolve;
      delays.forEach((delay, index) => {
        const timer = schedule(() => {
          timers.delete(timer);
          void runAttempt().then(() => {
            if (index === delays.length - 1 && !finished) {
              finish(lastResult);
            }
          });
        }, delay);
        timers.add(timer);
      });

      if (options.observe) {
        unobserve = options.observe(() => {
          void runAttempt();
        });
      }
    });
  }

  return { start, stop };
}
