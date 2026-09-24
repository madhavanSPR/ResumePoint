import { afterEach, describe, expect, it, vi } from "vitest";
import { createRestoreScheduler } from "./restore-scheduler";

afterEach(() => {
  vi.useRealTimers();
});

describe("restore scheduler", () => {
  it("stops immediately when an anchor is found", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const scheduler = createRestoreScheduler({
      attempt: () => {
        attempts += 1;
        return "anchor";
      },
      delays: [0, 20, 40],
    });

    const resultPromise = scheduler.start();
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({ ok: true, method: "anchor" });
    expect(attempts).toBe(1);
  });

  it("treats a final scroll fallback as success and then stops", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const scheduler = createRestoreScheduler({
      attempt: () => {
        attempts += 1;
        return "scroll";
      },
      delays: [0, 10, 20],
    });

    const resultPromise = scheduler.start();
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({ ok: true, method: "scroll" });
    expect(attempts).toBe(3);
  });

  it("stops on a hard failure", async () => {
    vi.useFakeTimers();
    const scheduler = createRestoreScheduler({
      attempt: () => "fail",
      delays: [0, 15, 30],
    });

    const resultPromise = scheduler.start();
    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({ ok: false });
  });

  it("does not observe forever after the schedule ends", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    let notify: (() => void) | undefined;
    const scheduler = createRestoreScheduler({
      attempt: () => {
        attempts += 1;
        return "scroll";
      },
      delays: [0, 10],
      observe: (callback) => {
        notify = callback;
        return () => {
          notify = undefined;
        };
      },
    });

    const resultPromise = scheduler.start();
    await vi.runAllTimersAsync();
    await resultPromise;
    notify?.();
    expect(attempts).toBe(2);
    expect(notify).toBeUndefined();
  });
});
