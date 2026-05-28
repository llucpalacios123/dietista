import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";

// ─── T-08: AiChatModal — mobile viewport + useVisualViewport integration ──────

// Polyfill scrollIntoView for jsdom (not implemented)
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock useVisualViewport so we can control returned height
vi.mock("@/hooks/use-visual-viewport", () => ({
  useVisualViewport: vi.fn(() => ({ height: 600, offsetTop: 0 })),
}));

import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { AiChatModal } from "@/components/dietista/ai-chat-modal";

const mockUseVisualViewport = vi.mocked(useVisualViewport);

const defaultProps = {
  open: true,
  messages: [],
  pendingSuggestion: null,
  loading: false,
  error: null,
  turnCount: 0,
  onSubmit: vi.fn(),
  onAccept: vi.fn(),
  onClose: vi.fn(),
};

describe("AiChatModal — T-08", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVisualViewport.mockReturnValue({ height: 600, offsetTop: 0 });
  });

  it("applies maxHeight from useVisualViewport height", () => {
    mockUseVisualViewport.mockReturnValue({ height: 400, offsetTop: 0 });

    render(<AiChatModal {...defaultProps} />);

    const panel = screen.getByTestId("modal-panel");
    // Verify the style attribute contains the expected maxHeight value
    expect(panel.style.maxHeight).toBe("400px");
  });

  it("renders with safe-area inset marker on the input area", () => {
    render(<AiChatModal {...defaultProps} />);

    const inputArea = screen.getByTestId("input-area");
    // The safe-area data attribute marks this element as applying env(safe-area-inset-bottom)
    expect(inputArea).toHaveAttribute("data-safe-area-inset", "bottom");
  });

  it("calls scrollIntoView on textarea focus after 100ms", async () => {
    vi.useFakeTimers();

    const mockScrollIntoView = vi.fn();
    // Override for this specific test
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: mockScrollIntoView,
      writable: true,
      configurable: true,
    });

    render(<AiChatModal {...defaultProps} />);

    const textarea = screen.getByRole("textbox");

    // Clear any calls from initial render/focus effects
    mockScrollIntoView.mockClear();

    act(() => {
      fireEvent.focus(textarea);
    });

    // Before 100ms — scrollIntoView should NOT have been called yet from our handler
    // (The auto-scroll useEffect might have called it already, but we cleared it)
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ block: "end" });

    vi.useRealTimers();
  });

  it("does not render when open is false", () => {
    render(<AiChatModal {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<AiChatModal {...defaultProps} onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalled();
  });
});
