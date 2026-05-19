/**
 * Deterministic test-data generators for E2E tests.
 *
 * Every call produces a unique value so tests remain isolated even when
 * they share the same database (fullyParallel: false guarantees sequential
 * execution with no interleaving of generator state).
 */

let counter = 0;

/** Pattern: e2e-{prefix}-{timestamp}-{random}-{counter}@test.com */
export function generateEmail(prefix = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  counter++;
  return `e2e-${prefix}-${timestamp}-${random}-${counter}@test.com`;
}

/**
 * Meets registerSchema requirements:
 *  - min 8 characters
 *  - at least one uppercase letter
 *  - at least one number
 */
export function generatePassword(): string {
  const base = "E2eTest";
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}${random}1!`;
}

/** Default profile form values (as strings, matching HTML form inputs). */
export function defaultProfileData(): Record<string, string> {
  return {
    weight: "70",
    height: "175",
    age: "30",
    sex: "male",
    goal: "lose",
    activityLevel: "moderate",
  };
}

/** Default meal-log form values. */
export function defaultMealLogData(): Record<string, string> {
  const today = new Date().toISOString().split("T")[0];
  return {
    date: today,
    mealType: "lunch",
    rawInput: "grilled chicken breast 200g, white rice 150g, green salad",
  };
}
