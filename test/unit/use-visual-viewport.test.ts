import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVisualViewport } from "@/hooks/use-visual-viewport";

// ─── T-07: useVisualViewport ──────────────────────────────────────────────────

describe("useVisualViewport", () => {
  const originalVisualViewport = window.visualViewport;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    // Restore originals
    Object.defineProperty(window, "visualViewport", {
      value: originalVisualViewport,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("returns window.innerHeight when visualViewport API is absent", () => {
    Object.defineProperty(window, "visualViewport", {
      value: null,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 812,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useVisualViewport());
    expect(result.current.height).toBe(812);
    expect(result.current.offsetTop).toBe(0);
  });

  it("returns visualViewport.height when API is present", () => {
    const mockViewport = {
      height: 500,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useVisualViewport());
    expect(result.current.height).toBe(500);
    expect(result.current.offsetTop).toBe(0);
  });

  it("updates height on visualViewport resize event", () => {
    let resizeHandler: (() => void) | null = null;
    const mockViewport = {
      height: 600,
      offsetTop: 0,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "resize") resizeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useVisualViewport());
    expect(result.current.height).toBe(600);

    // Simulate keyboard appearing — reduces viewport height
    act(() => {
      mockViewport.height = 350;
      resizeHandler?.();
    });

    expect(result.current.height).toBe(350);
  });

  it("cleans up event listeners on unmount", () => {
    const mockViewport = {
      height: 700,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      value: mockViewport,
      writable: true,
      configurable: true,
    });

    const { unmount } = renderHook(() => useVisualViewport());
    unmount();

    expect(mockViewport.removeEventListener).toHaveBeenCalled();
  });

  it("is SSR-safe: does not throw when called in a component context", () => {
    // jsdom provides window, so we just verify no error is thrown
    expect(() => renderHook(() => useVisualViewport())).not.toThrow();
  });
});
