import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, cleanupRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  const max = 3;
  const windowMs = 1000; // 1 second window

  beforeEach(() => {
    // Clean up ALL entries before each test to avoid state leakage
    cleanupRateLimit();
  });

  it("allows the first request", () => {
    const result = checkRateLimit("t-first", max, windowMs);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(max - 1);
  });

  it("allows requests up to the max", () => {
    const key = "t-max";
    const r1 = checkRateLimit(key, max, windowMs);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, max, windowMs);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, max, windowMs);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests after max is exceeded", () => {
    const key = "t-block";
    // Use up all allowed requests
    checkRateLimit(key, max, windowMs);
    checkRateLimit(key, max, windowMs);
    checkRateLimit(key, max, windowMs);

    // This should be blocked
    const result = checkRateLimit(key, max, windowMs);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = "t-reset";
    // Use a very short window for testing
    const shortWindow = 50; // 50ms

    checkRateLimit(key, max, shortWindow);
    checkRateLimit(key, max, shortWindow);
    checkRateLimit(key, max, shortWindow);

    // Should be blocked
    const blocked = checkRateLimit(key, max, shortWindow);
    expect(blocked.allowed).toBe(false);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, max, shortWindow);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(max - 1);
        resolve();
      }, shortWindow + 20);
    });
  }, 10000);

  it("returns correct resetAt timestamp", () => {
    const key = "t-resetAt";
    const before = Date.now();
    const result = checkRateLimit(key, max, windowMs);
    const after = Date.now();

    expect(result.resetAt).toBeGreaterThanOrEqual(before + windowMs);
    expect(result.resetAt).toBeLessThanOrEqual(after + windowMs);
  });

  it("tracks different keys independently", () => {
    const keyA = "t-key-a";
    const keyB = "t-key-b";

    // Exhaust key A
    checkRateLimit(keyA, max, windowMs);
    checkRateLimit(keyA, max, windowMs);
    checkRateLimit(keyA, max, windowMs);

    const resultA = checkRateLimit(keyA, max, windowMs);
    expect(resultA.allowed).toBe(false);

    // Key B should still be allowed
    const resultB = checkRateLimit(keyB, max, windowMs);
    expect(resultB.allowed).toBe(true);
  });
});

describe("cleanupRateLimit", () => {
  it("removes expired entries", () => {
    const shortWindow = 50; // 50ms

    checkRateLimit("t-expire", 5, shortWindow);
    checkRateLimit("t-keep", 5, 60000); // 60 second window

    // Wait for short window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        cleanupRateLimit();

        // "t-expire" should be cleaned up, so next call is fresh
        const fresh = checkRateLimit("t-expire", 5, 60000);
        expect(fresh.allowed).toBe(true);
        expect(fresh.remaining).toBe(4); // Fresh start

        // "t-keep" should still have its count
        const existing = checkRateLimit("t-keep", 5, 60000);
        expect(existing.allowed).toBe(true);
        expect(existing.remaining).toBe(3); // Was already called once above
        resolve();
      }, shortWindow + 20);
    });
  }, 10000);
});
