import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseDateParam,
  isPastDate,
  startOfToday,
  getWeekBounds,
  dayOfWeekMondayFirst,
} from "@/lib/dates";

afterEach(() => {
  vi.useRealTimers();
});

// ─── parseDateParam ───────────────────────────────────────────────────────────

describe("parseDateParam", () => {
  it("cadena válida → Date midnight local", () => {
    const result = parseDateParam("2026-05-20");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4); // 0-indexed
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("undefined → equivale a startOfToday()", () => {
    const result = parseDateParam(undefined);
    const today = startOfToday();
    expect(result.getTime()).toBe(today.getTime());
  });

  it("cadena inválida → equivale a startOfToday()", () => {
    const result = parseDateParam("not-a-date");
    const today = startOfToday();
    expect(result.getTime()).toBe(today.getTime());
  });

  it('fecha imposible "2026-13-99" → equivale a startOfToday()', () => {
    const result = parseDateParam("2026-13-99");
    const today = startOfToday();
    expect(result.getTime()).toBe(today.getTime());
  });

  it("cadena vacía → equivale a startOfToday()", () => {
    const result = parseDateParam("");
    const today = startOfToday();
    expect(result.getTime()).toBe(today.getTime());
  });
});

// ─── isPastDate ───────────────────────────────────────────────────────────────

describe("isPastDate", () => {
  it("ayer → true", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    expect(isPastDate(yesterday)).toBe(true);
  });

  it("hoy → false", () => {
    const today = startOfToday();
    expect(isPastDate(today)).toBe(false);
  });

  it("mañana → false", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    expect(isPastDate(tomorrow)).toBe(false);
  });

  it("hoy a las 23:59:59 → false (mismo día)", () => {
    const todayLate = startOfToday();
    todayLate.setHours(23, 59, 59, 999);
    expect(isPastDate(todayLate)).toBe(false);
  });
});

// ─── getWeekBounds ────────────────────────────────────────────────────────────

describe("getWeekBounds", () => {
  it("miércoles → start es el lunes de esa semana a las 00:00", () => {
    // 2026-05-20 is a Wednesday
    const wednesday = new Date("2026-05-20T12:00:00");
    const { start } = getWeekBounds(wednesday);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(4); // May = 4
    expect(start.getDate()).toBe(18); // Monday 18 May
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  it("miércoles → end es el lunes siguiente a las 00:00 (exclusive upper bound)", () => {
    const wednesday = new Date("2026-05-20T12:00:00");
    const { end } = getWeekBounds(wednesday);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(4);
    expect(end.getDate()).toBe(25); // Monday 25 May (exclusive)
    expect(end.getHours()).toBe(0);
  });

  it("lunes → start es el mismo lunes", () => {
    const monday = new Date("2026-05-18T10:00:00");
    const { start } = getWeekBounds(monday);
    expect(start.getDate()).toBe(18);
  });

  it("domingo → start es el lunes de esa semana", () => {
    // 2026-05-24 is a Sunday
    const sunday = new Date("2026-05-24T10:00:00");
    const { start } = getWeekBounds(sunday);
    expect(start.getDate()).toBe(18); // Monday 18 May
  });
});

// ─── dayOfWeekMondayFirst ─────────────────────────────────────────────────────

describe("dayOfWeekMondayFirst", () => {
  it("lunes → 0", () => {
    const monday = new Date("2026-05-18");
    expect(dayOfWeekMondayFirst(monday)).toBe(0);
  });

  it("martes → 1", () => {
    const tuesday = new Date("2026-05-19");
    expect(dayOfWeekMondayFirst(tuesday)).toBe(1);
  });

  it("miércoles → 2", () => {
    const wednesday = new Date("2026-05-20");
    expect(dayOfWeekMondayFirst(wednesday)).toBe(2);
  });

  it("domingo → 6", () => {
    const sunday = new Date("2026-05-24");
    expect(dayOfWeekMondayFirst(sunday)).toBe(6);
  });
});
