/**
 * Locale-aware date formatting utilities.
 *
 * These replace hardcoded `toLocaleDateString("es-AR", ...)` calls
 * with locale-aware formatters driven by the user's current locale.
 */

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
