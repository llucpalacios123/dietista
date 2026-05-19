import type { Page } from "@playwright/test";

// ─── Meal Plan Generation Mocks ─────────────────────────────────────────────

/**
 * Mocks POST /api/meal-plans/generate to return a 202 Accepted with a
 * deterministic job ID. Returns the job ID for use with `mockJobStatus`.
 */
export async function mockMealPlanGeneration(
  page: Page,
  jobId?: string
): Promise<string> {
  const id = jobId ?? `job-test-${Date.now()}`;
  await page.route("**/api/meal-plans/generate", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ data: { jobId: id, status: "pending" } }),
    });
  });
  return id;
}

/**
 * Mocks GET /api/meal-plans/jobs/{jobId} to return staged status responses.
 * Each poll request advances to the next stage in the provided array.
 *
 * Default stages: pending → processing → completed
 */
export async function mockJobStatus(
  page: Page,
  jobId: string,
  stages: Array<"pending" | "processing" | "completed" | "failed"> = [
    "pending",
    "processing",
    "completed",
  ]
): Promise<void> {
  let callCount = 0;
  await page.route(`**/api/meal-plans/jobs/${jobId}`, async (route) => {
    const stageIndex = Math.min(callCount, stages.length - 1);
    const status = stages[stageIndex];
    callCount++;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          jobId,
          status,
          mealPlanId:
            status === "completed" ? `mp-${jobId}` : undefined,
          error: status === "failed" ? "AI generation failed" : undefined,
        },
      }),
    });
  });
}

// ─── Failure Mocks ──────────────────────────────────────────────────────────

/** Mocks the generate endpoint to return a 500 server error. */
export async function mockMealPlanGenerationFailure(
  page: Page
): Promise<void> {
  await page.route("**/api/meal-plans/generate", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Internal server error",
      }),
    });
  });
}

/** Mocks the generate endpoint to return a 429 rate-limit error. */
export async function mockRateLimit(page: Page): Promise<void> {
  await page.route("**/api/meal-plans/generate", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        message:
          "Please wait 45 minutes before generating another plan",
      }),
    });
  });
}

// ─── Meal Plan Data Mock (for GET /api/meal-plans) ──────────────────────────

/**
 * Mocks GET /api/meal-plans to return a fully-populated active meal plan
 * with meals across multiple days. Used after job polling completes so the
 * meal-plan page can render the result.
 */
export async function mockActiveMealPlan(
  page: Page,
  planId?: string
): Promise<void> {
  const id = planId ?? `mp-test-${Date.now()}`;
  const today = new Date();
  const startDate = new Date(today);
  // Monday of current week
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(today.getDate() + mondayOffset);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  await page.route("**/api/meal-plans", async (route) => {
    // Only mock the GET (not POSTs to /api/meal-plans/generate etc.)
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }

    const meals = buildMockMeals(id);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: "draft",
          totalCalories: meals.reduce((s, m) => s + m.calories, 0),
          meals,
        },
      }),
    });
  });
}

function buildMockMeals(planId: string) {
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
  const meals = [];

  for (let day = 0; day < 7; day++) {
    for (const type of mealTypes) {
      meals.push({
        id: `meal-${planId}-${day}-${type}`,
        mealPlanId: planId,
        dayOfWeek: day,
        mealType: type,
        name: `${capitalize(type)} Day ${day + 1}`,
        description: `Mock ${type} for day ${day + 1}`,
        calories: 450,
        protein: 35,
        carbs: 45,
        fat: 12,
      });
    }
  }

  return meals;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Unmock Helpers ─────────────────────────────────────────────────────────

/** Removes all route mocks registered on this page. */
export async function clearAllMocks(page: Page): Promise<void> {
  await page.unrouteAll({ behavior: "ignoreErrors" });
}
