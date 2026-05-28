import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/dietista/atoms", () => ({
  DayStrip: ({ days, activeIndex, dataDays, onDaySelect }: {
    days: string[];
    activeIndex: number;
    dataDays?: boolean[];
    onDaySelect?: (i: number) => void;
  }) => (
    <div data-testid="day-strip">
      {days.map((day, i) => (
        <button
          key={day}
          data-testid={`day-${i}`}
          data-active={i === activeIndex}
          data-has-data={dataDays?.[i] ?? false}
          onClick={() => onDaySelect?.(i)}
        >
          {day}
        </button>
      ))}
    </div>
  ),
}));

import { DiaryDateNav } from "@/components/dietista/diary-date-nav";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// 2026-05-20 is a Wednesday (index 2 in Monday-first)
const WEDNESDAY = new Date("2026-05-20T00:00:00");
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DATA_DAYS = [true, false, true, false, false, false, false];

function renderNav(selectedDate = WEDNESDAY) {
  return render(
    <DiaryDateNav
      selectedDate={selectedDate}
      dayLabels={DAY_LABELS}
      dataDays={DATA_DAYS}
    />
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DiaryDateNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders DayStrip", () => {
    renderNav();
    expect(screen.getByTestId("day-strip")).toBeInTheDocument();
  });

  it("passes dataDays to DayStrip", () => {
    renderNav();
    // Monday (index 0) has data
    expect(screen.getByTestId("day-0")).toHaveAttribute("data-has-data", "true");
    // Tuesday (index 1) has no data
    expect(screen.getByTestId("day-1")).toHaveAttribute("data-has-data", "false");
  });

  it("Wednesday is the active day (index 2)", () => {
    renderNav();
    expect(screen.getByTestId("day-2")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("day-0")).toHaveAttribute("data-active", "false");
  });

  it("click day i → router.push with weekStart+i in YYYY-MM-DD", () => {
    renderNav();
    // Click Monday (index 0). Week of 2026-05-20 starts on Monday 2026-05-18
    fireEvent.click(screen.getByTestId("day-0"));
    expect(mockPush).toHaveBeenCalledWith("/diario?date=2026-05-18");
  });

  it("click day Wednesday (index 2) → router.push with 2026-05-20", () => {
    renderNav();
    fireEvent.click(screen.getByTestId("day-2"));
    expect(mockPush).toHaveBeenCalledWith("/diario?date=2026-05-20");
  });

  it("click prev arrow → router.push with selectedDate -7 days", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: /prevWeek/i }));
    // 2026-05-20 - 7 = 2026-05-13
    expect(mockPush).toHaveBeenCalledWith("/diario?date=2026-05-13");
  });

  it("click next arrow → router.push with selectedDate +7 days", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: /nextWeek/i }));
    // 2026-05-20 + 7 = 2026-05-27
    expect(mockPush).toHaveBeenCalledWith("/diario?date=2026-05-27");
  });

  it("renders go-to-today button when selectedDate is not today", () => {
    renderNav(WEDNESDAY); // WEDNESDAY is in the past
    // goToToday button should be visible since WEDNESDAY !== today
    expect(screen.getByRole("button", { name: /goToToday/i })).toBeInTheDocument();
  });

  it("go-to-today button → router.push('/diario')", () => {
    renderNav(WEDNESDAY);
    fireEvent.click(screen.getByRole("button", { name: /goToToday/i }));
    expect(mockPush).toHaveBeenCalledWith("/diario");
  });
});
