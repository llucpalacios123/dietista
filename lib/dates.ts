/**
 * Locale-aware date formatting utilities.
 *
 * These replace hardcoded `toLocaleDateString("es-AR", ...)` calls
 * with locale-aware formatters driven by the user's current locale.
 */

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns today at midnight local time (server TZ).
 */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parse a "YYYY-MM-DD" string to a Date at midnight local time.
 * Falls back to startOfToday() if raw is undefined, empty, or invalid.
 */
export function parseDateParam(raw: string | undefined): Date {
  if (!raw) return startOfToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return startOfToday();
  const d = new Date(`${raw}T00:00:00`);
  if (isNaN(d.getTime())) return startOfToday();
  return d;
}

/**
 * Returns true if `date` is strictly before today midnight local time.
 * Compares day boundaries, not clock times.
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < startOfToday().getTime();
}

/**
 * Returns the day of the week with Monday=0 ... Sunday=6.
 */
export function dayOfWeekMondayFirst(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Returns { start: monday 00:00, end: following monday 00:00 }
 * for the week that contains `date`.
 */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const dow = dayOfWeekMondayFirst(date);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dow);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES",
  en: "en-GB",
};

/**
 * Format a date as a long weekday + day + month string.
 * e.g., "jueves, 21 de mayo de 2026" (es) or "Thursday, May 21, 2026" (en)
 */
export function formatDateLong(date: Date, locale: string): string {
  const l = LOCALE_MAP[locale] ?? locale;
  return date.toLocaleDateString(l, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Format a date as a short date string.
 * e.g., "21/5/2026" (es-AR) or "5/21/2026" (en-US)
 */
export function formatDateShort(date: Date, locale: string): string {
  const l = LOCALE_MAP[locale] ?? locale;
  return date.toLocaleDateString(l);
}

/**
 * Format a date with month and year.
 * e.g., "mayo de 2026" (es-AR) or "May 2026" (en-US)
 */
export function formatMonthYear(date: Date, locale: string): string {
  const l = LOCALE_MAP[locale] ?? locale;
  return date.toLocaleDateString(l, { month: "long", year: "numeric" });
}

/**
 * Get the day-of-week labels for the locale.
 * Returns array of 7 short weekday labels starting Monday.
 */
export function getDayLabels(locale: string): string[] {
  const l = LOCALE_MAP[locale] ?? locale;
  const now = new Date(2024, 0, 1); // Monday
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    labels.push(
      d.toLocaleDateString(l, { weekday: "short" }).replace(".", "")
    );
  }
  return labels;
}
